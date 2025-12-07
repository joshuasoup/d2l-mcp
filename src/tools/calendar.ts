import { z } from 'zod';
import { client } from '../client.js';
import { marshalCalendarEvents, RawCalendarEvent } from '../utils/marshal.js';

const DEFAULT_COURSE_ID = process.env.D2L_COURSE_ID ? parseInt(process.env.D2L_COURSE_ID) : undefined;

function getOrgUnitId(provided?: number): number {
  const orgUnitId = provided ?? DEFAULT_COURSE_ID;
  if (!orgUnitId) {
    throw new Error('orgUnitId is required. Either provide it or set D2L_COURSE_ID environment variable.');
  }
  return orgUnitId;
}

export const calendarTools = {
  get_upcoming_due_dates: {
    description: `Get calendar events and due dates for a course within a time range. Returns: event title, start/end date, associated entity (assignment, quiz, etc.), course name. By default returns events from 7 days ago to 30 days ahead. Use to answer: "What's due this week?", "When is the assignment due?", "What are my upcoming deadlines?", "What do I need to submit?"`,
    schema: {
      orgUnitId: z.number().optional().describe('The course ID. Optional if D2L_COURSE_ID env var is set.'),
      daysBack: z.number().optional().describe('Number of days in the past to include (default: 7)'),
      daysAhead: z.number().optional().describe('Number of days in the future to include (default: 30)'),
    },
    handler: async (args: { orgUnitId?: number; daysBack?: number; daysAhead?: number }): Promise<string> => {
      const orgUnitId = getOrgUnitId(args.orgUnitId);
      const daysBack = args.daysBack ?? 7;
      const daysAhead = args.daysAhead ?? 30;
      
      const now = new Date();
      const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
      const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
      
      const events = await client.getMyCalendarEvents(
        orgUnitId,
        startDate.toISOString(),
        endDate.toISOString()
      ) as { Objects: RawCalendarEvent[] };
      return JSON.stringify(marshalCalendarEvents(events), null, 2);
    },
  },
};
