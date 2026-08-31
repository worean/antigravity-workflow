// -*- coding: utf-8 -*-
import path from 'path';
import { globalPrisma } from '#lib/globalPrisma.js';
import { workspaceManager } from '#lib/workspaceManager.js';

export interface CreateWorkspaceParams {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  dbType?: string;
  customDbUrl?: string;
}

export const createWorkspaceService = async (ownerUser: { id: number; email: string; name?: string | null; role?: string }, params: CreateWorkspaceParams) => {
  if (!params.name || !params.name.trim()) {
    throw new Error('Workspace name is required');
  }

  // 1. Slug 생성 및 고유성 검증
  let slug = (params.slug || params.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) || 'workspace';
  const existing = await globalPrisma.workspace.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  // 2. 워크스페이스 전용 Database URL 생성
  const dbType = params.dbType || 'sqlite';
  let dbUrl = params.customDbUrl;

  if (!dbUrl) {
    const fileName = `ws_${slug}_${Date.now()}.db`;
    const fullPath = path.resolve(process.cwd(), '.tmp/workspaces', fileName).replace(/\\/g, '/');
    dbUrl = `file:${fullPath}`;
  }

  // 3. Global DB에 Workspace 및 UserWorkspace(OWNER) 등록
  const workspace = await globalPrisma.workspace.create({
    data: {
      slug,
      name: params.name.trim(),
      description: params.description?.trim(),
      icon: params.icon,
      ownerId: ownerUser.id,
      dbType,
      dbUrl,
      status: 'ACTIVE',
      members: {
        create: {
          userId: ownerUser.id,
          role: 'OWNER',
          status: 'ACTIVE',
        },
      },
    },
  });

  // 4. 물리적 테넌트 데이터베이스 프로비저닝 및 기본 메타데이터/소유자 시딩
  await workspaceManager.provisionWorkspaceDb(
    {
      id: workspace.id,
      slug: workspace.slug,
      dbUrl: workspace.dbUrl,
      dbType: workspace.dbType,
    },
    {
      id: ownerUser.id,
      email: ownerUser.email,
      name: ownerUser.name,
      role: ownerUser.role,
    }
  );

  return workspace;
};
