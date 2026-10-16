import { globalPrisma } from '#lib/globalPrisma.js';
import { workspaceManager } from '#lib/workspaceManager.js';

export const deleteWorkspaceService = async (workspaceId: number) => {
  if (!workspaceId) {
    throw new Error('Workspace ID is required');
  }

  const workspace = await globalPrisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) {
    throw new Error('Workspace not found');
  }

  // 단일 워크스페이스 서버 정책: 마지막 남은 유일한 활성 워크스페이스는 삭제 불가
  if (workspace.status === 'ACTIVE') {
    const activeCount = await globalPrisma.workspace.count({
      where: { status: 'ACTIVE' },
    });
    if (activeCount <= 1) {
      throw new Error('Cannot delete the only active workspace in single-workspace mode');
    }
  }

  // 1. Connection Pool 캐시 정리
  await workspaceManager.closeClient(workspaceId);

  // 2. Global DB 레코드 삭제 (Cascade로 UserWorkspace도 삭제됨)
  await globalPrisma.workspace.delete({ where: { id: workspaceId } });

  return { success: true, message: 'Workspace successfully deleted' };
};
