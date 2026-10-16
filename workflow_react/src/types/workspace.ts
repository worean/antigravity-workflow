export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';

export interface Workspace {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  ownerId: number;
  dbType?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  myRole?: WorkspaceRole;
  memberCount?: number;
  joinedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: number;
  userId: number;
  role: WorkspaceRole;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  joinedAt: string;
  user: {
    id: number;
    email: string;
    name?: string | null;
    avatar?: string | null;
    role?: string;
  };
}

export interface WorkspaceDetail extends Workspace {
  owner: {
    id: number;
    email: string;
    name?: string | null;
    avatar?: string | null;
  };
  members: WorkspaceMember[];
}
