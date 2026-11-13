import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[EMAIL] To: ${options.to} | Subject: ${options.subject}`);
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn(`[EMAIL] No RESEND_API_KEY set — skipping send to ${options.to}`);
    return;
  }

  try {
    // Construct lazily so local builds and non-email routes work without a key.
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error(`[EMAIL] Resend rejected send to ${options.to}: ${error.name} — ${error.message}`);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[EMAIL] Sent to ${options.to} (id: ${data?.id})`);
    }
  } catch (err: any) {
    console.error(`[EMAIL] Send failed to ${options.to}:`, err?.message || err);
    throw err;
  }
}

// ─── Design constants ─────────────────────────────────────
// Shared palette + typography so every email has a consistent, branded look.
// Uses inline styles because most email clients strip <style> blocks.

export const EMAIL_BRAND = {
  name: 'TaskFlow',
  tagline: 'Where teams ship work.',
} as const;

export const EMAIL_COLORS = {
  brand: '#4b5563',
  brandDark: '#374151',
  brandSoft: '#f3f4f6',
  brandBorder: '#d1d5db',
  text: '#111827',
  textMuted: '#6b7280',
  textSubtle: '#9ca3af',
  border: '#e5e7eb',
  surface: '#ffffff',
  canvas: '#f8fafc',
  success: '#16a34a',
  successSoft: '#dcfce7',
  danger: '#dc2626',
  dangerSoft: '#fee2e2',
  warning: '#d97706',
  warningSoft: '#fef3c7',
} as const;

const FONT_STACK = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;

type ToneKey = 'brand' | 'danger' | 'success' | 'warning';

const TONE_STYLES: Record<ToneKey, { bg: string; border: string; accent: string }> = {
  brand: { bg: EMAIL_COLORS.brandSoft, border: EMAIL_COLORS.brand, accent: EMAIL_COLORS.brand },
  danger: { bg: EMAIL_COLORS.dangerSoft, border: EMAIL_COLORS.danger, accent: EMAIL_COLORS.danger },
  success: { bg: EMAIL_COLORS.successSoft, border: EMAIL_COLORS.success, accent: EMAIL_COLORS.success },
  warning: { bg: EMAIL_COLORS.warningSoft, border: EMAIL_COLORS.warning, accent: EMAIL_COLORS.warning },
};

function emailShell(params: {
  title: string;
  preheader?: string;
  body: string;
}): string {
  const preheader = params.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${params.preheader}</div>`
    : '';

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:${EMAIL_COLORS.canvas};font-family:${FONT_STACK};color:${EMAIL_COLORS.text};">
    ${preheader}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_COLORS.canvas};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${EMAIL_COLORS.surface};border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(17,24,39,0.06);border:1px solid ${EMAIL_COLORS.border};">
            <tr>
              <td style="padding:28px 32px;background:linear-gradient(135deg, ${EMAIL_COLORS.brand} 0%, ${EMAIL_COLORS.brandDark} 100%);color:#fff;">
                <div style="font-size:18px;font-weight:700;letter-spacing:-0.01em;">${EMAIL_BRAND.name}</div>
                <div style="font-size:13px;opacity:0.85;margin-top:2px;">${EMAIL_BRAND.tagline}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 20px 0;font-size:22px;font-weight:700;line-height:1.3;color:${EMAIL_COLORS.text};letter-spacing:-0.01em;">${params.title}</h1>
                ${params.body}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:${EMAIL_COLORS.canvas};border-top:1px solid ${EMAIL_COLORS.border};color:${EMAIL_COLORS.textSubtle};font-size:12px;line-height:1.6;">
                This is an automated message from ${EMAIL_BRAND.name}. Please do not reply directly to this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(label: string, url: string, tone: ToneKey = 'brand'): string {
  const color = TONE_STYLES[tone].accent;
  return `<a href="${url}" style="display:inline-block;padding:12px 24px;background:${color};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;letter-spacing:0.01em;">${label}</a>`;
}

function card(innerHtml: string, tone: ToneKey = 'brand'): string {
  const { bg, border } = TONE_STYLES[tone];
  return `<div style="margin:20px 0;padding:20px;background:${bg};border-radius:12px;border-left:4px solid ${border};">${innerHtml}</div>`;
}

function paragraph(text: string, muted = false): string {
  const color = muted ? EMAIL_COLORS.textMuted : EMAIL_COLORS.text;
  return `<p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:${color};">${text}</p>`;
}

function metaRow(label: string, value: string): string {
  return `<div style="margin:6px 0;font-size:14px;line-height:1.5;color:${EMAIL_COLORS.text};"><span style="color:${EMAIL_COLORS.textMuted};font-weight:500;">${label}:</span> ${value}</div>`;
}

