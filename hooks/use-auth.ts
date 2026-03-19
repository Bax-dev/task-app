'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

interface User {
  id: string;
  name: string | null;
  email: string;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setUser, clearUser } = useAuthStore();

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const data = await api.get<User>('/api/auth/me');
      setUser(data);
      return data;
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api.post<{ user: User }>('/api/auth/login', data),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      router.push('/dashboard');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: { name: string; email: string; password: string }) =>
      api.post<{ user: User }>('/api/auth/register', data),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      router.push('/dashboard');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post('/api/auth/logout'),
    onSuccess: () => {
      clearUser();
      queryClient.clear();
      router.push('/login');
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
  };
}
