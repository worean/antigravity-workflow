import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '#lib/prisma.js';
import { createMemoService } from '../modules/memos/services/createMemo.service.js';
import { getMemosService } from '../modules/memos/services/getMemos.service.js';
import { getMemoService } from '../modules/memos/services/getMemo.service.js';
import { getMemoByTitleService } from '../modules/memos/services/getMemoByTitle.service.js';
import { updateMemoService } from '../modules/memos/services/updateMemo.service.js';
import { deleteMemoService } from '../modules/memos/services/deleteMemo.service.js';
import { uploadMemoAttachmentService } from '../modules/memos/services/uploadMemoAttachment.service.js';

describe('Shared Memos Service Unit Tests', () => {
  let user1Id: number;
  let user2Id: number;

  beforeAll(async () => {
    // 테스트용 유저 2명 확보
    let u1 = await prisma.user.findFirst({ where: { email: 'memo_test_user1@example.com' } });
    if (!u1) {
      u1 = await prisma.user.create({
        data: {
          email: 'memo_test_user1@example.com',
          name: '메모테스터1',
          role: 'MEMBER',
        },
      });
    }
    user1Id = u1.id;

    let u2 = await prisma.user.findFirst({ where: { email: 'memo_test_user2@example.com' } });
    if (!u2) {
      u2 = await prisma.user.create({
        data: {
          email: 'memo_test_user2@example.com',
          name: '메모테스터2',
          role: 'MEMBER',
        },
      });
    }
    user2Id = u2.id;
  });

  it('TC-1: 새 공개 메모를 성공적으로 생성한다', async () => {
    const memo = await createMemoService(
      {
        title: `공개테스트메모_${Date.now()}`,
        content: '# 공유 메모 본문\n- 팀원 누구나 열람 가능',
        isPublic: true,
        workspaceId: 1,
      },
      user1Id
    );

    expect(memo.id).toBeDefined();
    expect(memo.isPublic).toBe(true);
    expect(memo.authorId).toBe(user1Id);
    expect(memo.author).toBeDefined();
  });

  it('TC-2: 제목이 누락된 경우 400 에러를 던진다', async () => {
    await expect(
      createMemoService(
        { title: '', content: '내용만 있음' },
        user1Id
      )
    ).rejects.toThrow('메모 제목은 필수입니다.');
  });

  it('TC-3: 비공개 메모는 작성자 본인에게만 조회되고 타인에게는 목록에서 제외된다', async () => {
    const privateTitle = `비공개메모_${Date.now()}`;
    const privateMemo = await createMemoService(
      {
        title: privateTitle,
        content: '작성자1만 볼 수 있는 비밀 메모',
        isPublic: false,
        workspaceId: 1,
      },
      user1Id
    );

    // user1 조회: 포함되어야 함
    const user1Memos = await getMemosService(user1Id, { search: privateTitle });
    expect(user1Memos.some((m: any) => m.id === privateMemo.id)).toBe(true);

    // user2 조회: 포함되지 않아야 함
    const user2Memos = await getMemosService(user2Id, { search: privateTitle });
    expect(user2Memos.some((m: any) => m.id === privateMemo.id)).toBe(false);

    // user2가 단건 직접 조회 시도: 403 Forbidden 에러
    await expect(
      getMemoService(privateMemo.id, user2Id, 1)
    ).rejects.toThrow('비공개 메모에 접근할 권한이 없습니다.');
  });

  it('TC-4: "@" 멘션용 제목 기반 단건 조회가 정상 동작한다', async () => {
    const mentionTitle = `멘션대상_${Date.now()}`;
    await createMemoService(
      {
        title: mentionTitle,
        content: '멘션 링크 타겟 메모 본문',
        isPublic: true,
        workspaceId: 1,
      },
      user1Id
    );

    const found = await getMemoByTitleService(mentionTitle, user2Id, 1);
    expect(found.title).toBe(mentionTitle);
  });

  it('TC-5: 타인의 메모를 수정하려고 하면 403 에러가 발생한다', async () => {
    const memo = await createMemoService(
      { title: `수정테스트_${Date.now()}`, content: '원문', isPublic: true },
      user1Id
    );

    await expect(
      updateMemoService(memo.id, user2Id, { title: '변조 시도' }, 1)
    ).rejects.toThrow('메모를 수정할 권한이 없습니다.');
  });

  it('TC-6: 첨부파일 용량이 5MB를 초과하면 400 에러(FILE_TOO_LARGE)가 발생한다', async () => {
    const memo = await createMemoService(
      { title: `첨부용량테스트_${Date.now()}`, content: '첨부파일 테스트' },
      user1Id
    );

    // 5.1MB = 5.1 * 1024 * 1024 = 5,347,737 bytes
    const oversized = 5.1 * 1024 * 1024;
    await expect(
      uploadMemoAttachmentService(
        memo.id,
        user1Id,
        {
          fileName: 'oversized_file.zip',
          fileSize: oversized,
          fileUrl: 'https://storage.example.com/oversized.zip',
        },
        1
      )
    ).rejects.toThrow('첨부파일 크기는 최대 5MB(5,242,880 bytes)를 초과할 수 없습니다.');

    // 2MB 정상 첨부파일 등록 성공
    const normalSize = 2 * 1024 * 1024;
    const attachment = await uploadMemoAttachmentService(
      memo.id,
      user1Id,
      {
        fileName: 'normal_file.pdf',
        fileSize: normalSize,
        fileUrl: 'https://storage.example.com/normal.pdf',
        fileType: 'application/pdf',
      },
      1
    );

    expect(attachment.id).toBeDefined();
    expect(attachment.fileSize).toBe(normalSize);
  });

  it('TC-7: 메모 삭제 시 정상 삭제되며, 타인은 삭제할 수 없다', async () => {
    const memo = await createMemoService(
      { title: `삭제테스트_${Date.now()}` },
      user1Id
    );

    // 타인 삭제 시도 403 차단
    await expect(
      deleteMemoService(memo.id, user2Id, 1)
    ).rejects.toThrow('메모를 삭제할 권한이 없습니다.');

    // 본인 정상 삭제
    const result = await deleteMemoService(memo.id, user1Id, 1);
    expect(result.success).toBe(true);
  });
});
