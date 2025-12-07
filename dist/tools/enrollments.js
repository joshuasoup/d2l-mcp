import { client } from '../client.js';
import { marshalEnrollments } from '../utils/marshal.js';
export const enrollmentTools = {
    get_my_courses: {
        description: `List all courses you're enrolled in. Returns: course name, course code, org unit ID (needed for other tools), access status, start/end dates. Use to answer: "What courses am I in?", "Show my classes", "What's the course ID for X?", "List my enrollments"`,
        schema: {},
        handler: async () => {
            const enrollments = await client.getMyEnrollments();
            return JSON.stringify(marshalEnrollments(enrollments), null, 2);
        },
    },
};
