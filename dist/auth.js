import "dotenv/config";
import { chromium } from "playwright";
import { homedir } from "os";
import { join } from "path";
import { existsSync } from "fs";
const SESSION_PATH = join(homedir(), ".d2l-session");
const D2L_HOST = process.env.D2L_HOST || "learn.ul.ie";
const D2L_USERNAME = process.env.D2L_USERNAME;
const D2L_PASSWORD = process.env.D2L_PASSWORD;
const HOME_URL = `https://${D2L_HOST}/d2l/home`;
let tokenCache = { token: "", expiresAt: 0 };
function isLoginPage(url) {
    return (url.includes("login") ||
        url.includes("microsoftonline") ||
        url.includes("sso") ||
        url.includes("adfs"));
}
export async function getToken() {
    const authStartTime = Date.now();
    // Return cached token if still valid (with 5 min buffer)
    if (tokenCache.token && Date.now() < tokenCache.expiresAt - 300000) {
        const cacheTime = Date.now() - authStartTime;
        const timeUntilExpiry = tokenCache.expiresAt - Date.now();
        console.error(`[AUTH] Token cache hit (${cacheTime}ms, expires in ${Math.round(timeUntilExpiry / 1000)}s)`);
        return tokenCache.token;
    }
    console.error(`[AUTH] Token cache miss - refreshing token`);
    const hasExistingSession = existsSync(SESSION_PATH);
    console.error(`[AUTH] Existing session file: ${hasExistingSession ? "yes" : "no"}`);
    // Always try headless first if session exists - only show browser if login needed
    const browserStartTime = Date.now();
    let context = await chromium.launchPersistentContext(SESSION_PATH, {
        headless: hasExistingSession,
        viewport: { width: 1280, height: 720 },
    });
    const browserTime = Date.now() - browserStartTime;
    console.error(`[AUTH] Browser launched (headless: ${hasExistingSession}, ${browserTime}ms)`);
    try {
        const captureStartTime = Date.now();
        const result = await captureToken(context, hasExistingSession);
        const captureTime = Date.now() - captureStartTime;
        console.error(`[AUTH] Token captured (${captureTime}ms)`);
        // If we need to login and were running headless, restart with headed browser
        if (result.needsLogin && hasExistingSession) {
            await context.close();
            console.error("[AUTH] Session expired, opening browser for login...");
            const retryBrowserStartTime = Date.now();
            context = await chromium.launchPersistentContext(SESSION_PATH, {
                headless: false,
                viewport: { width: 1280, height: 720 },
            });
            const retryBrowserTime = Date.now() - retryBrowserStartTime;
            console.error(`[AUTH] Browser relaunched (headed, ${retryBrowserTime}ms)`);
            const retryCaptureStartTime = Date.now();
            const retryResult = await captureToken(context, false);
            const retryCaptureTime = Date.now() - retryCaptureStartTime;
            console.error(`[AUTH] Token captured on retry (${retryCaptureTime}ms)`);
            tokenCache = {
                token: retryResult.token,
                expiresAt: Date.now() + 3600000,
            };
            const totalTime = Date.now() - authStartTime;
            console.error(`[AUTH] Token refresh completed (${totalTime}ms)`);
            return retryResult.token;
        }
        tokenCache = {
            token: result.token,
            expiresAt: Date.now() + 3600000, // 1 hour
        };
        const totalTime = Date.now() - authStartTime;
        console.error(`[AUTH] Token refresh completed (${totalTime}ms)`);
        return result.token;
    }
    finally {
        const closeStartTime = Date.now();
        await context.close();
        const closeTime = Date.now() - closeStartTime;
        console.error(`[AUTH] Browser context closed (${closeTime}ms)`);
    }
}
async function captureToken(context, quickCheck) {
    const captureStartTime = Date.now();
    console.error(`[AUTH] Starting token capture (quickCheck: ${quickCheck})`);
    const page = await context.newPage();
    let capturedToken = "";
    // Listen for requests to capture Authorization header from any D2L API call
    page.on("request", (request) => {
        const url = request.url();
        if (url.includes("/d2l/api/")) {
            const auth = request.headers()["authorization"];
            if (auth?.startsWith("Bearer ")) {
                capturedToken = auth.slice(7);
                const captureTime = Date.now() - captureStartTime;
                console.error(`[AUTH] Token captured from API request to ${url} (${captureTime}ms)`);
            }
        }
    });
    // Go to home page
    const navigateStartTime = Date.now();
    console.error(`[AUTH] Navigating to ${HOME_URL}`);
    await page.goto(HOME_URL, { waitUntil: "networkidle" });
    const navigateTime = Date.now() - navigateStartTime;
    console.error(`[AUTH] Navigation completed (${navigateTime}ms)`);
    // Check if we're on login page
    let currentUrl = page.url();
    const isOnLoginPage = isLoginPage(currentUrl);
    console.error(`[AUTH] Current URL: ${currentUrl}, Is login page: ${isOnLoginPage}`);
    if (isOnLoginPage) {
        console.error(`[AUTH] Login required`);
        // If username and password are provided via env vars, use them for login
        if (D2L_USERNAME && D2L_PASSWORD) {
            console.error(`[AUTH] Attempting automated login with credentials`);
            try {
                // Try to find and fill username field (common selectors)
                const usernameSelectors = [
                    'input[placeholder*="username" i]',
                    'input[placeholder*="user" i]',
                    'input[placeholder*="MyCarletonOne" i]',
                    'input[name="userName"]',
                    'input[name="username"]',
                    'input[name="user"]',
                    'input[type="text"][id*="user"]',
                    'input[type="text"][id*="User"]',
                    "input#userName",
                    "input#username",
                ];
                const passwordSelectors = [
                    'input[type="password"][placeholder*="password" i]',
                    'input[type="password"][placeholder*="Password" i]',
                    'input[name="password"]',
                    'input[name="passWord"]',
                    'input[type="password"]',
                    "input#password",
                    "input#passWord",
                ];
                let usernameField = null;
                let passwordField = null;
                // Try to find username field
                for (const selector of usernameSelectors) {
                    try {
                        const field = page.locator(selector);
                        if (await field.isVisible({ timeout: 2000 })) {
                            usernameField = field;
                            break;
                        }
                    }
                    catch {
                        continue;
                    }
                }
                // Try to find password field
                for (const selector of passwordSelectors) {
                    try {
                        const field = page.locator(selector);
                        if (await field.isVisible({ timeout: 2000 })) {
                            passwordField = field;
                            break;
                        }
                    }
                    catch {
                        continue;
                    }
                }
                if (usernameField && passwordField) {
                    // Fill in credentials
                    await usernameField.fill(D2L_USERNAME);
                    await passwordField.fill(D2L_PASSWORD);
                    // Try to find and click submit button
                    const submitSelectors = [
                        'button[type="submit"]',
                        'input[type="submit"]',
                        'button:has-text("Log in")',
                        'button:has-text("Login")',
                        'button:has-text("Sign in")',
                        'button:has-text("Sign In")',
                        "form button",
                        'form input[type="submit"]',
                    ];
                    let submitted = false;
                    for (const selector of submitSelectors) {
                        try {
                            const submitButton = page.locator(selector).first();
                            if (await submitButton.isVisible({ timeout: 2000 })) {
                                await submitButton.click();
                                submitted = true;
                                break;
                            }
                        }
                        catch {
                            continue;
                        }
                    }
                    // If no submit button found, try pressing Enter
                    if (!submitted) {
                        await passwordField.press("Enter");
                    }
                    // Wait for navigation away from login page
                    const loginWaitStartTime = Date.now();
                    await page.waitForURL((url) => !isLoginPage(url.toString()), {
                        timeout: quickCheck ? 30000 : 60000,
                    });
                    await page.waitForLoadState("networkidle");
                    const loginWaitTime = Date.now() - loginWaitStartTime;
                    console.error(`[AUTH] Login completed (${loginWaitTime}ms)`);
                }
                else {
                    // If we can't find the fields, try SSO button as fallback
                    throw new Error("Could not find login form fields");
                }
            }
            catch (error) {
                // Fall back to SSO button click if form login fails
                console.error("Form login failed, trying SSO button:", error);
                try {
                    const ssoButton = page.locator('button.d2l-button-sso-1, button:has-text("Student & Staff Login")');
                    if (await ssoButton.isVisible({ timeout: 2000 })) {
                        await ssoButton.click();
                        await page.waitForURL((url) => !isLoginPage(url.toString()), {
                            timeout: quickCheck ? 15000 : 60000,
                        });
                        await page.waitForLoadState("networkidle");
                    }
                }
                catch {
                    if (quickCheck) {
                        await page.close();
                        return { token: "", needsLogin: true };
                    }
                }
            }
        }
        else {
            // No credentials provided, try SSO button
            try {
                const ssoButton = page.locator('button.d2l-button-sso-1, button:has-text("Student & Staff Login")');
                if (await ssoButton.isVisible({ timeout: 2000 })) {
                    await ssoButton.click();
                    // Wait for SSO redirect and completion
                    await page.waitForURL((url) => !isLoginPage(url.toString()), {
                        timeout: quickCheck ? 15000 : 60000,
                    });
                    await page.waitForLoadState("networkidle");
                }
            }
            catch {
                // SSO auto-login failed (needs user interaction)
                if (quickCheck) {
                    await page.close();
                    return { token: "", needsLogin: true };
                }
            }
        }
    }
    // Wait for token capture
    const maxWait = quickCheck ? 10000 : 120000;
    const waitStartTime = Date.now();
    console.error(`[AUTH] Waiting for token capture (max wait: ${maxWait}ms)`);
    while (Date.now() - waitStartTime < maxWait) {
        currentUrl = page.url();
        if (!isLoginPage(currentUrl)) {
            // We're logged in, wait for API calls
            if (!capturedToken) {
                console.error(`[AUTH] Token not captured yet, waiting and scrolling...`);
                await page.waitForTimeout(2000);
                // Try scrolling to trigger more API calls
                await page.evaluate(() => window.scrollBy(0, 100));
                await page.waitForTimeout(1000);
            }
            if (capturedToken) {
                const waitTime = Date.now() - waitStartTime;
                console.error(`[AUTH] Token captured after waiting (${waitTime}ms)`);
                break;
            }
        }
        else if (!quickCheck) {
            // Wait for user to login
            await page.waitForTimeout(2000);
        }
        else {
            break;
        }
    }
    const closePageStartTime = Date.now();
    await page.close();
    const closePageTime = Date.now() - closePageStartTime;
    console.error(`[AUTH] Page closed (${closePageTime}ms)`);
    if (!capturedToken) {
        const totalTime = Date.now() - captureStartTime;
        if (quickCheck) {
            console.error(`[AUTH] Token capture failed (quickCheck mode, ${totalTime}ms) - needs login`);
            return { token: "", needsLogin: true };
        }
        console.error(`[AUTH] Token capture failed (${totalTime}ms)`);
        throw new Error("Failed to capture authentication token. Please try again.");
    }
    const totalTime = Date.now() - captureStartTime;
    console.error(`[AUTH] Token capture successful (${totalTime}ms)`);
    return { token: capturedToken, needsLogin: false };
}
export async function refreshTokenIfNeeded() {
    return getToken();
}
export function clearTokenCache() {
    tokenCache = { token: "", expiresAt: 0 };
}
export function getTokenExpiry() {
    return tokenCache.expiresAt;
}
export async function getAuthenticatedContext() {
    const hasExistingSession = existsSync(SESSION_PATH);
    let context = await chromium.launchPersistentContext(SESSION_PATH, {
        headless: hasExistingSession,
        viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();
    // Go to home to check auth status
    await page.goto(HOME_URL, { waitUntil: "domcontentloaded" });
    let currentUrl = page.url();
    if (isLoginPage(currentUrl)) {
        // If username and password are provided via env vars, use them for login
        if (D2L_USERNAME && D2L_PASSWORD) {
            try {
                // Try to find and fill username field
                const usernameSelectors = [
                    'input[placeholder*="username" i]',
                    'input[placeholder*="user" i]',
                    'input[placeholder*="MyCarletonOne" i]',
                    'input[name="userName"]',
                    'input[name="username"]',
                    'input[name="user"]',
                    'input[type="text"][id*="user"]',
                    'input[type="text"][id*="User"]',
                    "input#userName",
                    "input#username",
                ];
                const passwordSelectors = [
                    'input[type="password"][placeholder*="password" i]',
                    'input[type="password"][placeholder*="Password" i]',
                    'input[name="password"]',
                    'input[name="passWord"]',
                    'input[type="password"]',
                    "input#password",
                    "input#passWord",
                ];
                let usernameField = null;
                let passwordField = null;
                for (const selector of usernameSelectors) {
                    try {
                        const field = page.locator(selector);
                        if (await field.isVisible({ timeout: 2000 })) {
                            usernameField = field;
                            break;
                        }
                    }
                    catch {
                        continue;
                    }
                }
                for (const selector of passwordSelectors) {
                    try {
                        const field = page.locator(selector);
                        if (await field.isVisible({ timeout: 2000 })) {
                            passwordField = field;
                            break;
                        }
                    }
                    catch {
                        continue;
                    }
                }
                if (usernameField && passwordField) {
                    await usernameField.fill(D2L_USERNAME);
                    await passwordField.fill(D2L_PASSWORD);
                    const submitSelectors = [
                        'button[type="submit"]',
                        'input[type="submit"]',
                        'button:has-text("Log in")',
                        'button:has-text("Login")',
                        "form button",
                    ];
                    let submitted = false;
                    for (const selector of submitSelectors) {
                        try {
                            const submitButton = page.locator(selector).first();
                            if (await submitButton.isVisible({ timeout: 2000 })) {
                                await submitButton.click();
                                submitted = true;
                                break;
                            }
                        }
                        catch {
                            continue;
                        }
                    }
                    if (!submitted) {
                        await passwordField.press("Enter");
                    }
                    await page.waitForURL((url) => !isLoginPage(url.toString()), {
                        timeout: 60000,
                    });
                    await page.waitForLoadState("domcontentloaded");
                }
            }
            catch (error) {
                console.error("Form login failed:", error);
            }
        }
        else {
            // No credentials provided, try SSO button
            try {
                const ssoButton = page.locator('button.d2l-button-sso-1, button:has-text("Student & Staff Login")');
                if (await ssoButton.isVisible({ timeout: 2000 })) {
                    await ssoButton.click();
                    await page.waitForURL((url) => !isLoginPage(url.toString()), {
                        timeout: hasExistingSession ? 15000 : 60000,
                    });
                    await page.waitForLoadState("domcontentloaded");
                }
            }
            catch {
                // If headless failed to auto-login, restart with visible browser
                if (hasExistingSession) {
                    await context.close();
                    console.error("Session expired, opening browser for login...");
                    context = await chromium.launchPersistentContext(SESSION_PATH, {
                        headless: false,
                        viewport: { width: 1280, height: 720 },
                    });
                    const newPage = await context.newPage();
                    await newPage.goto(HOME_URL, { waitUntil: "domcontentloaded" });
                    // Wait for user to complete login
                    await newPage.waitForURL((url) => !isLoginPage(url.toString()), {
                        timeout: 120000,
                    });
                    await newPage.close();
                }
            }
        }
    }
    await page.close();
    return context;
}
