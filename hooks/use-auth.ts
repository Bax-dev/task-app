'use client';

import { useRouter } from 'next/navigation';
import { useGetMeQuery, useLogoutMutation, apiSlice } from '@/store/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useEffect } from 'react';

export function useAuth() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const { isLoading, error: getMeError } = useGetMeQuery(undefined, { refetchOnMountOrArgChange: true });
  const [logoutTrigger] = useLogoutMutation();

  // If getMe fails with 401 after auto-refresh attempt, redirect to login
  useEffect(() => {
    if (getMeError && 'status' in getMeError && getMeError.status === 401) {
      dispatch(apiSlice.util.resetApiState());
      router.push('/login');
    }
  }, [getMeError, dispatch, router]);

  // Sign-in/sign-up live in LoginForm/SignupForm: they handle the 2FA and email-code steps.
  const logout = async () => {
    try {
      await logoutTrigger().unwrap();
    } catch {
    }
    dispatch(apiSlice.util.resetApiState());
    router.push('/login');
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}
