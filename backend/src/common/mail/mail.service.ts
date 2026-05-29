import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { Attachment } from 'nodemailer/lib/mailer';

type AgentInviteTemplate = {
  subject: string;
  text: string;
  html: string;
};

type MgaPackagePayload = {
  to: string[];
  adminEmail?: string;
  subject: string;
  body: string;
  attachments?: string[];
  fileAttachments?: Attachment[];
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST') ?? 'smtp.gmail.com';
    const user =
      this.configService.get<string>('SMTP_USER') ?? 'bentsys.dev@gmail.com';
    const pass = this.configService.get<string>('SMTP_PASS');

    this.transporter =
      user && pass
        ? createTransport({
            host,
            port: Number(this.configService.get<string>('SMTP_PORT') ?? 587),
            secure: this.configService.get<string>('SMTP_SECURE') === 'true',
            auth: { user, pass },
          })
        : null;
  }

  async sendAgentInvite(agentEmail: string, agentName: string, inviteUrl: string) {
    if (!this.transporter) {
      this.logger.warn(
        `SMTP password is not configured. Agent invite link for ${agentEmail}: ${inviteUrl}`,
      );
      return false;
    }

    const from =
      this.configService.get<string>('SMTP_FROM') ??
      this.configService.get<string>('SMTP_USER');
    const template = this.buildAgentInviteTemplate(agentName, inviteUrl);

    try {
      await this.transporter.sendMail({
        from: from ?? 'bentsys.dev@gmail.com',
        to: agentEmail,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown SMTP error';
      this.logger.error(`Unable to send agent invite email: ${message}`);
      this.logger.warn(`Agent invite link for ${agentEmail}: ${inviteUrl}`);
      return false;
    }
  }

  async sendMgaPackageEmail(payload: MgaPackagePayload) {
    if (!this.transporter) {
      this.logger.warn('SMTP transporter unavailable for MGA package email.');
      return false;
    }

    const smtpFrom =
      this.configService.get<string>('SMTP_FROM') ??
      this.configService.get<string>('SMTP_USER');
    const from = payload.adminEmail
      ? `${payload.adminEmail} via AgentFlow <${smtpFrom ?? 'bentsys.dev@gmail.com'}>`
      : (smtpFrom ?? 'bentsys.dev@gmail.com');
    const bodyWithAttachments =
      payload.attachments && payload.attachments.length > 0
        ? `${payload.body}\n\nAttachments:\n- ${payload.attachments.join('\n- ')}`
        : payload.body;

    try {
      await this.transporter.sendMail({
        from,
        replyTo: payload.adminEmail ?? undefined,
        to: payload.to.join(', '),
        subject: payload.subject,
        text: bodyWithAttachments,
        html: `<pre style="font-family:Arial,Helvetica,sans-serif;white-space:pre-wrap">${this.escapeHtml(bodyWithAttachments)}</pre>`,
        attachments: payload.fileAttachments ?? [],
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown SMTP error';
      this.logger.error(`Unable to send MGA package email: ${message}`);
      return false;
    }
  }

  async sendAgentActivationEmail(agentEmail: string, agentName: string) {
    if (!this.transporter) {
      this.logger.warn(`SMTP transporter unavailable for activation email to ${agentEmail}.`);
      return false;
    }

    const from =
      this.configService.get<string>('SMTP_FROM') ??
      this.configService.get<string>('SMTP_USER') ??
      'bentsys.dev@gmail.com';

    const safeName = this.escapeHtml(agentName || 'Agent');
    const subject = 'Your Agent Account Is Now Active';
    const text = [
      `Hello ${agentName || 'Agent'},`,
      '',
      'Great news. Your account has been activated by the admin team.',
      'You can now access your portal and start working with full access.',
      '',
      'Welcome aboard,',
      'Agent Management Team',
    ].join('\n');

    try {
      await this.transporter.sendMail({
        from,
        to: agentEmail,
        subject,
        text,
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.6">
            <h2 style="margin:0 0 12px">Hello ${safeName},</h2>
            <p style="margin:0 0 10px">Great news. Your account has been activated by the admin team.</p>
            <p style="margin:0 0 14px">You can now access your portal and start working with full access.</p>
            <p style="margin:0">Welcome aboard,<br/>Agent Management Team</p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown SMTP error';
      this.logger.error(`Unable to send activation email: ${message}`);
      return false;
    }
  }

  private buildAgentInviteTemplate(
    agentName: string,
    activationUrl: string,
  ): AgentInviteTemplate {
    const safeName = this.escapeHtml(agentName || 'Agent');
    const safeUrl = this.escapeHtml(activationUrl);

    return {
      subject: 'Activate your Agent Management account',
      text: [
        `Hello ${agentName || 'Agent'},`,
        '',
        'Your Agent Management account has been created.',
        'Use the secure link below to create your password and activate your account.',
        '',
        activationUrl,
        '',
        'This link is valid for 10 minutes and can be used only once.',
        'If the link expires, please contact your admin for a new invitation.',
      ].join('\n'),
      html: `
        <div style="margin:0;padding:0;background:#f6f8fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f8fb;padding:32px 0">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #d9e1ef;border-radius:10px;overflow:hidden">
                  <tr>
                    <td style="padding:22px 28px;border-bottom:1px solid #e5eaf3">
                      <div style="font-size:15px;font-weight:700;color:#0736a4">Agent Management</div>
                      <div style="margin-top:4px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b">Secure account setup</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px">
                      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;color:#020617">Create your password</h1>
                      <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#334155">Hello ${safeName},</p>
                      <p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#334155">
                        Your Agent Management account has been created. Click the button below to create your password and activate your account.
                      </p>
                      <p style="margin:0 0 24px">
                        <a href="${safeUrl}" style="display:inline-block;background:#059669;color:#ffffff;padding:12px 18px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:700">
                          Activate Account
                        </a>
                      </p>
                      <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#475569">
                        This secure link is valid for <strong>10 minutes</strong> and can be used only once.
                      </p>
                      <p style="margin:0;font-size:12px;line-height:1.5;color:#64748b">
                        If the button does not work, copy and paste this link into your browser:<br />
                        <a href="${safeUrl}" style="color:#0736a4;word-break:break-all">${safeUrl}</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      `,
    };
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
