'use client';

import { useRouter } from 'next/navigation';
import { useGetMeQuery, useLoginMutation, useRegisterMutation, useLogoutMutation, apiSlice } from '@/store/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useEffect } from 'react';

export function useAuth() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const { isLoading, error: getMeError } = useGetMeQuery(undefined, { refetchOnMountOrArgChange: true });
  const [loginTrigger, loginState] = useLoginMutation();
  const [registerTrigger, registerState] = useRegisterMutation();
  const [logoutTrigger] = useLogoutMutation();

  // If getMe fails with 401 after auto-refresh attempt, redirect to login
  useEffect(() => {
    if (getMeError && 'status' in getMeError && getMeError.status === 401) {
      dispatch(apiSlice.util.resetApiState());
      router.push('/login');
    }
  }, [getMeError, dispatch, router]);

  const login = async (data: { email: string; password: string }) => {
    const result = await loginTrigger(data).unwrap();
    router.push('/dashboard');
    return result;
  };

  const register = async (data: { name: string; email: string; password: string }) => {
    const result = await registerTrigger(data).unwrap();
    router.push('/dashboard');
    return result;
  };

  const logout = async () => {
    try {
      await logoutTrigger().unwrap();
    } catch {
      // Even if logout API fails, still clear state and redirect
    }
    dispatch(apiSlice.util.resetApiState());
    router.push('/login');
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    loginError: loginState.error,
    registerError: registerState.error,
    isLoginPending: loginState.isLoading,
    isRegisterPending: registerState.isLoading,
  };
}