// ─── Templates ────────────────────────────────────────────

export function buildOTPEmail(otp: string, purpose: 'forgot-password' | 'verify-email'): { subject: string; html: string } {
  const titles = {
    'forgot-password': 'Reset Your Password',
    'verify-email': 'Verify Your Email',
  };
  const descriptions = {
    'forgot-password': 'You requested to reset your password. Use the code below to proceed.',
    'verify-email': 'Welcome! Use the code below to verify your email address.',
  };

  const body = `
    ${paragraph(descriptions[purpose])}
    <div style="text-align:center;margin:28px 0;">
      <div style="display:inline-block;padding:20px 32px;background:${EMAIL_COLORS.brandSoft};border:1px solid ${EMAIL_COLORS.brandBorder};border-radius:12px;font-size:32px;font-weight:700;letter-spacing:10px;color:${EMAIL_COLORS.brandDark};font-family:${FONT_STACK};">${otp}</div>
    </div>
    ${paragraph('This code expires in 5 minutes. If you didn\'t request this, you can safely ignore this email.', true)}
  `;

  return {
    subject: `${titles[purpose]} — ${EMAIL_BRAND.name}`,
    html: emailShell({
      title: titles[purpose],
      preheader: `Your ${EMAIL_BRAND.name} verification code is ${otp}.`,
      body,
    }),
  };
}

