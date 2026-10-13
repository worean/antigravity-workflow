import { describe, it, expect, beforeEach } from 'vitest';
import { globalPrisma } from '#lib/globalPrisma.js';
import { createUserService } from '../modules/users/services/createUser.service.js';
import { createChannelService } from '../modules/chat/services/createChannel.service.js';
import { sendMessageService } from '../modules/chat/services/sendMessage.service.js';
import { getMessagesService } from '../modules/chat/services/getMessages.service.js';

describe('💬 [Chat: sendMessage & Smart Throttler] Unit Tests', () => {
  let user1: any;
  let user2: any;
  let channel: any;

  beforeEach(async () => {
    const rand = Math.random().toString(36).substring(2, 9) + Date.now();
    user1 = await createUserService({
      email: 'send_user1_' + rand + '@test.com',
      name: 'Alice',
      password: 'password123',
    });

    user2 = await createUserService({
      email: 'send_user2_' + rand + '@test.com',
      name: 'Bob',
      password: 'password123',
    });

    channel = await createChannelService({
      name: '테스트 대화방',
      type: 'GENERAL',
      userId: user1.id,
    });

    // user2도 채널 멤버로 등록
    await globalPrisma.chatMember.create({
      data: {
        channelId: channel.id,
        userId: user2.id,
        role: 'MEMBER',
      },
    });
  });

  it('1. 일반 메시지 전송 및 조회가 성공해야 합니다.', async () => {
    const msg = await sendMessageService({
      channelId: channel.id,
      senderId: user1.id,
      content: '안녕하세요! 첫 메시지입니다.',
    });

    expect(msg.content).toBe('안녕하세요! 첫 메시지입니다.');
    expect(msg.hasMention).toBe(false);

    const history = await getMessagesService(channel.id, user1.id, {});
    expect(history.messages.length).toBe(1);
    expect(history.messages[0].content).toBe('안녕하세요! 첫 메시지입니다.');
  });

  it('2. @멘션이 포함된 경우 hasMention이 true로 설정되고 멘션 유저가 식별되어야 합니다.', async () => {
    const msg = await sendMessageService({
      channelId: channel.id,
      senderId: user1.id,
      content: '반갑습니다 @Bob 님!',
    });

    expect(msg.hasMention).toBe(true);
    expect(msg.mentions).toContain(user2.id);
  });

  it('3. 첨부파일(이미지/문서)과 함께 메시지 전송 시 attachments가 정상적으로 저장되어야 합니다.', async () => {
    const attachments = [
      {
        fileName: 'screenshot.png',
        fileSize: 102400,
        fileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        fileType: 'image/png',
      },
    ];

    const msg = await sendMessageService({
      channelId: channel.id,
      senderId: user1.id,
      content: '스크린샷 첨부합니다.',
      attachments,
    });

    expect(msg.content).toBe('스크린샷 첨부합니다.');
    expect(msg.attachments).toBeDefined();

    const history = await getMessagesService(channel.id, user1.id, {});
    const savedMsg = history.messages.find((m: any) => m.id === msg.id);
    expect(savedMsg).toBeDefined();
    const parsedAtts = typeof savedMsg.attachments === 'string' ? JSON.parse(savedMsg.attachments) : savedMsg.attachments;
    expect(parsedAtts.length).toBe(1);
    expect(parsedAtts[0].fileName).toBe('screenshot.png');
  });

  it('4. 텍스트 내용 없이 첨부파일만 전송하는 경우에도 정상적으로 메시지가 생성되어야 합니다.', async () => {
    const attachments = [
      {
        fileName: 'document.pdf',
        fileSize: 204800,
        fileUrl: 'data:application/pdf;base64,JVBERi0xLjQK...',
        fileType: 'application/pdf',
      },
    ];

    const msg = await sendMessageService({
      channelId: channel.id,
      senderId: user1.id,
      content: '',
      attachments,
    });

    expect(msg.content).toBe('');
    expect(msg.attachments).toBeDefined();
  });

  it('5. 텍스트와 첨부파일이 모두 없는 경우 에러를 반환해야 합니다.', async () => {
    await expect(
      sendMessageService({
        channelId: channel.id,
        senderId: user1.id,
        content: '',
        attachments: [],
      })
    ).rejects.toThrow('Channel ID, Sender ID, and Content or Attachments are required');
  });
});
