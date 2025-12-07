import { getToken } from "./auth.js";

const D2L_HOST = process.env.D2L_HOST || "learn.ul.ie";
const BASE_URL = `https://${D2L_HOST}`;
const API_VERSION = "1.57";

interface ApiResponse<T = unknown> {
  data: T;
  status: number;
}

export class D2LClient {
  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const requestStartTime = Date.now();
    const url = `${BASE_URL}${path}`;

    console.error(`[API] Starting ${method} request to: ${path}`);

    const tokenStartTime = Date.now();
    const token = await getToken();
    const tokenTime = Date.now() - tokenStartTime;
    console.error(`[API] Token obtained (${tokenTime}ms)`);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const fetchStartTime = Date.now();
    const response = await fetch(url, options);
    const fetchTime = Date.now() - fetchStartTime;

    console.error(
      `[API] ${method} ${path} - Status: ${response.status} (${fetchTime}ms)`
    );

    if (!response.ok) {
      const errorText = await response.text();
      const totalTime = Date.now() - requestStartTime;
      console.error(
        `[API] ${method} ${path} - Error ${response.status} (${totalTime}ms): ${errorText}`
      );
      throw new Error(`D2L API error ${response.status}: ${errorText}`);
    }

    const parseStartTime = Date.now();
    const data = (await response.json()) as T;
    const parseTime = Date.now() - parseStartTime;
    const totalTime = Date.now() - requestStartTime;

    console.error(
      `[API] ${method} ${path} - Completed (parse: ${parseTime}ms, total: ${totalTime}ms)`
    );

    return { data, status: response.status };
  }

  async get<T>(path: string): Promise<T> {
    const { data } = await this.request<T>("GET", path);
    return data;
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const { data } = await this.request<T>("POST", path, body);
    return data;
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const { data } = await this.request<T>("PUT", path, body);
    return data;
  }

  async delete<T>(path: string): Promise<T> {
    const { data } = await this.request<T>("DELETE", path);
    return data;
  }

  // Dropbox/Assignment endpoints
  async getDropboxFolders(orgUnitId: number) {
    return this.get(`/d2l/api/le/${API_VERSION}/${orgUnitId}/dropbox/folders/`);
  }

  async getDropboxFolder(orgUnitId: number, folderId: number) {
    return this.get(
      `/d2l/api/le/${API_VERSION}/${orgUnitId}/dropbox/folders/${folderId}`
    );
  }

  async getDropboxSubmissions(orgUnitId: number, folderId: number) {
    return this.get(
      `/d2l/api/le/${API_VERSION}/${orgUnitId}/dropbox/folders/${folderId}/submissions/`
    );
  }

  // Content endpoints
  async getContentToc(orgUnitId: number) {
    return this.get(`/d2l/api/le/${API_VERSION}/${orgUnitId}/content/toc`);
  }

  async getContentTopic(orgUnitId: number, topicId: number) {
    return this.get(
      `/d2l/api/le/${API_VERSION}/${orgUnitId}/content/topics/${topicId}`
    );
  }

  async getContentModules(orgUnitId: number) {
    return this.get(`/d2l/api/le/${API_VERSION}/${orgUnitId}/content/root/`);
  }

  async getContentModule(orgUnitId: number, moduleId: number) {
    return this.get(
      `/d2l/api/le/${API_VERSION}/${orgUnitId}/content/modules/${moduleId}/structure/`
    );
  }

  // User info
  async whoami() {
    return this.get(`/d2l/api/lp/1.43/users/whoami`);
  }

  // Grades endpoints
  async getMyGradeValues(orgUnitId: number) {
    return this.get(
      `/d2l/api/le/${API_VERSION}/${orgUnitId}/grades/values/myGradeValues/`
    );
  }

  async getGradeObjects(orgUnitId: number) {
    return this.get(`/d2l/api/le/${API_VERSION}/${orgUnitId}/grades/`);
  }

  // Calendar endpoints
  async getMyCalendarEvents(
    orgUnitId: number,
    startDateTime: string,
    endDateTime: string
  ) {
    const params = new URLSearchParams({
      startDateTime,
      endDateTime,
    });
    return this.get(
      `/d2l/api/le/${API_VERSION}/${orgUnitId}/calendar/events/myEvents/?${params}`
    );
  }

  // News/Announcements endpoints
  async getNews(orgUnitId: number) {
    return this.get(`/d2l/api/le/${API_VERSION}/${orgUnitId}/news/`);
  }

  // Enrollments endpoints (uses LP API v1.43)
  async getMyEnrollments() {
    return this.get(`/d2l/api/lp/1.43/enrollments/myenrollments/`);
  }
}

export const client = new D2LClient();
