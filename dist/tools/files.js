import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { getAuthenticatedContext } from '../auth.js';
import mammoth from 'mammoth';
const D2L_HOST = process.env.D2L_HOST || 'learn.ul.ie';
// Extract text content from various file types
async function extractContent(data, ext) {
    const lowerExt = ext.toLowerCase();
    // Text-based files - return as string
    if (['.txt', '.md', '.csv', '.json', '.xml', '.html', '.htm', '.css', '.js', '.ts', '.py', '.java', '.c', '.cpp', '.h'].includes(lowerExt)) {
        return data.toString('utf-8');
    }
    // Word documents - extract text with mammoth
    if (lowerExt === '.docx') {
        try {
            const result = await mammoth.extractRawText({ buffer: data });
            return result.value;
        }
        catch {
            return null;
        }
    }
    // For binary files, return null (could add base64 option later)
    return null;
}
export async function downloadFile(url, savePath) {
    // Ensure full URL
    const fullUrl = url.startsWith('http') ? url : `https://${D2L_HOST}${url}`;
    // Extract filename from URL
    const urlPath = new URL(fullUrl).pathname;
    const pathParts = urlPath.split('/');
    const urlFilename = decodeURIComponent(pathParts[pathParts.length - 1] || 'download');
    // Get authenticated browser context (handles SSO login if needed)
    const browser = await getAuthenticatedContext();
    try {
        const page = await browser.newPage();
        // Use the page's request API to fetch with cookies
        const response = await page.request.get(fullUrl);
        if (!response.ok()) {
            throw new Error(`Failed to download file: ${response.status()} ${response.statusText()}`);
        }
        // Get response body as buffer
        const data = await response.body();
        // Get content type and disposition from headers
        const contentType = response.headers()['content-type'] || 'application/octet-stream';
        const contentDisposition = response.headers()['content-disposition'] || '';
        // Extract filename from content-disposition or use URL filename
        let filename = urlFilename;
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch) {
            filename = filenameMatch[1].replace(/['"]/g, '');
        }
        // Determine where to save
        const downloadsDir = savePath && fs.existsSync(savePath) && fs.statSync(savePath).isDirectory()
            ? savePath
            : path.join(os.homedir(), 'Downloads');
        let finalPath = savePath && fs.existsSync(savePath) && !fs.statSync(savePath).isDirectory()
            ? savePath
            : path.join(downloadsDir, filename);
        // Handle filename collisions
        let counter = 1;
        const ext = path.extname(finalPath);
        const base = path.basename(finalPath, ext);
        const dirPath = path.dirname(finalPath);
        while (fs.existsSync(finalPath)) {
            finalPath = path.join(dirPath, `${base} (${counter})${ext}`);
            counter++;
        }
        // Write file
        fs.writeFileSync(finalPath, data);
        // Determine mime type from extension if content-type is generic
        const extToMime = {
            '.pdf': 'application/pdf',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.doc': 'application/msword',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.xls': 'application/vnd.ms-excel',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.zip': 'application/zip',
            '.txt': 'text/plain',
            '.html': 'text/html',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
        };
        const finalContentType = contentType.includes('octet-stream')
            ? (extToMime[ext.toLowerCase()] || contentType)
            : contentType;
        // Extract text content for supported file types
        const textContent = await extractContent(data, ext);
        return {
            path: finalPath,
            filename: path.basename(finalPath),
            size: data.length,
            contentType: finalContentType,
            content: textContent,
        };
    }
    finally {
        await browser.close();
    }
}
