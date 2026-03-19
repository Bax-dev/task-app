import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(options: EmailOptions): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV EMAIL] To: ${options.to}`);
    console.log(`[DEV EMAIL] Subject: ${options.subject}`);
    console.log(`[DEV EMAIL] Body: ${options.html}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@taskflow.app',
    ...options,
  });
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
