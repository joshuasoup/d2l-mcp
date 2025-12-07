import "dotenv/config";
import { BrowserContext } from "playwright";
export declare function getToken(): Promise<string>;
export declare function refreshTokenIfNeeded(): Promise<string>;
export declare function clearTokenCache(): void;
export declare function getTokenExpiry(): number;
export declare function getAuthenticatedContext(): Promise<BrowserContext>;
