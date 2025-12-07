export declare function downloadFile(url: string, savePath?: string): Promise<{
    path: string;
    filename: string;
    size: number;
    contentType: string;
    content: string | null;
}>;
