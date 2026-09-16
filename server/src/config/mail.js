import nodemailer from 'nodemailer';

const hasSmtp = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

const transporter = hasSmtp
  ? nodemailer.createTransport(
      process.env.SMTP_SERVICE === 'gmail' || (process.env.SMTP_USER && process.env.SMTP_USER.includes('@gmail.com'))
        ? {
            service: 'gmail',
            auth: {
              user: process.env.SMTP_USER.trim(),
              pass: process.env.SMTP_PASS.replace(/\s+/g, ''),
            },
          }
        : {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
              user: process.env.SMTP_USER.trim(),
              pass: process.env.SMTP_PASS.replace(/\s+/g, ''),
            },
          }
    )
  : null;

export async function sendOtpMail({ to, otp, purpose = 'registration' }) {
  const from = process.env.EMAIL_FROM || '"GLUG Community" <glug.jec@gmail.com>';
  const subject = `Your GLUG Verification Code: ${otp}`;
  const purposeLabel =
    purpose === 'registration' || purpose === 'register'
      ? 'account registration'
      : purpose === 'reset'
      ? 'password reset'
      : purpose;

  const digits = String(otp).split('');

  const digitCellsHtml = digits
    .map(
      (d) => `
      <td align="center" valign="middle" style="padding: 0 4px;">
        <div style="width: 44px; height: 54px; line-height: 54px; background: #0c111e; border: 1.5px solid #2563eb; border-radius: 12px; font-size: 28px; font-weight: 800; color: #60a5fa; text-align: center; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.28);">
          ${d}
        </div>
      </td>`
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GLUG Verification Code</title>
      </head>
      <body style="margin: 0; padding: 28px 12px; background-color: #07090e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; margin: 0 auto;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0f1422; border: 1px solid #1a2336; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);">
                <tr>
                  <td height="4" style="background: linear-gradient(90deg, #2563eb 0%, #38bdf8 50%, #6366f1 100%);"></td>
                </tr>

                <tr>
                  <td style="padding: 38px 32px 32px 32px; text-align: center;">
                    <div style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: 1px; margin-bottom: 2px;">GLUG</div>
                    <div style="font-size: 12px; color: #60a5fa; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px;">GNU/Linux User Group</div>

                    <div style="margin-bottom: 22px;">
                      <span style="background: rgba(37, 99, 235, 0.12); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 20px; padding: 5px 14px; font-size: 11px; font-weight: 700; color: #93c5fd; text-transform: uppercase; letter-spacing: 0.08em; display: inline-block;">
                        One-Time Security Code
                      </span>
                    </div>

                    <h1 style="font-size: 21px; font-weight: 700; color: #f8fafc; margin: 0 0 10px 0;">Verify Your Email Address</h1>
                    <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0 0 26px 0;">
                      Thank you for connecting with the GLUG community. Use the 6-digit verification code below to complete your <strong style="color: #cbd5e1;">${purposeLabel}</strong>:
                    </p>

                    <div style="background: #131929; border: 1px solid #1e293b; border-radius: 18px; padding: 22px 14px 18px 14px; margin-bottom: 20px; box-shadow: inset 0 2px 8px rgba(0,0,0,0.4);">
                      <table align="center" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          ${digitCellsHtml}
                        </tr>
                      </table>

                      <div style="margin-top: 16px;">
                        <span style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.28); border-radius: 20px; padding: 4px 12px; font-size: 12px; color: #34d399; font-weight: 600; display: inline-block;">
                          Valid for 10 minutes
                        </span>
                      </div>
                    </div>

                    <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.22); border-radius: 12px; padding: 12px 16px; text-align: left; margin-bottom: 24px;">
                      <div style="font-size: 12px; color: #fca5a5; line-height: 1.5;">
                        <strong>Security Note:</strong> Never share this code with anyone. GLUG administrators will never ask for your verification code or password.
                      </div>
                    </div>

                    <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0;">
                      If you didn't request this verification, you can safely ignore this email. Someone may have mistyped their email address.
                    </p>

                    <div style="height: 1px; background: #1a2336; margin: 28px 0 20px 0;"></div>

                    <p style="font-size: 12px; color: #64748b; margin: 0 0 6px 0; font-weight: 500;">
                      GNU/Linux User Group
                    </p>
                    <p style="font-size: 11px; color: #475569; margin: 0;">
                      Open minds build brighter tomorrows.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  if (!transporter) {
    console.log('\n' + '='.repeat(54));
    console.log('  [GLUG DEV MODE] NODEMAILER OTP CONSOLE FALLBACK');
    console.log(`  To: ${to}`);
    console.log(`  Purpose: ${purpose}`);
    console.log(`  Verification OTP: >>> ${otp} <<<`);
    console.log(`  Valid for: 10 minutes`);
    console.log('='.repeat(54) + '\n');
    return { success: true, mode: 'dev-console' };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: `Your GLUG verification code is: ${otp}. It expires in 10 minutes. Do not share it with anyone.`,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Nodemailer Error]', err);
    throw new Error('Failed to send verification email');
  }
}

