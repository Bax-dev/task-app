'use client';

import { useEffect, useRef } from 'react';
import { useGetMeQuery, useUpdateProfileMutation } from '@/store/api';

export default function TimezoneSync() {
  const { data: me } = useGetMeQuery();
  const [updateProfile] = useUpdateProfileMutation();
  const syncedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!me?.id) return;
    if (syncedForUserRef.current === me.id) return;

    let detected: string;
    try {
      detected = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return;
    }
    if (!detected) return;

    if (me.timezone !== detected) {
      updateProfile({ timezone: detected }).catch(() => {});
    }
    syncedForUserRef.current = me.id;
  }, [me, updateProfile]);

  return null;
}
