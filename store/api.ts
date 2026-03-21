import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { User } from '@/types/auth';
import type { Organization, Member } from '@/types/organization';
import type { Project } from '@/types/project';
import type { Task } from '@/types/task';
import type { Space } from '@/types/space';
import type { Notification, NotificationsResponse } from '@/types/notification';
import type { Invitation } from '@/types/invitation';
import type { ActivityLog } from '@/types/activity-log';
import type { Board, BoardColumn } from '@/types/board';
import type { Label } from '@/types/label';
import type { Comment } from '@/types/comment';
import type { IssueType } from '@/types/issue-type';
import type { CustomField, CustomFieldValue } from '@/types/custom-field';
import type { IssueLink } from '@/types/issue-link';
import type { Sprint, SprintTask } from '@/types/sprint';
import type { Workflow } from '@/types/workflow';
import type { Automation } from '@/types/automation';
import type { Integration } from '@/types/integration';
import type { SavedFilter } from '@/types/saved-filter';
import type { Dashboard } from '@/types/dashboard';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'include',
  prepareHeaders: (headers) => {
    headers.set('Content-Type', 'application/json');
    return headers;
  },
  responseHandler: async (response) => {
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      if (response.ok) {
        return data.data ?? data;
      }
      // Return parsed error data as-is so fetchBaseQuery sets error.status to the HTTP code
      return data;
    } catch {
      if (!response.ok) return { message: text || 'An error occurred' };
      return text;
    }
  },
});

// Mutex to prevent multiple simultaneous refresh requests
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Normalize error.data so catch blocks can always use error?.data?.message
function normalizeError(result: { error?: FetchBaseQueryError; data?: unknown; meta?: unknown }) {
  if (result.error) {
    const data = result.error.data;
    if (typeof data === 'string') {
      result.error.data = { message: data };
    } else if (data && typeof data === 'object' && !('message' in data) && 'error' in data) {
      // API returns { success: false, error: "..." } — normalize to { message: "..." }
      (data as Record<string, unknown>).message = (data as Record<string, unknown>).error;
    }
  }
  return result;
}