class AsyncMailQueue {
  constructor(concurrency = 2, maxRetries = 3) {
    this.concurrency = concurrency;
    this.maxRetries = maxRetries;
    this.queue = [];
    this.active = 0;
  }

  add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        task,
        attempts: 0,
        resolve,
        reject,
      });
      this.process();
    });
  }

  async process() {
    if (this.active >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.active++;
    const item = this.queue.shift();

    try {
      item.attempts++;
      const result = await item.task();
      item.resolve(result);
    } catch (err) {
      if (item.attempts < this.maxRetries) {
        const delay = Math.pow(2, item.attempts) * 1000;
        setTimeout(() => {
          this.queue.push(item);
          this.process();
        }, delay);
      } else {
        console.error('[Mail Queue Failure]', err.message);
        item.reject(err);
      }
    } finally {
      this.active--;
      this.process();
    }
  }
}

export const mailQueue = new AsyncMailQueue(2, 3);

function getClientBaseUrl() {
  const envUrl =
    process.env.CLIENT_URL ||
    process.env.FRONTEND_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    process.env.RENDER_EXTERNAL_URL;

  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  return 'http://localhost:5173';
}

function formatCommentPreview(raw) {
  if (!raw) return '';
  let str = String(raw);
  str = str.replace(/<\s*br\s*\/?>/gi, '\n');
  str = str.replace(/<\s*\/(p|div|li|h[1-6])\s*>/gi, '\n');
  str = str.replace(/<[^>]+>/g, '');
  str = str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
  str = str.replace(/\n\s*\n+/g, '\n\n').trim();
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
}

