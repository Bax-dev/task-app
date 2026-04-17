'use client';

import { useEffect, useRef } from 'react';
import {
  useGetMeQuery,
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
} from '@/store/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  hydratePreferences,
  selectSyncablePreferences,
} from '@/store/slices/preferencesSlice';

export default function PreferencesSync() {
  const dispatch = useAppDispatch();
  const { data: me } = useGetMeQuery();
  const localPrefs = useAppSelector(selectSyncablePreferences);
  const {
    data: serverPrefs,
    isSuccess,
    isFetching,
  } = useGetPreferencesQuery(undefined, { skip: !me });
  const [updatePrefs] = useUpdatePreferencesMutation();

  const hydratedUserIdRef = useRef<string | null>(null);
  const lastPushedRef = useRef<string | null>(null);

  // Reset hydration state when the signed-in user changes (logout/login)
  useEffect(() => {
    if (!me) {
      hydratedUserIdRef.current = null;
      lastPushedRef.current = null;
    }
  }, [me]);

  // On first successful fetch for a given user:
  // - if server has prefs → hydrate local Redux to match
  // - if server has none → push the current local state up as the initial value
  useEffect(() => {
    if (!me || !isSuccess || isFetching) return;
    if (hydratedUserIdRef.current === me.id) return;

    const hasServerPrefs =
      serverPrefs && typeof serverPrefs === 'object' && Object.keys(serverPrefs).length > 0;

    if (hasServerPrefs) {
      dispatch(hydratePreferences(serverPrefs));
    } else {
      updatePrefs(localPrefs);
    }

    lastPushedRef.current = JSON.stringify(localPrefs);
    hydratedUserIdRef.current = me.id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, isSuccess, isFetching, serverPrefs]);

  // Debounced push on any local change after hydration
  useEffect(() => {
    if (!me || hydratedUserIdRef.current !== me.id) return;
    const snapshot = JSON.stringify(localPrefs);
    if (snapshot === lastPushedRef.current) return;

    const timer = setTimeout(() => {
      updatePrefs(localPrefs);
      lastPushedRef.current = snapshot;
    }, 800);
    return () => clearTimeout(timer);
  }, [localPrefs, me, updatePrefs]);

  return null;
}
