export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.TASKFLOW_DISABLE_INTERNAL_CRON === '1') return;

  const g = globalThis as any;
  if (g.__taskflowCronStarted) return;
  g.__taskflowCronStarted = true;

  const { sendDailyReportReminders } = await import('./app/api/modules/daily-reports/services');
  const { sendOverdueReminders } = await import('./app/api/modules/tasks/services');

  const INTERVAL_MS = 60_000;
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await sendDailyReportReminders();
    } catch (err: any) {
      console.error('[cron] sendDailyReportReminders failed:', err?.message || err);
    }
    try {
      await sendOverdueReminders();
    } catch (err: any) {
      console.error('[cron] sendOverdueReminders failed:', err?.message || err);
    }
    running = false;
  };

  // First tick shortly after startup so it doesn't race boot work.
  setTimeout(tick, 10_000);
  setInterval(tick, INTERVAL_MS);
  console.log('[cron] internal scheduler started (every 60s)');
}
