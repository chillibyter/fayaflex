import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.ZOHO_SMTP_HOST || 'smtppro.zoho.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_EMAIL,
    pass: process.env.ZOHO_APP_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!process.env.ZOHO_EMAIL || !process.env.ZOHO_APP_PASSWORD) {
    console.log('[Email] Zoho credentials not configured, skipping email send');
    console.log('[Email] Would have sent to:', options.to);
    console.log('[Email] Subject:', options.subject);
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: `"FayaFlex" <${process.env.ZOHO_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log('[Email] Message sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, resetLink: string): Promise<boolean> {
  const subject = 'Reset Your Password - FayaFlex';
  
  const text = `
Hi,

You requested to reset your password for FayaFlex.

Click this link to reset your password:
${resetLink}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

- The FayaFlex Team
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
  <div style="max-width: 500px; margin: 0 auto; background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 12px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 28px; color: white;">🏃</span>
      </div>
      <h1 style="color: #18181b; font-size: 24px; margin: 0;">Reset Your Password</h1>
    </div>
    
    <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      You requested to reset your password for FayaFlex. Click the button below to create a new password.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Reset Password
      </a>
    </div>
    
    <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
      This link will expire in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
    
    <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
      FayaFlex<br>
      Build healthy habits together
    </p>
  </div>
</body>
</html>
`;

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
}
