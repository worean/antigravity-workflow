import jwt from 'jsonwebtoken';
import { globalPrisma } from '#lib/globalPrisma.js';
import { createWorkspaceService } from '../../workspaces/services/createWorkspace.service.js';

export const verifyEmailLinkService = async (token: string) => {
  if (!token) {
    throw new Error('인증 토큰이 누락되었습니다.');
  }

  const user = await globalPrisma.user.findUnique({
    where: { verificationToken: token },
    include: { ownedWorkspaces: true },
  });

  if (!user) {
    throw new Error('유효하지 않거나 이미 완료된 인증 링크입니다.');
  }

  if (user.verificationExpiresAt && new Date() > user.verificationExpiresAt) {
    throw new Error('인증 링크가 만료되었습니다. 다시 로그인하여 재발송해주세요.');
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
    include: { ownedWorkspaces: true },
  });

  // 2. 기본 워크스페이스 생성
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
  const jwtToken = jwt.sign(
    { userId: updatedUser.id, email: updatedUser.email, name: updatedUser.name },
    jwtSecret,
    { expiresIn: '7d' }
  );

  return {
    token: jwtToken,
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      isEmailVerified: true,
    },
    workspace: defaultWorkspace,
  };
};
