import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { User } from '@/types/auth';
import type { Organization, Member } from '@/types/organization';
import type { Project } from '@/types/project';
import type { Task } from '@/types/task';
import type { Space } from '@/types/space';
import type { Notification, NotificationsResponse } from '@/types/notification';
import type { Invitation } from '@/types/invitation';
import type { ActivityLog } from '@/types/activity-log';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'include',
  prepareHeaders: (headers) => {
    headers.set('Content-Type', 'application/json');
    return headers;
  },
  responseHandler: async (response) => {
    const data = await response.json();
    if (!response.ok) {
      return { error: data.error || 'An error occurred' };
    }
    return data.data ?? data;
  },
});

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
    updateProfile: builder.mutation<User, { name?: string; email?: string }>({
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
    createTask: builder.mutation<Task, { title: string; description?: string; status?: string; priority?: string; dueDate?: string | null; projectId: string }>({
      query: (body) => ({ url: '/tasks', method: 'POST', body }),
      invalidatesTags: (_, __, { projectId }) => [
        { type: 'Tasks', id: 'LIST' },
        { type: 'Tasks', id: `project-${projectId}` },
      ],
    }),
    updateTask: builder.mutation<Task, { id: string; title?: string; description?: string | null; status?: string; priority?: string; dueDate?: string | null; rejectionReason?: string | null }>({
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
      invalidatesTags: [{ type: 'Tasks', id: 'LIST' }],
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
  }),
});

export const {
  // Auth
  useGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
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
} = apiSlice;
