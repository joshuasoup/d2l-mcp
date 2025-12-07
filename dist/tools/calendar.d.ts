import { z } from 'zod';
export declare const calendarTools: {
    get_upcoming_due_dates: {
        description: string;
        schema: {
            orgUnitId: z.ZodOptional<z.ZodNumber>;
            daysBack: z.ZodOptional<z.ZodNumber>;
            daysAhead: z.ZodOptional<z.ZodNumber>;
        };
        handler: (args: {
            orgUnitId?: number;
            daysBack?: number;
            daysAhead?: number;
        }) => Promise<string>;
    };
};
