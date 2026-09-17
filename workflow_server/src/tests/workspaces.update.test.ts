﻿﻿import { describe, it, expect, beforeEach } from 'vitest';
import { globalPrisma } from '#lib/globalPrisma.js';
import { updateWorkspaceService } from '../modules/workspaces/services/updateWorkspace.service.js';
import { getWorkspaceDetailService } from '../modules/workspaces/services/getWorkspaceDetail.service.js';

describe('Workspaces: Name & PNG Icon Crop Symbol Unit Tests', () => {
  let testWorkspace: any;
  const samplePngDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAPUlEQVR42u3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwZcAAAQAB9iVfAAAAAElFTkSuQmCC';

  beforeEach(async () => {
    const rand = Math.random().toString(36).substring(2, 8) + Date.now();
    // 테스트용 워크스페이스 생성
    testWorkspace = await globalPrisma.workspace.create({
      data: {
        name: `Original WS ${rand}`,
        slug: `ws-${rand}`,
        dbType: 'postgresql',
        dbUrl: 'postgresql://localhost:5432/test',
        ownerId: 1,
        status: 'ACTIVE',
        icon: '🏢',
      },
    });
  });

  it('1. 최고 권한자(ADMIN)가 워크스페이스 이름을 원하는대로 수정할 수 있어야 한다', async () => {
    const updatedName = '새로운 혁신 워크스페이스 (Admin Customized)';
    const result = await updateWorkspaceService(testWorkspace.id, {
      name: updatedName,
    });

    expect(result.name).toBe(updatedName);

    // DB 조회 검증
    const detail = await getWorkspaceDetailService(testWorkspace.id);
    expect(detail.name).toBe(updatedName);
  });

  it('2. 크롭된 256x256 PNG Data URL을 워크스페이스 심볼 Icon으로 저장할 수 있어야 한다', async () => {
    const result = await updateWorkspaceService(testWorkspace.id, {
      icon: samplePngDataUrl,
    });

    expect(result.icon).toBe(samplePngDataUrl);

    // DB 조회 검증
    const detail = await getWorkspaceDetailService(testWorkspace.id);
    expect(detail.icon).toBe(samplePngDataUrl);
    expect(detail.icon?.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('3. PNG 심볼을 다시 기본 이모지로 변경할 수 있어야 한다', async () => {
    // 먼저 PNG 심볼 등록
    await updateWorkspaceService(testWorkspace.id, {
      icon: samplePngDataUrl,
    });

    // 이모지로 변경
    const updated = await updateWorkspaceService(testWorkspace.id, {
      icon: '🚀',
    });

    expect(updated.icon).toBe('🚀');
    const detail = await getWorkspaceDetailService(testWorkspace.id);
    expect(detail.icon).toBe('🚀');
  });

  it('4. 워크스페이스 이름과 심볼을 동시에 수정할 수 있어야 한다', async () => {
    const newName = '넥스트젠 코어 시스템';
    const updated = await updateWorkspaceService(testWorkspace.id, {
      name: newName,
      description: '차세대 워크플로우를 위한 메인 공간',
      icon: samplePngDataUrl,
    });

    expect(updated.name).toBe(newName);
    expect(updated.description).toBe('차세대 워크플로우를 위한 메인 공간');
    expect(updated.icon).toBe(samplePngDataUrl);
  });

  it('5. 유효하지 않은 워크스페이스 ID인 경우 예외를 발생시켜야 한다', async () => {
    await expect(
      updateWorkspaceService(0, { name: 'Invalid' })
    ).rejects.toThrow();
  });
});
