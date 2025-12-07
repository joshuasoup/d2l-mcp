import { z } from 'zod';
export declare const gradeTools: {
    get_my_grades: {
        description: string;
        schema: {
            orgUnitId: z.ZodOptional<z.ZodNumber>;
        };
        handler: (args: {
            orgUnitId?: number;
        }) => Promise<string>;
    };
};
