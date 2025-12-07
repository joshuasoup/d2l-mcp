import { z } from 'zod';
import { client } from '../client.js';
import { marshalGrades, RawGrade } from '../utils/marshal.js';

const DEFAULT_COURSE_ID = process.env.D2L_COURSE_ID ? parseInt(process.env.D2L_COURSE_ID) : undefined;

function getOrgUnitId(provided?: number): number {
  const orgUnitId = provided ?? DEFAULT_COURSE_ID;
  if (!orgUnitId) {
    throw new Error('orgUnitId is required. Either provide it or set D2L_COURSE_ID environment variable.');
  }
  return orgUnitId;
}

export const gradeTools = {
  get_my_grades: {
    description: `Get your grades for a course. Returns all grade items with your scores, including: grade item name, points earned, points possible, percentage (DisplayedGrade), and any feedback comments. Use to answer: "What are my grades?", "What's my score on the quiz?", "How did I do on the assignment?", "What grade did I get?"`,
    schema: {
      orgUnitId: z.number().optional().describe('The course ID. Optional if D2L_COURSE_ID env var is set.'),
    },
    handler: async (args: { orgUnitId?: number }): Promise<string> => {
      const orgUnitId = getOrgUnitId(args.orgUnitId);
      const grades = await client.getMyGradeValues(orgUnitId) as RawGrade[];
      return JSON.stringify(marshalGrades(grades), null, 2);
    },
  },
};
