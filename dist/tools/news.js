import { z } from 'zod';
import { client } from '../client.js';
import { marshalAnnouncements } from '../utils/marshal.js';
const DEFAULT_COURSE_ID = process.env.D2L_COURSE_ID ? parseInt(process.env.D2L_COURSE_ID) : undefined;
function getOrgUnitId(provided) {
    const orgUnitId = provided ?? DEFAULT_COURSE_ID;
    if (!orgUnitId) {
        throw new Error('orgUnitId is required. Either provide it or set D2L_COURSE_ID environment variable.');
    }
    return orgUnitId;
}
export const newsTools = {
    get_announcements: {
        description: `Get course announcements/news items from instructors. Returns: title, body (text and HTML), created date, author, attachments, whether it's pinned. Use to answer: "Any new announcements?", "What did the professor post?", "Are there any updates?", "What's the latest news?"`,
        schema: {
            orgUnitId: z.number().optional().describe('The course ID. Optional if D2L_COURSE_ID env var is set.'),
        },
        handler: async (args) => {
            const orgUnitId = getOrgUnitId(args.orgUnitId);
            const news = await client.getNews(orgUnitId);
            return JSON.stringify(marshalAnnouncements(news), null, 2);
        },
    },
};