export async function sendNotificationMail({
  to,
  recipientUsername,
  senderUsername,
  type,
  postTitle,
  commentBody,
  postId,
}) {
  const clientUrl = getClientBaseUrl();
  const postUrl = `${clientUrl}/posts/${postId}`;
  const settingsUrl = `${clientUrl}/settings`;
  const from = process.env.EMAIL_FROM || '"GLUG Community" <glug.jec@gmail.com>';

  const isReply = type === 'reply';
  const actionText = isReply ? 'replied to your comment' : 'commented on your post';
  const subject = isReply
    ? `${senderUsername} replied to your comment on "${postTitle}"`
    : `${senderUsername} commented on "${postTitle}"`;

  const cleanBody = formatCommentPreview(commentBody);
  const cleanRecipient = String(recipientUsername || 'user').trim();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 16px 8px; background-color: #07090e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0f1422; border: 1px solid #1a2336; border-radius: 18px; overflow: hidden; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7);">
                <tr>
                  <td height="4" style="background: linear-gradient(90deg, #2563eb 0%, #38bdf8 50%, #6366f1 100%);"></td>
                </tr>

                <tr>
                  <td style="padding: 24px 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
                      <tr>
                        <td align="left" valign="middle">
                          <div style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; line-height: 1.1;">GLUG</div>
                          <div style="font-size: 10px; color: #60a5fa; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; margin-top: 3px;">GNU/Linux User Group</div>
                        </td>
                        <td align="right" valign="middle">
                          <span style="white-space: nowrap; display: inline-block; background: rgba(37, 99, 235, 0.15); border: 1px solid rgba(59, 130, 246, 0.35); border-radius: 20px; padding: 4px 10px; font-size: 10px; font-weight: 700; color: #93c5fd; text-transform: uppercase; letter-spacing: 0.05em;">
                            ${isReply ? 'New Reply' : 'New Comment'}
                          </span>
                        </td>
                      </tr>
                    </table>

                    <div style="font-size: 15px; color: #f1f5f9; margin-bottom: 12px; font-weight: 500;">
                      Hello <span style="color: #60a5fa; font-weight: 700;">@${cleanRecipient},</span>
                    </div>

                    <div style="font-size: 13.5px; color: #94a3b8; line-height: 1.5; margin-bottom: 12px;">
                      <span style="color: #ffffff; font-weight: 700;">@${senderUsername}</span> ${actionText}:
                    </div>

                    <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid #1e293b; border-radius: 10px; padding: 10px 14px; margin-bottom: 14px;">
                      <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 3px;">Post</div>
                      <div style="font-size: 13.5px; font-weight: 600; color: #38bdf8; line-height: 1.4;">${postTitle}</div>
                    </div>

                    <div style="background: #131929; border: 1px solid #1e293b; border-left: 3px solid #2563eb; border-radius: 10px; padding: 14px 16px; margin-bottom: 22px;">
                      <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">
                        ${isReply ? 'Reply' : 'Comment'}
                      </div>
                      <div style="font-size: 13.5px; color: #cbd5e1; line-height: 1.55; word-break: break-word;">
                        ${cleanBody}
                      </div>
                    </div>

                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 22px;">
                      <tr>
                        <td align="center">
                          <a href="${postUrl}" target="_blank" style="display: inline-block; background: #2563eb; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; font-size: 13.5px; font-weight: 600; padding: 12px 28px; border-radius: 9px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35); letter-spacing: 0.2px;">
                            View Discussion &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <div style="height: 1px; background: #1a2336; margin: 18px 0 14px 0;"></div>

                    <div style="font-size: 11px; color: #64748b; line-height: 1.5; text-align: center;">
                      You received this email based on your GLUG notification preferences.<br/>
                      Manage alerts in your <a href="${settingsUrl}" target="_blank" style="color: #60a5fa; text-decoration: none;">Account Settings</a>.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  if (!transporter) {
    console.log('\n' + '='.repeat(54));
    console.log('  [GLUG DEV MODE] NOTIFICATION EMAIL CONSOLE FALLBACK');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Preview: "${commentBody?.slice(0, 80)}..."`);
    console.log(`  Target: ${postUrl}`);
    console.log('='.repeat(54) + '\n');
    return { success: true, mode: 'dev-console' };
  }

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text: `${senderUsername} ${actionText} on "${postTitle}":\n\n${commentBody}\n\nView discussion: ${postUrl}`,
  });
  return { success: true, messageId: info.messageId };
}

export async function sendStrikeMail({
  to,
  username,
  strikeLevel,
  reason,
  category = 'policy_violation',
  postingRestrictedUntil = null,
  strikeExpiresAt = null,
}) {
  const from = process.env.EMAIL_FROM || '"GLUG Moderation" <glug.jec@gmail.com>';
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  const standingUrl = `${clientUrl}/settings?tab=standing`;

  let strikeTitle = '';
  let strikeDetails = '';
  let badgeColor = '#f59e0b';
  let badgeBg = 'rgba(245, 158, 11, 0.15)';

  if (strikeLevel === 1) {
    strikeTitle = 'Moderation Warning (Strike 1 of 3)';
    badgeColor = '#eab308';
    badgeBg = 'rgba(234, 179, 8, 0.15)';
    strikeDetails = `This is a formal warning regarding a community policy violation. Your account privileges remain active. This warning will automatically expire in 7 days if no further violations occur.`;
  } else if (strikeLevel === 2) {
    strikeTitle = 'Posting Privileges Suspended (Strike 2 of 3)';
    badgeColor = '#f97316';
    badgeBg = 'rgba(249, 115, 22, 0.15)';
    strikeDetails = `Because of a second violation during your warning period, your ability to create posts, comments, and replies has been restricted for 24 hours. All other functions (including direct chats, notifications, and viewing) remain operational. This strike will automatically expire in 30 days, resetting your record to 0 strikes if no further violations occur.`;
  } else {
    strikeTitle = 'Account Permanently Suspended (Strike 3 of 3)';
    badgeColor = '#ef4444';
    badgeBg = 'rgba(239, 68, 68, 0.15)';
    strikeDetails = `Your account has received a third strike and has been permanently suspended in accordance with community guidelines.`;
  }

  const subject = `[GLUG Notice] ${strikeTitle}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${strikeTitle}</title>
      </head>
      <body style="margin:0;padding:28px 12px;background-color:#07090e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:540px;margin:0 auto;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0f1422;border:1px solid #1a2336;border-radius:24px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.7);">
                <tr>
                  <td height="4" style="background:${badgeColor};"></td>
                </tr>
                <tr>
                  <td style="padding:32px 28px;">
                    <div style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:1px;margin-bottom:2px;">GLUG</div>
                    <div style="font-size:11px;color:#60a5fa;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:22px;">Community Safety</div>

                    <div style="margin-bottom:18px;">
                      <span style="background:${badgeBg};border:1px solid ${badgeColor};border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;color:${badgeColor};text-transform:uppercase;letter-spacing:0.06em;display:inline-block;">
                        ${strikeTitle}
                      </span>
                    </div>

                    <h1 style="font-size:19px;font-weight:700;color:#f8fafc;margin:0 0 10px 0;">Hello @${username},</h1>
                    <p style="font-size:14px;color:#94a3b8;line-height:1.6;margin:0 0 18px 0;">
                      ${strikeDetails}
                    </p>

                    <div style="background:#131929;border:1px solid #1e293b;border-left:3px solid ${badgeColor};border-radius:10px;padding:14px 16px;margin-bottom:20px;">
                      <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Violation Reason</div>
                      <div style="font-size:13.5px;color:#cbd5e1;line-height:1.5;">${reason || 'Violation of community safety standards'}</div>
                      <div style="font-size:11px;color:#94a3b8;margin-top:6px;">Category: <strong style="color:#f1f5f9;">${category}</strong></div>
                    </div>

                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:22px;">
                      <tr>
                        <td align="center">
                          <a href="${standingUrl}" target="_blank" style="display:inline-block;background:${badgeColor};color:#ffffff;text-decoration:none;font-size:13.5px;font-weight:600;padding:12px 26px;border-radius:8px;letter-spacing:0.2px;">
                            Review Standing &amp; Appeal
                          </a>
                        </td>
                      </tr>
                    </table>

                    <div style="font-size:11px;color:#64748b;line-height:1.5;text-align:center;">
                      If you believe this action was applied in error, you may submit an appeal directly from your standing dashboard.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  if (!transporter) {
    console.log('\n' + '='.repeat(54));
    console.log('  [GLUG DEV MODE] STRIKE EMAIL CONSOLE FALLBACK');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Level: Strike ${strikeLevel}`);
    console.log(`  Reason: ${reason}`);
    console.log('='.repeat(54) + '\n');
    return { success: true, mode: 'dev-console' };
  }

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text: `GLUG Notice: ${strikeTitle}\n\nHello @${username},\n\n${strikeDetails}\n\nReason: ${reason}\nCategory: ${category}\n\nReview standing and submit appeal: ${standingUrl}`,
  });
  return { success: true, messageId: info.messageId };
}

export async function sendAppealDecisionMail({
  to,
  username,
  decision = 'approved',
  appealType = 'strike',
  strikeIndex = 1,
  adminNotes = '',
  originalReason = '',
  originalCategory = '',
  statement = '',
  contentTitle = '',
  postId = null,
  currentStrikes = null,
  isBanned = false,
}) {
  const isApproved = decision === 'approved';
  const from = process.env.EMAIL_FROM || '"GLUG Moderation" <glug.jec@gmail.com>';
  const clientUrl = getClientBaseUrl();
  const accentColor = isApproved ? '#10b981' : '#ef4444';
  const badgeBg = isApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
  const badgeText = isApproved ? 'APPEAL APPROVED' : 'APPEAL DENIED';

  let subject = '';
  let appealLabel = '';
  let mainMessage = '';
  let buttonLabel = '';
  let buttonUrl = '';

  const safeTitle = contentTitle ? String(contentTitle).replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
  const safeReason = originalReason ? String(originalReason).replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
  const safeStatement = statement ? String(statement).replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
  const safeAdminNotes = adminNotes ? String(adminNotes).replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';

  if (appealType === 'account_ban') {
    appealLabel = 'Account Ban Appeal';
    if (isApproved) {
      subject = '[GLUG Notice] Account Ban Appeal Approved - Access Restored';
      mainMessage = 'We have reviewed your appeal regarding the suspension of your GLUG account. An administrator has approved your appeal and lifted your account suspension. Your account access has been fully restored.';
      buttonLabel = 'Log In to Your Account';
      buttonUrl = `${clientUrl}/login`;
    } else {
      subject = '[GLUG Notice] Account Ban Appeal Decision - Ban Upheld';
      mainMessage = 'We have reviewed your appeal regarding the suspension of your GLUG account. After review by the moderation team, your appeal has been denied. The permanent suspension remains in effect in accordance with community guidelines.';
      buttonLabel = 'Community Guidelines';
      buttonUrl = `${clientUrl}/about`;
    }
  } else if (appealType === 'strike') {
    const sIndexLabel = strikeIndex ? `Strike ${strikeIndex}` : 'Strike';
    appealLabel = `Strike Penalty Appeal (${sIndexLabel})`;
    if (isApproved) {
      subject = `[GLUG Notice] ${sIndexLabel} Appeal Approved - Penalty Revoked`;
      mainMessage = `Your appeal regarding ${sIndexLabel} has been reviewed and approved. The strike penalty has been removed from your record, and any restrictions on your posting privileges have been lifted.`;
      buttonLabel = 'View Account Standing';
      buttonUrl = `${clientUrl}/settings?tab=standing`;
    } else {
      subject = `[GLUG Notice] ${sIndexLabel} Appeal Decision - Strike Maintained`;
      mainMessage = `Your appeal regarding ${sIndexLabel} has been reviewed and denied. The strike and associated restrictions remain active on your account in accordance with community guidelines.`;
      buttonLabel = 'View Account Standing';
      buttonUrl = `${clientUrl}/settings?tab=standing`;
    }
  } else if (appealType === 'post') {
    appealLabel = 'Post Content Appeal';
    if (isApproved) {
      subject = '[GLUG Notice] Post Appeal Approved - Content Restored';
      mainMessage = safeTitle
        ? `Your appeal regarding your post "${safeTitle}" has been approved. The moderation restrictions have been cleared, and your post has been restored to the community.`
        : 'Your appeal regarding your flagged post has been approved. The content has been restored and is visible to the community again.';
      buttonLabel = postId ? 'View Restored Post' : 'View Account Standing';
      buttonUrl = postId ? `${clientUrl}/posts/${postId}` : `${clientUrl}/settings?tab=standing`;
    } else {
      subject = '[GLUG Notice] Post Appeal Decision - Content Removed';
      mainMessage = safeTitle
        ? `Your appeal regarding your post "${safeTitle}" has been reviewed and denied. The post remains removed in accordance with community guidelines.`
        : 'Your appeal regarding your flagged post has been reviewed and denied. The post remains removed in accordance with community guidelines.';
      buttonLabel = 'View Account Standing';
      buttonUrl = `${clientUrl}/settings?tab=standing`;
    }
  } else if (appealType === 'comment') {
    appealLabel = 'Comment Content Appeal';
    if (isApproved) {
      subject = '[GLUG Notice] Comment Appeal Approved - Content Restored';
      mainMessage = safeTitle
        ? `Your appeal regarding your comment on "${safeTitle}" has been approved. Your comment has been restored to the discussion.`
        : 'Your appeal regarding your flagged comment has been approved. Your comment has been unhidden and restored to the discussion.';
      buttonLabel = postId ? 'View Discussion' : 'View Account Standing';
      buttonUrl = postId ? `${clientUrl}/posts/${postId}` : `${clientUrl}/settings?tab=standing`;
    } else {
      subject = '[GLUG Notice] Comment Appeal Decision - Comment Removed';
      mainMessage = safeTitle
        ? `Your appeal regarding your comment on "${safeTitle}" has been reviewed and denied. The comment will remain removed in accordance with community guidelines.`
        : 'Your appeal regarding your flagged comment has been reviewed and denied. The comment will remain removed in accordance with community guidelines.';
      buttonLabel = 'View Account Standing';
      buttonUrl = `${clientUrl}/settings?tab=standing`;
    }
  } else {
    appealLabel = 'Moderation Appeal';
    if (isApproved) {
      subject = '[GLUG Notice] Moderation Appeal Approved';
      mainMessage = 'Your moderation appeal has been reviewed and approved by an administrator. The requested action has been granted and your standing updated.';
      buttonLabel = 'View Account Standing';
      buttonUrl = `${clientUrl}/settings?tab=standing`;
    } else {
      subject = '[GLUG Notice] Moderation Appeal Decision - Denied';
      mainMessage = 'Your moderation appeal has been reviewed and denied by an administrator. The moderation decision remains in effect.';
      buttonLabel = 'View Account Standing';
      buttonUrl = `${clientUrl}/settings?tab=standing`;
    }
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
      </head>
      <body style="margin:0;padding:28px 12px;background-color:#07090e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:540px;margin:0 auto;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0f1422;border:1px solid #1a2336;border-radius:24px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.7);">
                <tr>
                  <td height="4" style="background:${accentColor};"></td>
                </tr>
                <tr>
                  <td style="padding:32px 28px;">
                    <div style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:1px;margin-bottom:2px;">GLUG</div>
                    <div style="font-size:11px;color:#60a5fa;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:22px;">GNU/Linux User Group • Moderation Review</div>

                    <div style="margin-bottom:18px;">
                      <span style="background:${badgeBg};border:1px solid ${accentColor};border-radius:20px;padding:4px 14px;font-size:11px;font-weight:700;color:${accentColor};text-transform:uppercase;letter-spacing:0.06em;display:inline-block;">
                        ${badgeText}
                      </span>
                    </div>

                    <h1 style="font-size:19px;font-weight:700;color:#f8fafc;margin:0 0 10px 0;">Hello @${username},</h1>
                    <p style="font-size:14px;color:#94a3b8;line-height:1.6;margin:0 0 20px 0;">
                      ${mainMessage}
                    </p>

                    <div style="background:#131929;border:1px solid #1e293b;border-left:3px solid ${accentColor};border-radius:12px;padding:16px 18px;margin-bottom:22px;">
                      <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Appeal Details</div>
                      <div style="font-size:13px;color:#cbd5e1;line-height:1.5;margin-bottom:6px;">
                        <strong style="color:#94a3b8;">Type:</strong> ${appealLabel}
                      </div>
                      ${safeTitle ? `
                      <div style="font-size:13px;color:#cbd5e1;line-height:1.5;margin-bottom:6px;">
                        <strong style="color:#94a3b8;">Target Item:</strong> "${safeTitle}"
                      </div>` : ''}
                      ${safeReason ? `
                      <div style="font-size:13px;color:#cbd5e1;line-height:1.5;margin-bottom:6px;">
                        <strong style="color:#94a3b8;">Original Reason:</strong> ${safeReason}
                      </div>` : ''}
                      ${originalCategory ? `
                      <div style="font-size:13px;color:#cbd5e1;line-height:1.5;margin-bottom:6px;">
                        <strong style="color:#94a3b8;">Category:</strong> ${originalCategory}
                      </div>` : ''}
                      ${currentStrikes !== null && !isBanned ? `
                      <div style="font-size:13px;color:#cbd5e1;line-height:1.5;">
                        <strong style="color:#94a3b8;">Active Strikes:</strong> ${currentStrikes} of 3
                      </div>` : ''}
                    </div>

                    ${safeAdminNotes ? `
                    <div style="background:rgba(56,189,248,0.07);border:1px solid rgba(56,189,248,0.22);border-radius:12px;padding:14px 16px;margin-bottom:22px;text-align:left;">
                      <div style="font-size:10.5px;font-weight:700;color:#38bdf8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Administrator Note</div>
                      <div style="font-size:13.5px;color:#f0f9ff;line-height:1.5;">${safeAdminNotes}</div>
                    </div>` : ''}

                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:22px;">
                      <tr>
                        <td align="center">
                          <a href="${buttonUrl}" target="_blank" style="display:inline-block;background:${accentColor};color:#ffffff;text-decoration:none;font-size:13.5px;font-weight:600;padding:12px 26px;border-radius:8px;letter-spacing:0.2px;">
                            ${buttonLabel}
                          </a>
                        </td>
                      </tr>
                    </table>

                    <div style="height:1px;background:#1a2336;margin:24px 0 18px 0;"></div>

                    <div style="font-size:11px;color:#64748b;line-height:1.5;text-align:center;">
                      GLUG Community Moderation • Open minds build brighter tomorrows.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  if (!transporter) {
    console.log('\n' + '='.repeat(54));
    console.log('  [GLUG DEV MODE] APPEAL DECISION EMAIL CONSOLE FALLBACK');
    console.log(`  To: ${to}`);
    console.log(`  Decision: ${decision.toUpperCase()}`);
    console.log(`  Type: ${appealType}`);
    console.log(`  Subject: ${subject}`);
    if (adminNotes) console.log(`  Admin Note: ${adminNotes}`);
    console.log('='.repeat(54) + '\n');
    return { success: true, mode: 'dev-console' };
  }

  const plainText = `${subject}\n\nHello @${username},\n\n${mainMessage}\n\nType: ${appealLabel}${safeTitle ? `\nItem: "${safeTitle}"` : ''}${safeReason ? `\nReason: ${safeReason}` : ''}${adminNotes ? `\nAdministrator Note: ${adminNotes}` : ''}\n\n${buttonLabel}: ${buttonUrl}`;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text: plainText,
  });
  return { success: true, messageId: info.messageId };
}

