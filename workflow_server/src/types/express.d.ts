import type { User as GlobalUser, Workspace as GlobalWorkspace } from '../generated/global-client/index.js';
import type { PrismaClient as WorkspacePrismaClient } from '../generated/workspace-client/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: GlobalUser;
      workspace?: GlobalWorkspace;
      workspaceDb?: WorkspacePrismaClient;
      workspaceRole?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST' | string;
      projectRole?: string;
    }
  }
}
