export declare function stripHtml(html: string | null | undefined): string;
export declare function formatDate(isoDate: string | null | undefined): string | null;
export declare function formatRelativeDate(isoDate: string | null | undefined): string | null;
export declare function formatFileSize(bytes: number): string;
export declare function removeEmpty<T extends Record<string, unknown>>(obj: T): Partial<T>;
export interface RawGrade {
    PointsNumerator: number | null;
    PointsDenominator: number | null;
    GradeObjectName: string;
    DisplayedGrade: string | null;
    Comments?: {
        Text: string;
        Html: string;
    };
    LastModified: string | null;
}
export interface MarshalledGrade {
    name: string;
    score: string | null;
    percentage: string | null;
    feedback: string | null;
    lastModified: string | null;
}
export declare function marshalGrades(grades: RawGrade[]): MarshalledGrade[];
export interface RawAnnouncement {
    Id: number;
    Title: string;
    Body: {
        Text: string;
        Html: string;
    };
    CreatedDate: string;
    StartDate: string | null;
    Attachments: Array<{
        FileName: string;
        Size: number;
    }>;
    IsPublished: boolean;
}
export interface MarshalledAnnouncement {
    id: number;
    title: string;
    body: string;
    date: string | null;
    attachments?: Array<{
        name: string;
        size: string;
    }>;
}
export declare function marshalAnnouncements(announcements: RawAnnouncement[]): MarshalledAnnouncement[];
export interface RawCalendarEvent {
    CalendarEventId: number;
    Title: string;
    Description: string;
    StartDateTime: string;
    EndDateTime: string;
    CalendarEventViewUrl: string;
    OrgUnitName: string;
    AssociatedEntity?: {
        AssociatedEntityType: string;
        AssociatedEntityId: number;
        Link: string;
    };
}
export interface MarshalledDueDate {
    title: string;
    dueDate: string | null;
    dueDateRelative: string | null;
    course: string;
    type: string | null;
    assignmentId: number | null;
    viewUrl: string;
    submitUrl: string | null;
}
export declare function marshalCalendarEvents(response: {
    Objects: RawCalendarEvent[];
}): MarshalledDueDate[];
export interface RawEnrollment {
    OrgUnit: {
        Id: number;
        Type: {
            Code: string;
            Name: string;
        };
        Name: string;
        Code: string;
        HomeUrl: string;
    };
    Access: {
        IsActive: boolean;
        CanAccess: boolean;
        LastAccessed: string | null;
    };
}
export interface MarshalledCourse {
    id: number;
    name: string;
    code: string;
    type: string;
    homeUrl: string;
    isActive: boolean;
    canAccess: boolean;
    lastAccessed: string | null;
}
export declare function marshalEnrollments(response: {
    Items: RawEnrollment[];
}): MarshalledCourse[];
export interface RawAssignment {
    Id: number;
    Name: string;
    DueDate: string | null;
    CustomInstructions: {
        Text: string;
        Html: string;
    };
    Assessment: {
        ScoreDenominator: number;
    };
    Attachments: Array<{
        FileName: string;
        Size: number;
    }>;
    LinkAttachments: Array<{
        Name: string;
        Url: string;
    }>;
    AllowableFileType: number;
    CustomAllowableFileTypes: string[] | null;
}
export interface MarshalledAssignment {
    id: number;
    name: string;
    dueDate: string | null;
    dueDateRelative: string | null;
    points: number;
    instructions: string | null;
    attachments?: Array<{
        name: string;
        size: string;
    }>;
    links?: Array<{
        name: string;
        url: string;
    }>;
    allowedFileTypes: string | null;
}
export declare function marshalAssignments(assignments: RawAssignment[]): MarshalledAssignment[];
export declare function marshalAssignment(a: RawAssignment): MarshalledAssignment;
export interface RawSubmission {
    Entity: {
        DisplayName: string;
    };
    Status: number;
    Feedback: {
        Score: number | null;
        Feedback: {
            Text: string;
            Html: string;
        } | null;
    } | null;
    Submissions: Array<{
        Id: number;
        SubmissionDate: string;
        Comment: {
            Text: string;
        };
        Files: Array<{
            FileId: number;
            FileName: string;
            Size: number;
        }>;
    }>;
    CompletionDate: string | null;
}
export interface MarshalledSubmission {
    submitted: boolean;
    submittedBy: string;
    submissionDate: string | null;
    submissionDateRelative: string | null;
    files: Array<{
        name: string;
        size: string;
    }>;
    comment: string | null;
    grade: number | null;
    feedback: string | null;
}
export declare function marshalSubmissions(submissions: RawSubmission[]): MarshalledSubmission[];
export interface RawContentModule {
    ModuleId: number;
    Title: string;
    Description?: {
        Text: string;
        Html: string;
    };
    Topics?: RawContentTopic[];
    Modules?: RawContentModule[];
}
export interface RawContentTopic {
    TopicId: number;
    Title: string;
    Url?: string;
    TypeIdentifier?: string;
}
export interface MarshalledModule {
    id: number;
    title: string;
    description: string | null;
    topics?: MarshalledTopic[];
    modules?: MarshalledModule[];
}
export interface MarshalledTopic {
    id: number;
    title: string;
    url: string | null;
    type: string | null;
}
export declare function marshalContentModules(modules: RawContentModule[]): MarshalledModule[];
export declare function marshalContentModule(m: RawContentModule): MarshalledModule;
export interface RawTocModule {
    ModuleId: number;
    Title: string;
    Description?: {
        Text: string;
        Html: string;
    };
    Topics?: RawContentTopic[];
    Modules?: RawTocModule[];
}
export declare function marshalToc(toc: {
    Modules: RawTocModule[];
}): MarshalledModule[];
export interface RawTopic {
    TopicId: number;
    Title: string;
    Description?: {
        Text: string;
        Html: string;
    };
    Url?: string;
    TypeIdentifier?: string;
}
export interface MarshalledTopicDetail {
    id: number;
    title: string;
    description: string | null;
    url: string | null;
    type: string | null;
}
export declare function marshalTopic(t: RawTopic): MarshalledTopicDetail;
