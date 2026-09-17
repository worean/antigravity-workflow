import { globalPrisma } from '#lib/globalPrisma.js';
import { generateVerificationCredentials, sendVerificationEmail } from '#lib/mailer.js';

export const resendVerificationService = async (email: string) => {
  if (!email || !email.trim()) {
    throw new Error('이메일을 입력해주세요.');
  }

  const user = await globalPrisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user) {
    throw new Error('사용자를 찾을 수 없습니다.');
  }

  if (user.isEmailVerified) {
    throw new Error('이미 인증 완료된 계정입니다. 로그인해주세요.');
  }

  const { verificationToken, verificationCode, verificationExpiresAt } = generateVerificationCredentials();

  const updated = await globalPrisma.user.update({
    where: { id: user.id },
    data: {
      verificationToken,
      verificationCode,
      verificationExpiresAt,
    },
  });

  await sendVerificationEmail(updated.email, verificationToken, verificationCode, updated.name || undefined);

  return {
    message: '새로운 6자리 인증코드가 발송되었습니다. 메일을 확인해주세요.',
    email: updated.email,
  };
};
