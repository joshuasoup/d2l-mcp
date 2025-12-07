import { z } from 'zod';
import { client } from '../client.js';
import { marshalToc, marshalTopic, marshalContentModules, marshalContentModule } from '../utils/marshal.js';
const DEFAULT_COURSE_ID = process.env.D2L_COURSE_ID ? parseInt(process.env.D2L_COURSE_ID) : undefined;
function getOrgUnitId(orgUnitId) {
    const id = orgUnitId ?? DEFAULT_COURSE_ID;
    if (!id) {
        throw new Error('No course ID provided and D2L_COURSE_ID environment variable not set');
    }
    return id;
}
export const contentTools = {
    get_course_content: {
        description: `Get the complete course syllabus/structure including all modules, topics, lectures, and learning materials. Returns module titles, descriptions, topic names with URLs, and linked assignments. Use to answer: "What's in this course?", "Show me the syllabus", "What topics are covered?", "What lectures are available?", "What reading materials do I have?"`,
        schema: {
            orgUnitId: z.number().optional().describe('The course ID. Optional if D2L_COURSE_ID env var is set.'),
        },
        handler: async ({ orgUnitId }) => {
            const toc = await client.getContentToc(getOrgUnitId(orgUnitId));
            return JSON.stringify(marshalToc(toc), null, 2);
        },
    },
    get_course_topic: {
        description: `Get details about a specific course topic/lecture/reading including title, description, URL, and linked assignments. Use after get_course_content to get more info about a specific item.`,
        schema: {
            orgUnitId: z.number().optional().describe('The course ID. Optional if D2L_COURSE_ID env var is set.'),
            topicId: z.number().describe('The TopicId from get_course_content. Example: 968299'),
        },
        handler: async ({ orgUnitId, topicId }) => {
            const topic = await client.getContentTopic(getOrgUnitId(orgUnitId), topicId);
            return JSON.stringify(marshalTopic(topic), null, 2);
        },
    },
    get_course_modules: {
        description: `Get the main sections/modules of a course. Returns module names, descriptions, and ModuleIds. Use for a high-level overview of course organization.`,
        schema: {
            orgUnitId: z.number().optional().describe('The course ID. Optional if D2L_COURSE_ID env var is set.'),
        },
        handler: async ({ orgUnitId }) => {
            const modules = await client.getContentModules(getOrgUnitId(orgUnitId));
            return JSON.stringify(marshalContentModules(modules), null, 2);
        },
    },
    get_course_module: {
        description: `Get all contents within a specific course module/section including child topics, sub-modules, and materials. Use to explore one section of the course in detail.`,
        schema: {
            orgUnitId: z.number().optional().describe('The course ID. Optional if D2L_COURSE_ID env var is set.'),
            moduleId: z.number().describe('The ModuleId from get_course_modules or get_course_content. Example: 968296'),
        },
        handler: async ({ orgUnitId, moduleId }) => {
            const structure = await client.getContentModule(getOrgUnitId(orgUnitId), moduleId);
            return JSON.stringify(marshalContentModule(structure), null, 2);
        },
    },
};
