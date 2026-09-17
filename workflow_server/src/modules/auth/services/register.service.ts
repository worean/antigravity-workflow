import bcrypt from 'bcryptjs';
import { globalPrisma } from '#lib/globalPrisma.js';
import { generateVerificationCredentials, sendVerificationEmail } from '#lib/mailer.js';

export interface RegisterDTO {
  email: string;
  password: string;
  name?: string;
}

export const registerService = async (data: RegisterDTO) => {
  const { email, password, name } = data;

  if (!email || !email.trim()) {
    throw new Error('이메일을 입력해주세요.');
  }

  // 🔒 비밀번호 최소 6자 이상 유효성 검사
  if (!password || password.length < 6) {
    throw new Error('비밀번호는 최소 6자 이상이어야 합니다.');
  }

  const existingUser = await globalPrisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (existingUser) {
    if (existingUser.password === null) {
      throw new Error('해당 이메일은 Google(소셜) 로그인으로 가입된 계정입니다. 소셜 로그인을 이용해주세요.');
    }
    if (!existingUser.isEmailVerified) {
      // 기존 가입 미인증 상태인 경우 인증 코드 재생성 및 재발송
      const { verificationToken, verificationCode, verificationExpiresAt } = generateVerificationCredentials();
      const updated = await globalPrisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: name?.trim() || existingUser.name,
          password: await bcrypt.hash(password, 10),
          verificationToken,
          verificationCode,
          verificationExpiresAt,
        },
      });
      await sendVerificationEmail(updated.email, verificationToken, verificationCode, updated.name || undefined);
      return {
        message: '이미 가입 요청된 계정입니다. 인증코드를 다시 발송했습니다.',
        requireVerification: true,
        email: updated.email,
      };
    }
    throw new Error('이미 가입된 이메일 주소입니다.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const { verificationToken, verificationCode, verificationExpiresAt } = generateVerificationCredentials();

  const user = await globalPrisma.user.create({
    data: {
      email: email.trim().toLowerCase(),
      name: name?.trim() || email.split('@')[0],
      password: hashedPassword,
      isEmailVerified: false,
      verificationToken,
      verificationCode,
      verificationExpiresAt,
    },
  });

  // 인증 이메일 발송 (SMTP 또는 콘솔)
  await sendVerificationEmail(user.email, verificationToken, verificationCode, user.name || undefined);

  return {
    message: '회원가입 요청이 접수되었습니다. 이메일로 발송된 6자리 인증코드를 입력해주세요.',
    requireVerification: true,
    email: user.email,
  };
};
