import crypto from 'crypto';
import { globalPrisma } from '#lib/globalPrisma.js';
import { workspaceManager } from '#lib/workspaceManager.js';

export interface CreateInvitationParams {
  workspaceId: number;
  email: string;
  role?: string;
  inviterId: number;
  expiresInDays?: number;
}

export const createInvitationService = async (params: CreateInvitationParams) => {
  const email = params.email.trim().toLowerCase();
  const role = params.role || 'MEMBER';
  const expiresInDays = params.expiresInDays || 7;

  // 1. 워크스페이스 확인
  const workspace = await globalPrisma.workspace.findUnique({
    where: { id: params.workspaceId },
  });
  if (!workspace) throw new Error('Workspace not found');

  // 2. 해당 이메일의 유저가 이미 가입되어 있는지 확인
  const existingUser = await globalPrisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    // 이미 존재하는 사용자는 즉시 워크스페이스 멤버십 등록
    const membership = await globalPrisma.userWorkspace.upsert({
      where: {
        userId_workspaceId: {
          userId: existingUser.id,
          workspaceId: workspace.id,
        },
      },
      update: { role, status: 'ACTIVE' },
      create: {
        userId: existingUser.id,
        workspaceId: workspace.id,
        role,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: { id: true, email: true, name: true, avatar: true },
        },
      },
    });

    // 테넌트 DB 유저 동기화
    await workspaceManager.syncUserToWorkspace(workspace, existingUser);

    return {
      directJoined: true,
      membership,
      message: `사용자 '${existingUser.name || email}' 님이 워크스페이스에 즉시 등록되었습니다.`,
    };
  }

  // 3. 신규 사용자용 초대 토큰 발급 및 WorkspaceInvitation 저장
  const inviteToken = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const invitation = await globalPrisma.workspaceInvitation.create({
    data: {
      workspaceId: workspace.id,
      email,
      role,
      inviteToken,
      expiresAt,
      inviterId: params.inviterId,
    },
  });

  return {
    directJoined: false,
    inviteToken,
    invitation,
    inviteUrl: `/invite?token=${inviteToken}`,
    message: `초대 링크가 생성되었습니다. (${email})`,
  };
};
