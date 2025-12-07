import { z } from 'zod';
export declare const contentTools: {
    get_course_content: {
        description: string;
        schema: {
            orgUnitId: z.ZodOptional<z.ZodNumber>;
        };
        handler: ({ orgUnitId }: {
            orgUnitId?: number;
        }) => Promise<string>;
    };
    get_course_topic: {
        description: string;
        schema: {
            orgUnitId: z.ZodOptional<z.ZodNumber>;
            topicId: z.ZodNumber;
        };
        handler: ({ orgUnitId, topicId }: {
            orgUnitId?: number;
            topicId: number;
        }) => Promise<string>;
    };
    get_course_modules: {
        description: string;
        schema: {
            orgUnitId: z.ZodOptional<z.ZodNumber>;
        };
        handler: ({ orgUnitId }: {
            orgUnitId?: number;
        }) => Promise<string>;
    };
    get_course_module: {
        description: string;
        schema: {
            orgUnitId: z.ZodOptional<z.ZodNumber>;
            moduleId: z.ZodNumber;
        };
        handler: ({ orgUnitId, moduleId }: {
            orgUnitId?: number;
            moduleId: number;
        }) => Promise<string>;
    };
};
