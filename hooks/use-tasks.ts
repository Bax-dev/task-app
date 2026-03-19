'use client';

import {
  useGetUserTasksQuery,
  useGetProjectTasksQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useToggleAssignmentMutation,
} from '@/store/api';

export function useUserTasks() {
  return useGetUserTasksQuery();
}

export function useProjectTasks(projectId: string) {
  return useGetProjectTasksQuery(projectId, { skip: !projectId });
}

export function useTask(id: string) {
  return useGetTaskQuery(id, { skip: !id });
}

export function useCreateTask() {
  const [trigger, state] = useCreateTaskMutation();
  return { mutate: trigger, mutateAsync: trigger, ...state };
}

export function useUpdateTask() {
  const [trigger, state] = useUpdateTaskMutation();
  return { mutate: trigger, mutateAsync: trigger, ...state };
}

export function useDeleteTask() {
  const [trigger, state] = useDeleteTaskMutation();
  return { mutate: trigger, mutateAsync: trigger, ...state };
}

export function useToggleAssignment() {
  const [trigger, state] = useToggleAssignmentMutation();
  return { mutate: trigger, mutateAsync: trigger, ...state };
}
