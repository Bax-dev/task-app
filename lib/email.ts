import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(options: EmailOptions): Promise<void> {
  // Always log in development for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log(`[EMAIL] To: ${options.to}`);
    console.log(`[EMAIL] Subject: ${options.subject}`);
  }

  // Skip sending only if Resend API key is not configured
  if (!process.env.RESEND_API_KEY) {
    console.log(`[EMAIL] No RESEND_API_KEY set — email not sent. Body:\n${options.html}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export function buildOTPEmail(otp: string, purpose: 'forgot-password' | 'verify-email'): { subject: string; html: string } {
  const titles = {
    'forgot-password': 'Reset Your Password',
    'verify-email': 'Verify Your Email',
  };
  const descriptions = {
    'forgot-password': 'You requested to reset your password. Use the code below to proceed:',
    'verify-email': 'Use the code below to verify your email address:',
  };

  return {
    subject: `${titles[purpose]} - TaskFlow`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${titles[purpose]}</h2>
        <p>${descriptions[purpose]}</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="display: inline-block; padding: 16px 32px; background: #f3f4f6; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111;">
            ${otp}
          </span>
        </div>
        <p style="color: #666; font-size: 14px;">
          This code expires in 5 minutes. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
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
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${e.task}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">
            <span style="display: inline-block; padding: 2px 8px; background: #e0e7ff; border-radius: 4px; font-size: 12px; color: #3730a3;">${e.status}</span>
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #555;">${e.note || '—'}</td>
        </tr>`
    )
    .join('');

  return {
    subject: `Activity Update from ${userName} - TaskFlow`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Activity Update</h2>
        <p><strong>${userName}</strong> recorded the following activity:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr style="background: #f9fafb; text-align: left;">
              <th style="padding: 8px 12px; border-bottom: 2px solid #e5e7eb;">Task</th>
              <th style="padding: 8px 12px; border-bottom: 2px solid #e5e7eb;">Status</th>
              <th style="padding: 8px 12px; border-bottom: 2px solid #e5e7eb;">Note</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="color: #666; font-size: 14px;">
          This is an automated activity summary from TaskFlow.
        </p>
      </div>
    `,
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
  const dueLine = params.dueDate
    ? `<p style="margin: 4px 0; color: #555; font-size: 14px;"><strong>Due:</strong> ${new Date(params.dueDate).toLocaleDateString()}</p>`
    : '';
  const priorityLine = params.priority
    ? `<p style="margin: 4px 0; color: #555; font-size: 14px;"><strong>Priority:</strong> ${params.priority}</p>`
    : '';
  const descLine = params.description
    ? `<p style="margin: 12px 0; color: #555; font-size: 14px;">${params.description}</p>`
    : '';

  return {
    subject: `You've been assigned to "${params.taskTitle}" - TaskFlow`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Task Assignment</h2>
        <p>Hi ${params.assigneeName},</p>
        <p><strong>${params.assignedByName}</strong> assigned you to a task in <strong>${params.projectName}</strong>:</p>
        <div style="margin: 16px 0; padding: 16px; background: #f3f4f6; border-radius: 8px; border-left: 4px solid #6b7280;">
          <h3 style="margin: 0 0 8px 0; color: #111;">${params.taskTitle}</h3>
          ${descLine}
          ${priorityLine}
          ${dueLine}
        </div>
        <a href="${params.taskUrl}" style="display: inline-block; padding: 12px 24px; background: #4b5563; color: white; text-decoration: none; border-radius: 6px;">
          View Task
        </a>
        <p style="margin-top: 16px; color: #666; font-size: 14px;">
          This is an automated notification from TaskFlow.
        </p>
      </div>
    `,
  };
}

export function buildInviteEmail(orgName: string, inviteUrl: string): { subject: string; html: string } {
  return {
    subject: `You've been invited to join ${orgName} on TaskFlow`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You're Invited!</h2>
        <p>You've been invited to join <strong>${orgName}</strong> on TaskFlow.</p>
        <p>Click the link below to accept the invitation:</p>
        <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 6px;">
          Accept Invitation
        </a>
        <p style="margin-top: 16px; color: #666; font-size: 14px;">
          This invitation expires in 7 days. If you didn't expect this, you can ignore this email.
        </p>
      </div>
    `,
  };
}