const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Don't try to refresh if we're already on an auth endpoint
    const url = typeof args === 'string' ? args : args.url;
    if (url === '/auth/refresh' || url === '/auth/login' || url === '/auth/register') {
      return normalizeError(result);
    }

    // Use mutex to avoid concurrent refresh calls
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = (async () => {
        const refreshResult = await rawBaseQuery(
          { url: '/auth/refresh', method: 'POST' },
          api,
          extraOptions
        );
        isRefreshing = false;
        refreshPromise = null;
        return !refreshResult.error;
      })();
    }

    const refreshed = await refreshPromise;

    if (refreshed) {
      // Retry the original request with new access token
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      // Refresh failed — reset state and redirect to login
      api.dispatch(apiSlice.util.resetApiState());
    }
  }

  return normalizeError(result);
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'Auth',
    'Organizations',
    'Members',
    'Projects',
    'Tasks',
    'Spaces',
    'Notifications',
    'Invitations',
    'ActivityLogs',
    'Notes',
    'Boards',
    'Labels',
    'Comments',
    'IssueTypes',
    'CustomFields',
    'IssueLinks',
    'Sprints',
    'Workflows',
    'Automations',
    'Integrations',
    'SavedFilters',
    'Dashboards',
  ],
  endpoints: (builder) => ({
    // ─── Auth ───
    getMe: builder.query<User, void>({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),
    login: builder.mutation<{ user: User }, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      invalidatesTags: ['Auth'],
    }),
    register: builder.mutation<{ user: User }, { name: string; email: string; password: string }>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      invalidatesTags: ['Auth'],
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      invalidatesTags: ['Auth', 'Organizations', 'Projects', 'Tasks', 'Notifications'],
    }),
    refreshToken: builder.mutation<void, void>({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
    }),
    forgotPassword: builder.mutation<void, { email: string }>({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),
    verifyOtp: builder.mutation<void, { email: string; otp: string; purpose?: string }>({
      query: (body) => ({ url: '/auth/verify-otp', method: 'POST', body }),
    }),
    resendOtp: builder.mutation<void, { email: string; purpose?: string }>({
      query: (body) => ({ url: '/auth/resend-otp', method: 'POST', body }),
    }),
    resetPassword: builder.mutation<void, { email: string; otp: string; newPassword: string }>({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),
    updateProfile: builder.mutation<User, { name?: string; email?: string; avatar?: string | null }>({
      query: (body) => ({ url: '/users/profile', method: 'PATCH', body }),
      invalidatesTags: ['Auth'],
    }),

    // ─── Organizations ───
    getOrganizations: builder.query<Organization[], void>({
      query: () => '/organizations',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Organizations' as const, id })), { type: 'Organizations', id: 'LIST' }]
          : [{ type: 'Organizations', id: 'LIST' }],
    }),
    getOrganization: builder.query<Organization, string>({
      query: (id) => `/organizations/${id}`,
      providesTags: (_, __, id) => [{ type: 'Organizations', id }],
    }),
    createOrganization: builder.mutation<Organization, { name: string; slug: string }>({
      query: (body) => ({ url: '/organizations', method: 'POST', body }),
      invalidatesTags: [{ type: 'Organizations', id: 'LIST' }],
    }),
    deleteOrganization: builder.mutation<void, string>({
      query: (id) => ({ url: `/organizations/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Organizations', id: 'LIST' }],
    }),

    // ─── Members ───
    getOrgMembers: builder.query<Member[], string>({
      query: (orgId) => `/organizations/${orgId}/members`,
      providesTags: (_, __, orgId) => [{ type: 'Members', id: orgId }],
    }),
    addOrgMember: builder.mutation<void, { orgId: string; email: string; role?: string }>({
      query: ({ orgId, ...body }) => ({ url: `/organizations/${orgId}/members/add`, method: 'POST', body }),
      invalidatesTags: (_, __, { orgId }) => [{ type: 'Members', id: orgId }],
    }),
    removeOrgMember: builder.mutation<void, { orgId: string; userId: string }>({
      query: ({ orgId, userId }) => ({ url: `/organizations/${orgId}/members/${userId}`, method: 'DELETE' }),
      invalidatesTags: (_, __, { orgId }) => [{ type: 'Members', id: orgId }],
    }),
    updateMemberRole: builder.mutation<void, { orgId: string; userId: string; role: string }>({
      query: ({ orgId, userId, ...body }) => ({ url: `/organizations/${orgId}/members/${userId}`, method: 'PATCH', body }),
      invalidatesTags: (_, __, { orgId }) => [{ type: 'Members', id: orgId }],
    }),

    // ─── Spaces ───
    getOrgSpaces: builder.query<Space[], string>({
      query: (orgId) => `/organizations/${orgId}/spaces`,
      providesTags: (result, _, orgId) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Spaces' as const, id })), { type: 'Spaces', id: `org-${orgId}` }]
          : [{ type: 'Spaces', id: `org-${orgId}` }],
    }),
    getSpace: builder.query<Space, string>({
      query: (id) => `/spaces/${id}`,
      providesTags: (_, __, id) => [{ type: 'Spaces', id }],
    }),
    createSpace: builder.mutation<Space, { name: string; description?: string; color?: string; icon?: string; organizationId: string }>({
      query: (body) => ({ url: '/spaces', method: 'POST', body }),
      invalidatesTags: (_, __, { organizationId }) => [{ type: 'Spaces', id: `org-${organizationId}` }],
    }),
    updateSpace: builder.mutation<Space, { id: string; name?: string; description?: string | null; color?: string; icon?: string }>({
      query: ({ id, ...body }) => ({ url: `/spaces/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Spaces', id }],
    }),
    deleteSpace: builder.mutation<void, string>({
      query: (id) => ({ url: `/spaces/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Spaces'],
    }),

    // ─── Projects ───
    getProjects: builder.query<Project[], void>({
      query: () => '/projects',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Projects' as const, id })), { type: 'Projects', id: 'LIST' }]
          : [{ type: 'Projects', id: 'LIST' }],
    }),
    getProject: builder.query<Project, string>({
      query: (id) => `/projects/${id}`,
      providesTags: (_, __, id) => [{ type: 'Projects', id }],
    }),
    getSpaceProjects: builder.query<Project[], string>({
      query: (spaceId) => `/spaces/${spaceId}/projects`,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Projects' as const, id })), { type: 'Projects', id: 'LIST' }]
          : [{ type: 'Projects', id: 'LIST' }],
    }),
    createProject: builder.mutation<Project, { name: string; description?: string; spaceId: string }>({
      query: (body) => ({ url: '/projects', method: 'POST', body }),
      invalidatesTags: [{ type: 'Projects', id: 'LIST' }, 'Spaces'],
    }),
    updateProject: builder.mutation<Project, { id: string; name?: string; description?: string | null }>({
      query: ({ id, ...body }) => ({ url: `/projects/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Projects', id }, { type: 'Projects', id: 'LIST' }],
    }),
    deleteProject: builder.mutation<void, string>({
      query: (id) => ({ url: `/projects/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Projects', id: 'LIST' }, 'Spaces'],
    }),

    // ─── Tasks ───
    getUserTasks: builder.query<Task[], void>({
      query: () => '/tasks',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Tasks' as const, id })), { type: 'Tasks', id: 'LIST' }]
          : [{ type: 'Tasks', id: 'LIST' }],
    }),
    getProjectTasks: builder.query<Task[], string>({
      query: (projectId) => `/projects/${projectId}/tasks`,
      providesTags: (result, _, projectId) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Tasks' as const, id })), { type: 'Tasks', id: `project-${projectId}` }]
          : [{ type: 'Tasks', id: `project-${projectId}` }],
    }),
    getTask: builder.query<Task, string>({
      query: (id) => `/tasks/${id}`,
      providesTags: (_, __, id) => [{ type: 'Tasks', id }],
    }),
    createTask: builder.mutation<Task, { title: string; description?: string; status?: string; priority?: string; dueDate?: string | null; projectId: string; assigneeIds?: string[]; issueTypeId?: string | null }>({
      query: (body) => ({ url: '/tasks', method: 'POST', body }),
      invalidatesTags: (_, __, { projectId }) => [
        { type: 'Tasks', id: 'LIST' },
        { type: 'Tasks', id: `project-${projectId}` },
      ],
    }),
    updateTask: builder.mutation<Task, { id: string; title?: string; description?: string | null; status?: string; priority?: string; dueDate?: string | null; rejectionReason?: string | null; issueTypeId?: string | null }>({
      query: ({ id, ...body }) => ({ url: `/tasks/${id}`, method: 'PATCH', body }),
      invalidatesTags: (result) =>
        result
          ? [{ type: 'Tasks', id: result.id }, { type: 'Tasks', id: 'LIST' }, { type: 'Tasks', id: `project-${result.projectId}` }]
          : [{ type: 'Tasks', id: 'LIST' }],
    }),
    deleteTask: builder.mutation<void, string>({
      query: (id) => ({ url: `/tasks/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Tasks', id: 'LIST' }, 'Projects'],
    }),
    toggleAssignment: builder.mutation<any, { taskId: string; userId: string }>({
      query: ({ taskId, userId }) => ({ url: `/tasks/${taskId}/assign`, method: 'POST', body: { userId } }),
      invalidatesTags: (_, __, { taskId }) => [{ type: 'Tasks', id: 'LIST' }, { type: 'Tasks', id: taskId }],
    }),

    // ─── Notifications ───
    getNotifications: builder.query<NotificationsResponse, void>({
      query: () => '/notifications',
      providesTags: ['Notifications'],
    }),
    getUnreadCount: builder.query<{ count: number }, void>({
      query: () => '/notifications/count',
      providesTags: ['Notifications'],
    }),
    markAsRead: builder.mutation<void, string[]>({
      query: (notificationIds) => ({ url: '/notifications/read', method: 'POST', body: { notificationIds } }),
      invalidatesTags: ['Notifications'],
    }),
    markAllAsRead: builder.mutation<void, void>({
      query: () => ({ url: '/notifications/read-all', method: 'POST' }),
      invalidatesTags: ['Notifications'],
    }),

    // ─── Invitations ───
    getOrgInvitations: builder.query<Invitation[], string>({
      query: (orgId) => `/organizations/${orgId}/invitations`,
      providesTags: (_, __, orgId) => [{ type: 'Invitations', id: orgId }],
    }),
    getInvitationByToken: builder.query<Invitation, string>({
      query: (token) => `/invitations/${token}`,
      providesTags: (_, __, token) => [{ type: 'Invitations', id: token }],
    }),
    createInvitation: builder.mutation<Invitation, { email: string; organizationId: string; role?: string }>({
      query: (body) => ({ url: '/invitations', method: 'POST', body }),
      invalidatesTags: (_, __, { organizationId }) => [{ type: 'Invitations', id: organizationId }],
    }),
    acceptInvitation: builder.mutation<void, string>({
      query: (token) => ({ url: '/invitations/accept', method: 'POST', body: { token } }),
      invalidatesTags: ['Organizations'],
    }),
    resendInvitation: builder.mutation<void, { invitationId: string; organizationId: string }>({
      query: ({ invitationId }) => ({ url: '/invitations/resend', method: 'POST', body: { invitationId } }),
      invalidatesTags: (_, __, { organizationId }) => [{ type: 'Invitations', id: organizationId }],
    }),
    revokeInvitation: builder.mutation<void, { invitationId: string; organizationId: string }>({
      query: ({ invitationId }) => ({ url: '/invitations/revoke', method: 'POST', body: { invitationId } }),
      invalidatesTags: (_, __, { organizationId }) => [{ type: 'Invitations', id: organizationId }],
    }),

    // ─── Notes ───
    getOrgNotes: builder.query<any[], string>({
      query: (orgId) => `/organizations/${orgId}/notes`,
      providesTags: (result, _, orgId) =>
        result
          ? [...result.map(({ id }: any) => ({ type: 'Notes' as const, id })), { type: 'Notes', id: `org-${orgId}` }]
          : [{ type: 'Notes', id: `org-${orgId}` }],
    }),
    getNote: builder.query<any, string>({
      query: (id) => `/notes/${id}`,
      providesTags: (_, __, id) => [{ type: 'Notes', id }],
    }),
    createNote: builder.mutation<any, { title: string; content?: string; organizationId: string }>({
      query: (body) => ({ url: '/notes', method: 'POST', body }),
      invalidatesTags: ['Notes'],
    }),
    updateNote: builder.mutation<any, { id: string; title?: string; content?: string }>({
      query: ({ id, ...body }) => ({ url: `/notes/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Notes', id }],
    }),
    deleteNote: builder.mutation<void, string>({
      query: (id) => ({ url: `/notes/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Notes'],
    }),

    // ─── Activity Logs ───
    getUserActivityLogs: builder.query<ActivityLog[], void>({
      query: () => '/activity-logs',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'ActivityLogs' as const, id })), { type: 'ActivityLogs', id: 'LIST' }]
          : [{ type: 'ActivityLogs', id: 'LIST' }],
    }),
    getOrgActivityLogs: builder.query<ActivityLog[], string>({
      query: (orgId) => `/organizations/${orgId}/activity-logs`,
      providesTags: [{ type: 'ActivityLogs', id: 'LIST' }],
    }),
    createActivityLog: builder.mutation<ActivityLog, { description: string; status?: string; note?: string | null; taskId?: string | null; organizationId: string }>({
      query: (body) => ({ url: '/activity-logs', method: 'POST', body }),
      invalidatesTags: [{ type: 'ActivityLogs', id: 'LIST' }],
    }),
    updateActivityLog: builder.mutation<ActivityLog, { id: string; description?: string; status?: string; note?: string | null; taskId?: string | null }>({
      query: ({ id, ...body }) => ({ url: `/activity-logs/${id}`, method: 'PATCH', body }),
      invalidatesTags: [{ type: 'ActivityLogs', id: 'LIST' }],
    }),
    deleteActivityLog: builder.mutation<void, string>({
      query: (id) => ({ url: `/activity-logs/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'ActivityLogs', id: 'LIST' }],
    }),

    // ─── Boards ───
    getProjectBoards: builder.query<Board[], string>({
      query: (projectId) => `/projects/${projectId}/boards`,
      providesTags: (result, _, projectId) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Boards' as const, id })), { type: 'Boards', id: `project-${projectId}` }]
          : [{ type: 'Boards', id: `project-${projectId}` }],
    }),
    getBoard: builder.query<Board, string>({
      query: (id) => `/boards/${id}`,
      providesTags: (_, __, id) => [{ type: 'Boards', id }],
    }),
    createBoard: builder.mutation<Board, { name: string; description?: string; projectId: string; columns?: { name: string; position: number; wipLimit?: number }[] }>({
      query: (body) => ({ url: '/boards', method: 'POST', body }),
      invalidatesTags: (_, __, { projectId }) => [{ type: 'Boards', id: `project-${projectId}` }],
    }),
    updateBoard: builder.mutation<Board, { id: string; name?: string; description?: string | null }>({
      query: ({ id, ...body }) => ({ url: `/boards/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Boards', id }],
    }),
    deleteBoard: builder.mutation<void, string>({
      query: (id) => ({ url: `/boards/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Boards'],
    }),
    createBoardColumn: builder.mutation<BoardColumn, { boardId: string; name: string; position: number; wipLimit?: number }>({
      query: ({ boardId, ...body }) => ({ url: `/boards/${boardId}/columns`, method: 'POST', body }),
      invalidatesTags: ['Boards'],
    }),
    updateBoardColumn: builder.mutation<BoardColumn, { columnId: string; name?: string; position?: number; wipLimit?: number | null }>({
      query: ({ columnId, ...body }) => ({ url: `/boards/columns/${columnId}`, method: 'PATCH', body }),
      invalidatesTags: ['Boards'],
    }),
    deleteBoardColumn: builder.mutation<void, string>({
      query: (columnId) => ({ url: `/boards/columns/${columnId}`, method: 'DELETE' }),
      invalidatesTags: ['Boards'],
    }),

    // ─── Labels ───
    getOrgLabels: builder.query<Label[], string>({
      query: (orgId) => `/organizations/${orgId}/labels`,
      providesTags: (result, _, orgId) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Labels' as const, id })), { type: 'Labels', id: `org-${orgId}` }]
          : [{ type: 'Labels', id: `org-${orgId}` }],
    }),
    getLabel: builder.query<Label, string>({
      query: (id) => `/labels/${id}`,
      providesTags: (_, __, id) => [{ type: 'Labels', id }],
    }),
    createLabel: builder.mutation<Label, { name: string; color?: string; organizationId: string }>({
      query: (body) => ({ url: '/labels', method: 'POST', body }),
      invalidatesTags: ['Labels'],
    }),
    updateLabel: builder.mutation<Label, { id: string; name?: string; color?: string }>({
      query: ({ id, ...body }) => ({ url: `/labels/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Labels', id }],
    }),
    deleteLabel: builder.mutation<void, string>({
      query: (id) => ({ url: `/labels/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Labels'],
    }),
    addTaskLabel: builder.mutation<any, { taskId: string; labelId: string }>({
      query: ({ taskId, labelId }) => ({ url: `/tasks/${taskId}/labels`, method: 'POST', body: { labelId } }),
      invalidatesTags: ['Tasks', 'Labels'],
    }),
    removeTaskLabel: builder.mutation<void, { taskId: string; labelId: string }>({
      query: ({ taskId, labelId }) => ({ url: `/tasks/${taskId}/labels/${labelId}`, method: 'DELETE' }),
      invalidatesTags: ['Tasks', 'Labels'],
    }),

    // ─── Comments ───
    getTaskComments: builder.query<Comment[], string>({
      query: (taskId) => `/tasks/${taskId}/comments`,
      providesTags: (result, _, taskId) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Comments' as const, id })), { type: 'Comments', id: `task-${taskId}` }]
          : [{ type: 'Comments', id: `task-${taskId}` }],
    }),
    createComment: builder.mutation<Comment, { content: string; taskId: string }>({
      query: (body) => ({ url: '/comments', method: 'POST', body }),
      invalidatesTags: (_, __, { taskId }) => [{ type: 'Comments', id: `task-${taskId}` }],
    }),
    updateComment: builder.mutation<Comment, { id: string; content: string }>({
      query: ({ id, ...body }) => ({ url: `/comments/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Comments'],
    }),
    deleteComment: builder.mutation<void, string>({
      query: (id) => ({ url: `/comments/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Comments'],
    }),

    // ─── Issue Types ───
    getOrgIssueTypes: builder.query<IssueType[], string>({
      query: (orgId) => `/organizations/${orgId}/issue-types`,
      providesTags: (result, _, orgId) =>
        result
          ? [...result.map(({ id }) => ({ type: 'IssueTypes' as const, id })), { type: 'IssueTypes', id: `org-${orgId}` }]
          : [{ type: 'IssueTypes', id: `org-${orgId}` }],
    }),
    createIssueType: builder.mutation<IssueType, { name: string; icon?: string; color?: string; description?: string; organizationId: string }>({
      query: (body) => ({ url: '/issue-types', method: 'POST', body }),
      invalidatesTags: ['IssueTypes'],
    }),
    updateIssueType: builder.mutation<IssueType, { id: string; name?: string; icon?: string; color?: string; description?: string | null }>({
      query: ({ id, ...body }) => ({ url: `/issue-types/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['IssueTypes'],
    }),
    deleteIssueType: builder.mutation<void, string>({
      query: (id) => ({ url: `/issue-types/${id}`, method: 'DELETE' }),
      invalidatesTags: ['IssueTypes'],
    }),

    // ─── Custom Fields ───
    getOrgCustomFields: builder.query<CustomField[], string>({
      query: (orgId) => `/organizations/${orgId}/custom-fields`,
      providesTags: (result, _, orgId) =>
        result
          ? [...result.map(({ id }) => ({ type: 'CustomFields' as const, id })), { type: 'CustomFields', id: `org-${orgId}` }]
          : [{ type: 'CustomFields', id: `org-${orgId}` }],
    }),
    createCustomField: builder.mutation<CustomField, { name: string; fieldType: string; options?: any; required?: boolean; issueTypeId?: string | null; organizationId: string }>({
      query: (body) => ({ url: '/custom-fields', method: 'POST', body }),
      invalidatesTags: ['CustomFields'],
    }),
    updateCustomField: builder.mutation<CustomField, { id: string; name?: string; fieldType?: string; options?: any; required?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/custom-fields/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['CustomFields'],
    }),
    deleteCustomField: builder.mutation<void, string>({
      query: (id) => ({ url: `/custom-fields/${id}`, method: 'DELETE' }),
      invalidatesTags: ['CustomFields'],
    }),
    getTaskCustomFieldValues: builder.query<CustomFieldValue[], string>({
      query: (taskId) => `/tasks/${taskId}/custom-fields`,
      providesTags: (_, __, taskId) => [{ type: 'CustomFields', id: `task-${taskId}` }],
    }),
    setCustomFieldValue: builder.mutation<CustomFieldValue, { taskId: string; customFieldId: string; value: string }>({
      query: ({ taskId, ...body }) => ({ url: `/tasks/${taskId}/custom-fields`, method: 'POST', body }),
      invalidatesTags: ['CustomFields'],
    }),

    // ─── Issue Links ───
    getTaskIssueLinks: builder.query<IssueLink[], string>({
      query: (taskId) => `/tasks/${taskId}/issue-links`,
      providesTags: (_, __, taskId) => [{ type: 'IssueLinks', id: `task-${taskId}` }],
    }),
    createIssueLink: builder.mutation<IssueLink, { sourceTaskId: string; targetTaskId: string; linkType: string }>({
      query: (body) => ({ url: '/issue-links', method: 'POST', body }),
      invalidatesTags: ['IssueLinks'],
    }),
    deleteIssueLink: builder.mutation<void, string>({
      query: (id) => ({ url: `/issue-links/${id}`, method: 'DELETE' }),
      invalidatesTags: ['IssueLinks'],
    }),

    // ─── Sprints ───
    getOrgSprints: builder.query<Sprint[], string>({
      query: (orgId) => `/organizations/${orgId}/sprints`,
      providesTags: (result, _, orgId) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Sprints' as const, id })), { type: 'Sprints', id: `org-${orgId}` }]
          : [{ type: 'Sprints', id: `org-${orgId}` }],
    }),
    getSprint: builder.query<Sprint, string>({
      query: (id) => `/sprints/${id}`,
      providesTags: (_, __, id) => [{ type: 'Sprints', id }],
    }),
    createSprint: builder.mutation<Sprint, { name: string; goal?: string; startDate?: string | null; endDate?: string | null; organizationId: string }>({
      query: (body) => ({ url: '/sprints', method: 'POST', body }),
      invalidatesTags: ['Sprints'],
    }),
    updateSprint: builder.mutation<Sprint, { id: string; name?: string; goal?: string | null; startDate?: string | null; endDate?: string | null; status?: string }>({
      query: ({ id, ...body }) => ({ url: `/sprints/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Sprints', id }],
    }),
    deleteSprint: builder.mutation<void, string>({
      query: (id) => ({ url: `/sprints/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Sprints'],
    }),
    addSprintTask: builder.mutation<SprintTask, { sprintId: string; taskId: string; storyPoints?: number }>({
      query: ({ sprintId, ...body }) => ({ url: `/sprints/${sprintId}/tasks`, method: 'POST', body }),
      invalidatesTags: ['Sprints'],
    }),
    removeSprintTask: builder.mutation<void, { sprintId: string; taskId: string }>({
      query: ({ sprintId, taskId }) => ({ url: `/sprints/${sprintId}/tasks?taskId=${taskId}`, method: 'DELETE' }),
      invalidatesTags: ['Sprints'],
    }),

    // ─── Workflows ───
    getOrgWorkflows: builder.query<Workflow[], string>({
      query: (orgId) => `/organizations/${orgId}/workflows`,
      providesTags: (result, _, orgId) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Workflows' as const, id })), { type: 'Workflows', id: `org-${orgId}` }]
          : [{ type: 'Workflows', id: `org-${orgId}` }],
    }),
    getWorkflow: builder.query<Workflow, string>({
      query: (id) => `/workflows/${id}`,
      providesTags: (_, __, id) => [{ type: 'Workflows', id }],
    }),
    createWorkflow: builder.mutation<Workflow, { name: string; description?: string; issueTypeId?: string | null; organizationId: string }>({
      query: (body) => ({ url: '/workflows', method: 'POST', body }),
      invalidatesTags: ['Workflows'],
    }),
    updateWorkflow: builder.mutation<Workflow, { id: string; name?: string; description?: string | null }>({
      query: ({ id, ...body }) => ({ url: `/workflows/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Workflows', id }],
    }),
    deleteWorkflow: builder.mutation<void, string>({
      query: (id) => ({ url: `/workflows/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Workflows'],
    }),
    createWorkflowStep: builder.mutation<any, { workflowId: string; name: string; position: number }>({
      query: ({ workflowId, ...body }) => ({ url: `/workflows/${workflowId}/steps`, method: 'POST', body }),
      invalidatesTags: ['Workflows'],
    }),
    updateWorkflowStep: builder.mutation<any, { stepId: string; name?: string; position?: number }>({
      query: ({ stepId, ...body }) => ({ url: `/workflows/steps/${stepId}`, method: 'PATCH', body }),
      invalidatesTags: ['Workflows'],
    }),
    deleteWorkflowStep: builder.mutation<void, string>({
      query: (stepId) => ({ url: `/workflows/steps/${stepId}`, method: 'DELETE' }),
      invalidatesTags: ['Workflows'],
    }),
    createWorkflowTransition: builder.mutation<any, { workflowId: string; name: string; fromStepId: string; toStepId: string; conditions?: any }>({
      query: ({ workflowId, ...body }) => ({ url: `/workflows/${workflowId}/transitions`, method: 'POST', body }),
      invalidatesTags: ['Workflows'],
    }),
    deleteWorkflowTransition: builder.mutation<void, string>({
      query: (transitionId) => ({ url: `/workflows/transitions/${transitionId}`, method: 'DELETE' }),
      invalidatesTags: ['Workflows'],
    }),

    // ─── Automations ───
    getOrgAutomations: builder.query<Automation[], string>({
      query: (orgId) => `/organizations/${orgId}/automations`,
      providesTags: (result, _, orgId) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Automations' as const, id })), { type: 'Automations', id: `org-${orgId}` }]
          : [{ type: 'Automations', id: `org-${orgId}` }],
    }),
    createAutomation: builder.mutation<Automation, { name: string; description?: string; trigger: string; conditions?: any; action: string; actionConfig?: any; enabled?: boolean; organizationId: string }>({
      query: (body) => ({ url: '/automations', method: 'POST', body }),
      invalidatesTags: ['Automations'],
    }),
    updateAutomation: builder.mutation<Automation, { id: string; name?: string; description?: string | null; trigger?: string; conditions?: any; action?: string; actionConfig?: any; enabled?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/automations/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Automations'],
    }),
    deleteAutomation: builder.mutation<void, string>({
      query: (id) => ({ url: `/automations/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Automations'],
    }),

    // ─── Integrations ───
    getOrgIntegrations: builder.query<Integration[], string>({
      query: (orgId) => `/organizations/${orgId}/integrations`,
      providesTags: (result, _, orgId) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Integrations' as const, id })), { type: 'Integrations', id: `org-${orgId}` }]
          : [{ type: 'Integrations', id: `org-${orgId}` }],
    }),
    createIntegration: builder.mutation<Integration, { type: string; name: string; config?: any; enabled?: boolean; organizationId: string }>({
      query: (body) => ({ url: '/integrations', method: 'POST', body }),
      invalidatesTags: ['Integrations'],
    }),
    updateIntegration: builder.mutation<Integration, { id: string; name?: string; config?: any; enabled?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/integrations/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Integrations'],
    }),
    deleteIntegration: builder.mutation<void, string>({
      query: (id) => ({ url: `/integrations/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Integrations'],
    }),

    // ─── Saved Filters ───
    getOrgSavedFilters: builder.query<SavedFilter[], string>({
      query: (orgId) => `/organizations/${orgId}/saved-filters`,
      providesTags: (result, _, orgId) =>
        result
          ? [...result.map(({ id }) => ({ type: 'SavedFilters' as const, id })), { type: 'SavedFilters', id: `org-${orgId}` }]
          : [{ type: 'SavedFilters', id: `org-${orgId}` }],
    }),
    createSavedFilter: builder.mutation<SavedFilter, { name: string; query: any; shared?: boolean; organizationId: string }>({
      query: (body) => ({ url: '/saved-filters', method: 'POST', body }),
      invalidatesTags: ['SavedFilters'],
    }),
    updateSavedFilter: builder.mutation<SavedFilter, { id: string; name?: string; query?: any; shared?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/saved-filters/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['SavedFilters'],
    }),
    deleteSavedFilter: builder.mutation<void, string>({
      query: (id) => ({ url: `/saved-filters/${id}`, method: 'DELETE' }),
      invalidatesTags: ['SavedFilters'],
    }),

    // ─── Dashboards ───
    getOrgDashboards: builder.query<Dashboard[], string>({
      query: (orgId) => `/organizations/${orgId}/dashboards`,
      providesTags: (result, _, orgId) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Dashboards' as const, id })), { type: 'Dashboards', id: `org-${orgId}` }]
          : [{ type: 'Dashboards', id: `org-${orgId}` }],
    }),
    createDashboard: builder.mutation<Dashboard, { name: string; layout?: any; organizationId: string }>({
      query: (body) => ({ url: '/dashboards', method: 'POST', body }),
      invalidatesTags: ['Dashboards'],
    }),
    updateDashboard: builder.mutation<Dashboard, { id: string; name?: string; layout?: any }>({
      query: ({ id, ...body }) => ({ url: `/dashboards/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Dashboards'],
    }),
    deleteDashboard: builder.mutation<void, string>({
      query: (id) => ({ url: `/dashboards/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Dashboards'],
    }),

    // ─── Reports ───
    getBurndownChart: builder.query<any, string>({
      query: (sprintId) => `/reports/burndown?sprintId=${sprintId}`,
    }),
    getVelocityChart: builder.query<any, { organizationId: string; sprintCount?: number }>({
      query: ({ organizationId, sprintCount = 5 }) => `/reports/velocity?organizationId=${organizationId}&sprintCount=${sprintCount}`,
    }),
    getCumulativeFlow: builder.query<any, { organizationId: string; days?: number }>({
      query: ({ organizationId, days = 30 }) => `/reports/cumulative-flow?organizationId=${organizationId}&days=${days}`,
    }),
  }),
});

export const {
  // Auth
  useGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useForgotPasswordMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useResetPasswordMutation,
  useUpdateProfileMutation,
  // Organizations
  useGetOrganizationsQuery,
  useGetOrganizationQuery,
  useCreateOrganizationMutation,
  useDeleteOrganizationMutation,
  // Members
  useGetOrgMembersQuery,
  useAddOrgMemberMutation,
  useRemoveOrgMemberMutation,
  useUpdateMemberRoleMutation,
  // Spaces
  useGetOrgSpacesQuery,
  useGetSpaceQuery,
  useCreateSpaceMutation,
  useUpdateSpaceMutation,
  useDeleteSpaceMutation,
  // Projects
  useGetProjectsQuery,
  useGetProjectQuery,
  useGetSpaceProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  // Tasks
  useGetUserTasksQuery,
  useGetProjectTasksQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useToggleAssignmentMutation,
  // Notifications
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  // Invitations
  useGetOrgInvitationsQuery,
  useGetInvitationByTokenQuery,
  useCreateInvitationMutation,
  useAcceptInvitationMutation,
  useResendInvitationMutation,
  useRevokeInvitationMutation,
  // Notes
  useGetOrgNotesQuery,
  useGetNoteQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
  // Activity Logs
  useGetUserActivityLogsQuery,
  useGetOrgActivityLogsQuery,
  useCreateActivityLogMutation,
  useUpdateActivityLogMutation,
  useDeleteActivityLogMutation,
  // Boards
  useGetProjectBoardsQuery,
  useGetBoardQuery,
  useCreateBoardMutation,
  useUpdateBoardMutation,
  useDeleteBoardMutation,
  useCreateBoardColumnMutation,
  useUpdateBoardColumnMutation,
  useDeleteBoardColumnMutation,
  // Labels
  useGetOrgLabelsQuery,
  useGetLabelQuery,
  useCreateLabelMutation,
  useUpdateLabelMutation,
  useDeleteLabelMutation,
  useAddTaskLabelMutation,
  useRemoveTaskLabelMutation,
  // Comments
  useGetTaskCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  // Issue Types
  useGetOrgIssueTypesQuery,
  useCreateIssueTypeMutation,
  useUpdateIssueTypeMutation,
  useDeleteIssueTypeMutation,
  // Custom Fields
  useGetOrgCustomFieldsQuery,
  useCreateCustomFieldMutation,
  useUpdateCustomFieldMutation,
  useDeleteCustomFieldMutation,
  useGetTaskCustomFieldValuesQuery,
  useSetCustomFieldValueMutation,
  // Issue Links
  useGetTaskIssueLinksQuery,
  useCreateIssueLinkMutation,
  useDeleteIssueLinkMutation,
  // Sprints
  useGetOrgSprintsQuery,
  useGetSprintQuery,
  useCreateSprintMutation,
  useUpdateSprintMutation,
  useDeleteSprintMutation,
  useAddSprintTaskMutation,
  useRemoveSprintTaskMutation,
  // Workflows
  useGetOrgWorkflowsQuery,
  useGetWorkflowQuery,
  useCreateWorkflowMutation,
  useUpdateWorkflowMutation,
  useDeleteWorkflowMutation,
  useCreateWorkflowStepMutation,
  useUpdateWorkflowStepMutation,
  useDeleteWorkflowStepMutation,
  useCreateWorkflowTransitionMutation,
  useDeleteWorkflowTransitionMutation,
  // Automations
  useGetOrgAutomationsQuery,
  useCreateAutomationMutation,
  useUpdateAutomationMutation,
  useDeleteAutomationMutation,
  // Integrations
  useGetOrgIntegrationsQuery,
  useCreateIntegrationMutation,
  useUpdateIntegrationMutation,
  useDeleteIntegrationMutation,
  // Saved Filters
  useGetOrgSavedFiltersQuery,
  useCreateSavedFilterMutation,
  useUpdateSavedFilterMutation,
  useDeleteSavedFilterMutation,
  // Dashboards
  useGetOrgDashboardsQuery,
  useCreateDashboardMutation,
  useUpdateDashboardMutation,
  useDeleteDashboardMutation,
  // Reports
  useGetBurndownChartQuery,
  useGetVelocityChartQuery,
  useGetCumulativeFlowQuery,
} = apiSlice;