export function buildActivityUpdateEmail(
  userName: string,
  entries: { task: string; status: string; note?: string }[]
): { subject: string; html: string } {
  const rows = entries
    .map(
      (e) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid ${EMAIL_COLORS.border};font-size:14px;color:${EMAIL_COLORS.text};">${e.task}</td>
          <td style="padding:10px 12px;border-bottom:1px solid ${EMAIL_COLORS.border};">
            <span style="display:inline-block;padding:3px 10px;background:${EMAIL_COLORS.brandSoft};border-radius:999px;font-size:12px;font-weight:600;color:${EMAIL_COLORS.brandDark};">${e.status}</span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid ${EMAIL_COLORS.border};font-size:14px;color:${EMAIL_COLORS.textMuted};">${e.note || '—'}</td>
        </tr>`
    )
    .join('');

  const body = `
    ${paragraph(`<strong>${userName}</strong> recorded the following activity:`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid ${EMAIL_COLORS.border};border-radius:12px;overflow:hidden;">
      <thead>
        <tr style="background:${EMAIL_COLORS.canvas};">
          <th align="left" style="padding:12px;border-bottom:1px solid ${EMAIL_COLORS.border};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:${EMAIL_COLORS.textMuted};">Task</th>
          <th align="left" style="padding:12px;border-bottom:1px solid ${EMAIL_COLORS.border};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:${EMAIL_COLORS.textMuted};">Status</th>
          <th align="left" style="padding:12px;border-bottom:1px solid ${EMAIL_COLORS.border};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:${EMAIL_COLORS.textMuted};">Note</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  return {
    subject: `Activity update from ${userName} — ${EMAIL_BRAND.name}`,
    html: emailShell({
      title: 'Activity Update',
      preheader: `${userName} recorded ${entries.length} update${entries.length === 1 ? '' : 's'}.`,
      body,
    }),
  };
}

export function buildTaskAssignedEmail(params: {
  assigneeName: string;
  taskTitle: string;
  projectName: string;
  assignedByName: string;
  taskUrl: string;
  priority?: string;
  dueDate?: string | null;
  description?: string | null;
}): { subject: string; html: string } {
  const meta: string[] = [];
  if (params.priority) meta.push(metaRow('Priority', params.priority));
  if (params.dueDate) meta.push(metaRow('Due', new Date(params.dueDate).toLocaleDateString()));
  const descLine = params.description
    ? `<div style="margin-top:10px;font-size:14px;line-height:1.6;color:${EMAIL_COLORS.textMuted};">${params.description}</div>`
    : '';

  const body = `
    ${paragraph(`Hi ${params.assigneeName},`)}
    ${paragraph(`<strong>${params.assignedByName}</strong> assigned you to a task in <strong>${params.projectName}</strong>.`)}
    ${card(`
      <div style="font-size:16px;font-weight:600;color:${EMAIL_COLORS.text};margin-bottom:8px;">${params.taskTitle}</div>
      ${meta.join('')}
      ${descLine}
    `)}
    <div style="margin-top:24px;">${button('View task', params.taskUrl)}</div>
  `;

  return {
    subject: `You've been assigned to "${params.taskTitle}" — ${EMAIL_BRAND.name}`,
    html: emailShell({
      title: 'New task assignment',
      preheader: `${params.assignedByName} assigned you to ${params.taskTitle}.`,
      body,
    }),
  };
}

export function buildTaskOverdueEmail(params: {
  recipientName: string;
  taskTitle: string;
  projectName: string;
  taskUrl: string;
  dueDate?: string | null;
  description?: string | null;
  scopeLabel?: string | null;
}): { subject: string; html: string } {
  const meta: string[] = [];
  if (params.dueDate) meta.push(metaRow('Due', new Date(params.dueDate).toLocaleDateString()));
  if (params.scopeLabel) meta.push(metaRow('Assignment', params.scopeLabel));
  const descLine = params.description
    ? `<div style="margin-top:10px;font-size:14px;line-height:1.6;color:${EMAIL_COLORS.textMuted};">${params.description}</div>`
    : '';

  const body = `
    ${paragraph(`Hi ${params.recipientName},`)}
    ${paragraph(`A task in <strong>${params.projectName}</strong> is past its due date and still open.`)}
    ${card(`
      <div style="font-size:16px;font-weight:600;color:${EMAIL_COLORS.text};margin-bottom:8px;">${params.taskTitle}</div>
      ${meta.join('')}
      ${descLine}
    `, 'danger')}
    <div style="margin-top:24px;">${button('Review task', params.taskUrl, 'danger')}</div>
  `;

  return {
    subject: `Overdue: "${params.taskTitle}" — ${EMAIL_BRAND.name}`,
    html: emailShell({
      title: 'Task overdue',
      preheader: `${params.taskTitle} in ${params.projectName} is overdue.`,
      body,
    }),
  };
}

export function buildDailyReportReminderEmail(params: {
  recipientName: string;
  reportDate: string;
  link: string;
}): { subject: string; html: string } {
  const displayDate = new Date(`${params.reportDate}T00:00:00.000Z`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const checklistItem = (text: string) => `
    <div style="display:flex;align-items:flex-start;margin:10px 0;font-size:14px;line-height:1.6;color:${EMAIL_COLORS.text};">
      <span style="display:inline-block;width:18px;height:18px;min-width:18px;margin-right:12px;border-radius:50%;background:${EMAIL_COLORS.brand};color:#fff;text-align:center;line-height:18px;font-size:12px;font-weight:700;">✓</span>
      <span>${text}</span>
    </div>`;

  const body = `
    ${paragraph(`Hi ${params.recipientName},`)}
    ${paragraph(`Friendly reminder to submit your daily report for <strong>${displayDate}</strong>. It only takes a minute.`)}
    ${card(`
      <div style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:${EMAIL_COLORS.brandDark};margin-bottom:12px;">Share three things</div>
      ${checklistItem('What you worked on today')}
      ${checklistItem('Any blockers you\'re facing')}
      ${checklistItem('Your goal for tomorrow')}
    `)}
    <div style="margin-top:24px;">${button('Submit report', params.link)}</div>
    ${paragraph('Staying consistent helps the whole team stay in sync.', true)}
  `;

  return {
    subject: `Daily report reminder — ${displayDate}`,
    html: emailShell({
      title: 'Time for your daily report',
      preheader: `Submit your report for ${displayDate}.`,
      body,
    }),
  };
}

export function buildInviteEmail(orgName: string, inviteUrl: string): { subject: string; html: string } {
  const body = `
    ${paragraph(`You've been invited to collaborate on <strong>${orgName}</strong>.`)}
    ${paragraph(`Click below to accept the invitation and set up your account.`)}
    <div style="margin-top:24px;">${button('Accept invitation', inviteUrl)}</div>
    ${paragraph('This invitation expires in 7 days. If you weren\'t expecting this, you can safely ignore it.', true)}
  `;

  return {
    subject: `You've been invited to ${orgName} on ${EMAIL_BRAND.name}`,
    html: emailShell({
      title: `Join ${orgName}`,
      preheader: `You've been invited to ${orgName} on ${EMAIL_BRAND.name}.`,
      body,
    }),
  };
}

export function buildMfaChangedEmail(enabled: boolean): { subject: string; html: string } {
  const state = enabled ? 'turned on' : 'turned off';
  const body = `
    ${paragraph(`Two-step verification was <strong>${state}</strong> for your ${EMAIL_BRAND.name} account.`)}
    ${paragraph('If this wasn\'t you, reset your password right away and contact support.', true)}
  `;
  return {
    subject: `Two-step verification ${state}`,
    html: emailShell({ title: `Two-step verification ${state}`, preheader: `Two-step verification was ${state}.`, body }),
  };
}
