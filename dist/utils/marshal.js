// Utility functions for marshalling D2L API responses to LLM-friendly formats
// Strip HTML tags and decode entities
export function stripHtml(html) {
    if (!html)
        return '';
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
// Format date to readable string
export function formatDate(isoDate) {
    if (!isoDate)
        return null;
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}
// Format date relative to now
export function formatRelativeDate(isoDate) {
    if (!isoDate)
        return null;
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0)
        return 'today';
    if (diffDays === 1)
        return 'tomorrow';
    if (diffDays === -1)
        return 'yesterday';
    if (diffDays > 0 && diffDays <= 7)
        return `in ${diffDays} days`;
    if (diffDays < 0 && diffDays >= -7)
        return `${Math.abs(diffDays)} days ago`;
    return formatDate(isoDate);
}
// Format file size
export function formatFileSize(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
// Remove null, undefined, empty strings, and empty arrays from object
export function removeEmpty(obj) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined)
            continue;
        if (value === '')
            continue;
        if (Array.isArray(value) && value.length === 0)
            continue;
        result[key] = value;
    }
    return result;
}
export function marshalGrades(grades) {
    return grades.map((g) => removeEmpty({
        name: g.GradeObjectName,
        score: g.PointsNumerator !== null && g.PointsDenominator !== null
            ? `${g.PointsNumerator}/${g.PointsDenominator}`
            : null,
        percentage: g.DisplayedGrade?.trim() || null,
        feedback: g.Comments?.Text?.trim() || null,
        lastModified: formatDate(g.LastModified),
    }));
}
export function marshalAnnouncements(announcements) {
    return announcements.map((a) => removeEmpty({
        id: a.Id,
        title: a.Title,
        body: stripHtml(a.Body.Text || a.Body.Html),
        date: formatDate(a.CreatedDate),
        attachments: a.Attachments?.length > 0
            ? a.Attachments.map((att) => ({ name: att.FileName, size: formatFileSize(att.Size) }))
            : undefined,
    }));
}
export function marshalCalendarEvents(response) {
    return response.Objects.map((e) => {
        const entityType = e.AssociatedEntity?.AssociatedEntityType;
        let type = null;
        if (entityType?.includes('Dropbox'))
            type = 'assignment';
        else if (entityType?.includes('Quiz'))
            type = 'quiz';
        else if (entityType?.includes('Discussion'))
            type = 'discussion';
        else if (entityType)
            type = entityType.split('.').pop() || null;
        return removeEmpty({
            title: e.Title,
            dueDate: formatDate(e.StartDateTime),
            dueDateRelative: formatRelativeDate(e.StartDateTime),
            course: e.OrgUnitName,
            type,
            assignmentId: e.AssociatedEntity?.AssociatedEntityId || null,
            viewUrl: e.CalendarEventViewUrl,
            submitUrl: e.AssociatedEntity?.Link || null,
        });
    });
}
export function marshalEnrollments(response) {
    return response.Items
        .filter((e) => e.OrgUnit.Type.Code === 'Course Offering')
        .map((e) => removeEmpty({
        id: e.OrgUnit.Id,
        name: e.OrgUnit.Name,
        code: e.OrgUnit.Code,
        type: e.OrgUnit.Type.Name,
        homeUrl: e.OrgUnit.HomeUrl,
        isActive: e.Access.IsActive,
        canAccess: e.Access.CanAccess,
        lastAccessed: formatDate(e.Access.LastAccessed),
    }));
}
export function marshalAssignments(assignments) {
    return assignments.map((a) => marshalAssignment(a));
}
export function marshalAssignment(a) {
    let fileTypes = null;
    if (a.AllowableFileType === 0)
        fileTypes = 'any';
    else if (a.AllowableFileType === 5 && a.CustomAllowableFileTypes?.length) {
        fileTypes = a.CustomAllowableFileTypes.join(', ');
    }
    return removeEmpty({
        id: a.Id,
        name: a.Name,
        dueDate: formatDate(a.DueDate),
        dueDateRelative: formatRelativeDate(a.DueDate),
        points: a.Assessment?.ScoreDenominator ?? 0,
        instructions: stripHtml(a.CustomInstructions?.Text || a.CustomInstructions?.Html) || null,
        attachments: a.Attachments?.length > 0
            ? a.Attachments.map((att) => ({ name: att.FileName, size: formatFileSize(att.Size) }))
            : undefined,
        links: a.LinkAttachments?.length > 0
            ? a.LinkAttachments.map((l) => ({ name: l.Name, url: l.Url }))
            : undefined,
        allowedFileTypes: fileTypes,
    });
}
export function marshalSubmissions(submissions) {
    return submissions.map((s) => {
        const latestSubmission = s.Submissions?.[0];
        return removeEmpty({
            submitted: s.Status === 1,
            submittedBy: s.Entity.DisplayName,
            submissionDate: formatDate(latestSubmission?.SubmissionDate),
            submissionDateRelative: formatRelativeDate(latestSubmission?.SubmissionDate),
            files: latestSubmission?.Files?.map((f) => ({
                name: f.FileName,
                size: formatFileSize(f.Size),
            })) || [],
            comment: latestSubmission?.Comment?.Text?.trim() || null,
            grade: s.Feedback?.Score ?? null,
            feedback: stripHtml(s.Feedback?.Feedback?.Text || s.Feedback?.Feedback?.Html) || null,
        });
    });
}
export function marshalContentModules(modules) {
    return modules.map((m) => marshalContentModule(m));
}
export function marshalContentModule(m) {
    return removeEmpty({
        id: m.ModuleId,
        title: m.Title,
        description: stripHtml(m.Description?.Text || m.Description?.Html) || null,
        topics: m.Topics?.map((t) => removeEmpty({
            id: t.TopicId,
            title: t.Title,
            url: t.Url || null,
            type: t.TypeIdentifier || null,
        })),
        modules: m.Modules?.length ? marshalContentModules(m.Modules) : undefined,
    });
}
export function marshalToc(toc) {
    return marshalContentModules(toc.Modules || []);
}
export function marshalTopic(t) {
    return removeEmpty({
        id: t.TopicId,
        title: t.Title,
        description: stripHtml(t.Description?.Text || t.Description?.Html) || null,
        url: t.Url || null,
        type: t.TypeIdentifier || null,
    });
}
