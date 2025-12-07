import { z } from 'zod';
export declare const assignmentTools: {
    get_assignments: {
        description: string;
        schema: {
            orgUnitId: z.ZodOptional<z.ZodNumber>;
        };
        handler: ({ orgUnitId }: {
            orgUnitId?: number;
        }) => Promise<string>;
    };
    get_assignment: {
        description: string;
        schema: {
            orgUnitId: z.ZodOptional<z.ZodNumber>;
            assignmentId: z.ZodNumber;
        };
        handler: ({ orgUnitId, assignmentId }: {
            orgUnitId?: number;
            assignmentId: number;
        }) => Promise<string>;
    };
    get_assignment_submissions: {
        description: string;
        schema: {
            orgUnitId: z.ZodOptional<z.ZodNumber>;
            assignmentId: z.ZodNumber;
        };
        handler: ({ orgUnitId, assignmentId }: {
            orgUnitId?: number;
            assignmentId: number;
        }) => Promise<string>;
    };
};
