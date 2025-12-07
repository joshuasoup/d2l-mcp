import { z } from 'zod';
export declare const newsTools: {
    get_announcements: {
        description: string;
        schema: {
            orgUnitId: z.ZodOptional<z.ZodNumber>;
        };
        handler: (args: {
            orgUnitId?: number;
        }) => Promise<string>;
    };
};
