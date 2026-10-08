import { describe, it, expect, beforeEach } from 'vitest';
import { createUserService } from '../modules/users/services/createUser.service.js';
import { getChannelsService } from '../modules/chat/services/getChannels.service.js';
import { markAllAsReadService } from '../modules/chat/services/markAllAsRead.service.js';
import { sendMessageService } from '../modules/chat/services/sendMessage.service.js';

describe('💬 [Chat: markAllAsRead] Unit Tests', () => {
  let user1: any;
  let user2: any;

  beforeEach(async () => {
    const rand = Math.random().toString(36).substring(2, 9) + Date.now();
    user1 = await createUserService({
      email: 'chat_read_u1_' + rand + '@test.com',
      name: 'Read Tester 1',
      password: 'password123',
    });

    user2 = await createUserService({
      email: 'chat_read_u2_' + rand + '@test.com',
      name: 'Read Tester 2',
      password: 'password123',
    });
  });

  it('1. User ID가 누락되면 에러가 발생해야 합니다.', async () => {
    await expect(markAllAsReadService(0 as any)).rejects.toThrow('User ID is required');
  });

  it('2. 메시지가 존재할 때 markAllAsReadService를 실행하면 모든 채널의 읽음 시간이 최신화되어 unreadCount가 0이 되어야 합니다.', async () => {
    const channels = await getChannelsService(user1.id);
    const noticeChannel = channels.find((c) => c.name.includes('전체-공지사항'));
    expect(noticeChannel).toBeDefined();

    // user2가 채널에 메시지 전송
    await sendMessageService({
      channelId: noticeChannel!.id,
      senderId: user2.id,
      content: '테스트 공지 메시지입니다.',
    });

    // user1의 unreadCount 확인 (1 이상이어야 함)
    const channelsBefore = await getChannelsService(user1.id);
    const noticeBefore = channelsBefore.find((c) => c.id === noticeChannel!.id);
    expect(noticeBefore?.unreadCount).toBeGreaterThanOrEqual(1);

    // markAllAsRead 실행
    const res = await markAllAsReadService(user1.id);
    expect(res.success).toBe(true);
    expect(res.updatedCount).toBeGreaterThanOrEqual(1);

    // 다시 조회 시 unreadCount가 0이어야 함
    const channelsAfter = await getChannelsService(user1.id);
    const noticeAfter = channelsAfter.find((c) => c.id === noticeChannel!.id);
    expect(noticeAfter?.unreadCount).toBe(0);
  });
});
