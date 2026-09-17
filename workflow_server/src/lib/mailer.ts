import nodemailer from 'nodemailer';
import crypto from 'crypto';

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * 🔑 인증 토큰 및 6자리 OTP 생성기
 */
export const generateVerificationCredentials = () => {
  // 64자리 URL 안전 매직 링크 토큰
  const verificationToken = crypto.randomBytes(32).toString('hex');
  // 6자리 직관적 OTP 인증 번호
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  // 24시간 만료 시간
  const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return { verificationToken, verificationCode, verificationExpiresAt };
};

/**
 * ✉️ Nodemailer 트랜스포터 초기화
 */
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return null;
};

/**
 * 📧 인증 메일 발송 서비스 (Nodemailer + Dev Console Logger)
 */
export const sendVerificationEmail = async (
  toEmail: string,
  verificationToken: string,
  verificationCode: string,
  userName?: string
): Promise<{ success: boolean; mode: 'smtp' | 'console' }> => {
  const clientBaseUrl = process.env.CLIENT_BASE_URL || 'http://localhost:5173';
  const verifyUrl = `${clientBaseUrl}/auth/verified?token=${verificationToken}`;
  const subject = '[AntiGravity Workflow] 이메일 계정 인증 안내';

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background: #1e1e1e; color: #d4d4d4; border-radius: 8px; border: 1px solid #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #ffffff; margin: 0; font-size: 1.3rem;">AntiGravity Workflow</h2>
        <p style="color: #9cdcfe; font-size: 0.85rem; margin-top: 4px;">계정 이메일 인증을 완료해주세요</p>
      </div>

      <div style="background: #252526; padding: 20px; border-radius: 6px; border: 1px solid #3c3c3c;">
        <p style="margin: 0 0 12px 0; font-size: 0.9rem;">안녕하세요 <strong>${userName || '사용자'}</strong>님,</p>
        <p style="margin: 0 0 16px 0; font-size: 0.85rem; color: #cccccc; line-height: 1.5;">
          AntiGravity Workflow 시스템에 가입해주셔서 감사합니다. 아래의 6자리 인증번호를 화면에 입력하시거나 버튼을 클릭하여 회원가입을 완료해주세요.
        </p>

        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; padding: 12px 28px; background: #0e639c; color: #ffffff; font-size: 1.8rem; font-weight: bold; letter-spacing: 6px; border-radius: 6px;">
            ${verificationCode}
          </div>
          <p style="font-size: 0.75rem; color: #888888; margin-top: 8px;">(인증 번호는 24시간 동안 유효합니다)</p>
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <a href="${verifyUrl}" style="display: inline-block; padding: 10px 24px; background: #007acc; color: #ffffff; text-decoration: none; font-size: 0.85rem; font-weight: 600; border-radius: 4px;">
            이메일 인증 링크로 바로 완료하기
          </a>
        </div>
      </div>

      <div style="margin-top: 20px; text-align: center; font-size: 0.75rem; color: #666666;">
        본 메일은 회원가입 요청에 의해 발송되었습니다. 본인이 요청하지 않은 경우 무시하셔도 됩니다.
      </div>
    </div>
  `;

  const transporter = createTransporter();

  // 1. SMTP 환경이 설정된 경우 실제 이메일 발송
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"AntiGravity Workflow" <noreply@antigravity.internal>',
        to: toEmail,
        subject,
        html: htmlContent,
      });
      console.log(`[MAILER] Verification email sent to ${toEmail} via SMTP`);
      return { success: true, mode: 'smtp' };
    } catch (err: any) {
      console.error(`[MAILER ERROR] Failed to send email via SMTP:`, err.message);
    }
  }

  // 2. 개발/테스트 환경용 콘솔 시각화 로거 (Mock Logger)
  console.log(`\n=============================================================`);
  console.log(`✉️  [DEV EMAIL VERIFICATION] To: ${toEmail}`);
  console.log(`🔑  6-Digit OTP Code: [ ${verificationCode} ]`);
  console.log(`🔗  Verification URL: ${verifyUrl}`);
  console.log(`⏳  Expires At: 24 Hours later`);
  console.log(`=============================================================\n`);

  return { success: true, mode: 'console' };
};
