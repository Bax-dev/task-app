'use client';

import {
  useGetProjectsQuery,
  useGetProjectQuery,
  useGetSpaceProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} from '@/store/api';

export function useProjects() {
  return useGetProjectsQuery();
}

export function useProject(id: string) {
  return useGetProjectQuery(id, { skip: !id });
}

export function useSpaceProjects(spaceId: string) {
  return useGetSpaceProjectsQuery(spaceId, { skip: !spaceId });
}

export function useCreateProject() {
  const [trigger, state] = useCreateProjectMutation();
  return { mutate: trigger, mutateAsync: trigger, ...state };
}

export function useUpdateProject() {
  const [trigger, state] = useUpdateProjectMutation();
  return { mutate: trigger, mutateAsync: trigger, ...state };
}

export function useDeleteProject() {
  const [trigger, state] = useDeleteProjectMutation();
  return { mutate: trigger, mutateAsync: trigger, ...state };
}
