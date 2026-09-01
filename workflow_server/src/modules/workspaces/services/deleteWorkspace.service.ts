import fs from 'fs';
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

  // 1. Connection Pool 캐시 정리
  await workspaceManager.closeClient(workspaceId);

  // 2. Global DB 레코드 삭제 (Cascade로 UserWorkspace도 삭제됨)
  await globalPrisma.workspace.delete({ where: { id: workspaceId } });

  // 3. SQLite 파일 삭제 (선택적)
  if (workspace.dbUrl.startsWith('file:')) {
    const filePath = workspace.dbUrl.replace(/^file:/, '');
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        // 안전 무시
      }
    }
  }

  return { success: true, message: 'Workspace and database successfully deleted' };
};
