import jwt from 'jsonwebtoken';
import { globalPrisma } from '#lib/globalPrisma.js';
import { createWorkspaceService } from '../../workspaces/services/createWorkspace.service.js';

export interface VerifyEmailDTO {
  email: string;
  code: string;
}

export const verifyEmailService = async (data: VerifyEmailDTO) => {
  const { email, code } = data;

  if (!email || !code) {
    throw new Error('이메일과 인증코드를 모두 입력해주세요.');
  }

  const user = await globalPrisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: { ownedWorkspaces: true, workspaces: true },
  });

  if (!user) {
    throw new Error('가입 요청된 사용자를 찾을 수 없습니다.');
  }

  if (user.isEmailVerified) {
    throw new Error('이미 인증이 완료된 계정입니다. 로그인해주세요.');
  }

  if (!user.verificationCode || user.verificationCode !== code.trim()) {
    throw new Error('인증코드가 올바르지 않습니다.');
  }

  if (user.verificationExpiresAt && new Date() > user.verificationExpiresAt) {
    throw new Error('인증코드가 만료되었습니다. 인증코드를 재발송해주세요.');
  }

  // 1. 유저 인증 상태 갱신
  const updatedUser = await globalPrisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      verificationToken: null,
      verificationCode: null,
      verificationExpiresAt: null,
    },
    include: { ownedWorkspaces: true, workspaces: true },
  });

  // 2. 기본 워크스페이스 자동 프로비저닝 (소유한 워크스페이스가 없을 경우)
  let defaultWorkspace = updatedUser.ownedWorkspaces?.[0];
  if (!defaultWorkspace) {
    try {
      const wsName = `${updatedUser.name || 'My'}'s Workspace`;
      defaultWorkspace = await createWorkspaceService(
        {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
        },
        { name: wsName }
      );
    } catch (wsErr: any) {
      console.error('[WORKSPACE PROVISION ERROR]', wsErr.message);
    }
  }

  // 3. JWT 토큰 발급
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  const token = jwt.sign(
    { userId: updatedUser.id, email: updatedUser.email, name: updatedUser.name },
    jwtSecret,
    { expiresIn: '7d' }
  );

  return {
    message: '이메일 인증이 완료되어 회원가입이 완료되었습니다.',
    token,
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      avatarColor: updatedUser.avatarColor,
      isEmailVerified: true,
    },
    workspace: defaultWorkspace,
  };
};
