import { describe, it, expect, beforeEach } from 'vitest';
import { ExtensionRegistry } from '@/extensions/ExtensionRegistry';
import type { IExtension } from '@/extensions/types';
import {
  GitProjectActionExtension,
  GitProjectBadgeExtension,
  GitIssueDetailSectionExtension,
} from '@/components/plugins/git/extensions';

describe('🧪 [Extension Architecture] ExtensionRegistry & Extension Points Tests', () => {
  let registry: ExtensionRegistry;

  beforeEach(() => {
    registry = ExtensionRegistry.getInstance();
    registry.clear();
  });

  it('TC-POS-01: 확장 기능이 등록되고 order 순서에 따라 정렬되어 조회되어야 한다', () => {
    const ext1: IExtension = {
      id: 'test.ext.1',
      point: 'project.card.action',
      name: 'Ext 1',
      order: 50,
      render: () => 'Render 1',
    };
    const ext2: IExtension = {
      id: 'test.ext.2',
      point: 'project.card.action',
      name: 'Ext 2',
      order: 10,
      render: () => 'Render 2',
    };

    registry.register(ext1);
    registry.register(ext2);

    const extensions = registry.getExtensions('project.card.action');
    expect(extensions).toHaveLength(2);
    expect(extensions[0].id).toBe('test.ext.2'); // order 10 먼저
    expect(extensions[1].id).toBe('test.ext.1'); // order 50 나중
  });

  it('TC-POS-02: isEnabled 조건부 필터링이 올바르게 동작해야 한다', () => {
    const conditionalExt: IExtension<{ role: string }> = {
      id: 'admin.only.action',
      point: 'project.card.action',
      name: 'Admin Only Action',
      isEnabled: (ctx) => ctx.role === 'ADMIN',
      render: () => 'Admin Button',
    };

    registry.register(conditionalExt);

    const forMember = registry.getExtensions('project.card.action', { role: 'MEMBER' });
    expect(forMember).toHaveLength(0);

    const forAdmin = registry.getExtensions('project.card.action', { role: 'ADMIN' });
    expect(forAdmin).toHaveLength(1);
    expect(forAdmin[0].id).toBe('admin.only.action');
  });

  it('TC-POS-03: unregister 호출 시 확장이 목록에서 제거되어야 한다', () => {
    const ext: IExtension = {
      id: 'temp.ext',
      point: 'project.card.badge',
      name: 'Temp Badge',
      render: () => 'Badge',
    };

    registry.register(ext);
    expect(registry.getExtensions('project.card.badge')).toHaveLength(1);

    registry.unregister('temp.ext');
    expect(registry.getExtensions('project.card.badge')).toHaveLength(0);
  });

  it('TC-POS-04: Git Plugin Extension 클래스 인스턴스가 올바른 확장 포인트를 선언해야 한다', () => {
    const projectAction = new GitProjectActionExtension();
    const projectBadge = new GitProjectBadgeExtension();
    const issueSection = new GitIssueDetailSectionExtension();

    expect(projectAction.point).toBe('project.card.action');
    expect(projectBadge.point).toBe('project.card.badge');
    expect(issueSection.point).toBe('issue.detail.section');

    registry.register(projectAction);
    registry.register(projectBadge);
    registry.register(issueSection);

    expect(registry.getExtensions('project.card.action')).toHaveLength(1);
    expect(registry.getExtensions('project.card.badge')).toHaveLength(1);
    expect(registry.getExtensions('issue.detail.section')).toHaveLength(1);
  });
});
