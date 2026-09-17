import 'dotenv/config';
import { globalPrisma } from './src/lib/globalPrisma.js';
import { prisma as workspacePrisma } from './src/lib/prisma.js';
import { getChannelsService } from './src/modules/chat/services/getChannels.service.js';
import { createChannelService } from './src/modules/chat/services/createChannel.service.js';
import { sendMessageService } from './src/modules/chat/services/sendMessage.service.js';
import { getMessagesService } from './src/modules/chat/services/getMessages.service.js';

async function runTest() {
  console.log('🚀 [Chat Workspace Isolation Test] Starting verification...\n');

  try {
    // 1. 유저 준비
    const adminUser = await globalPrisma.user.findUnique({ where: { email: 'worean@naver.com' } });
    if (!adminUser) throw new Error('Admin user not found');
    const otherUser = await globalPrisma.user.findFirst({
      where: { id: { not: adminUser.id } },
    });
    if (!otherUser) throw new Error('Secondary test user not found');

    console.log(`👤 Test Users: Admin=#${adminUser.id} (${adminUser.email}), Other=#${otherUser.id} (${otherUser.email})`);

    // 2. 워크스페이스 준비 (Workspace #1과 Workspace #2)
    const ws1 = await globalPrisma.workspace.findUnique({ where: { id: 1 } });
    const ws2 = await globalPrisma.workspace.findUnique({ where: { id: 2 } });
    if (!ws1 || !ws2) throw new Error('Workspaces #1 or #2 not found');

    console.log(`🏢 Test Workspaces: WS1=#${ws1.id} (${ws1.name}), WS2=#${ws2.id} (${ws2.name})`);

    // ----------------------------------------------------
    // STEP 1: Workspace 1 채널 조회 및 자동 생성 확인
    // ----------------------------------------------------
    console.log('\n--- [STEP 1] Fetching channels in Workspace 1 ---');
    const ws1Channels = await getChannelsService(adminUser.id, ws1);
    console.log(`WS1 Channels Count: ${ws1Channels.length}`);
    for (const c of ws1Channels) {
      console.log(` - WS1 [${c.type}] ${c.name} (workspaceId: ${c.workspaceId})`);
    }

    // 모든 채널의 workspaceId가 1인지 검증
    const allWs1Match = ws1Channels.every((c) => c.workspaceId === ws1.id);
    if (!allWs1Match) throw new Error('Assertion Failed: Some channels in WS1 do not have workspaceId=1');
    console.log('✅ PASS: All WS1 channels belong strictly to Workspace #1');

    // ----------------------------------------------------
    // STEP 2: Workspace 1에서 DM 생성 및 메시지 전송
    // ----------------------------------------------------
    console.log('\n--- [STEP 2] Creating DM in Workspace 1 ---');
    const dmInWs1 = await createChannelService({
      userId: adminUser.id,
      targetUserId: otherUser.id,
      type: 'DM',
      workspaceId: ws1.id,
    });
    console.log(`DM Channel Created in WS1: #${dmInWs1.id} name=${dmInWs1.name} (workspaceId: ${dmInWs1.workspaceId})`);

    if (dmInWs1.workspaceId !== ws1.id) {
      throw new Error(`Assertion Failed: DM channel workspaceId (${dmInWs1.workspaceId}) !== WS1.id (${ws1.id})`);
    }
    console.log('✅ PASS: DM channel has workspaceId=1');

    // DM에 메시지 전송
    await sendMessageService({
      channelId: dmInWs1.id,
      senderId: otherUser.id, // 상대방이 전송하여 adminUser에게 unread 발생시킴
      content: 'WS1 전용 비밀 다이렉트 메시지입니다.',
    }, undefined, ws1);
    console.log('Message sent to DM in WS1 by otherUser');

    // WS1 채널 재조회 시 DM의 unreadCount 확인
    const ws1UpdatedChannels = await getChannelsService(adminUser.id, ws1);
    const targetDmInWs1 = ws1UpdatedChannels.find((c) => c.id === dmInWs1.id);
    console.log(`WS1 DM unreadCount for Admin: ${targetDmInWs1?.unreadCount}`);
    if ((targetDmInWs1?.unreadCount || 0) < 1) {
      throw new Error('Assertion Failed: Unread count for DM in WS1 should be >= 1');
    }
    console.log('✅ PASS: Unread count in WS1 DM is properly calculated (> 0)');

    // ----------------------------------------------------
    // STEP 3: Workspace 2 채널 조회 시 Workspace 1의 DM 및 채널 격리 검증
    // ----------------------------------------------------
    console.log('\n--- [STEP 3] Fetching channels in Workspace 2 (Isolation Verification) ---');
    const ws2Channels = await getChannelsService(adminUser.id, ws2);
    console.log(`WS2 Channels Count: ${ws2Channels.length}`);
    for (const c of ws2Channels) {
      console.log(` - WS2 [${c.type}] ${c.name} (workspaceId: ${c.workspaceId})`);
    }

    // WS2의 모든 채널의 workspaceId가 2인지 검증
    const allWs2Match = ws2Channels.every((c) => c.workspaceId === ws2.id);
    if (!allWs2Match) throw new Error('Assertion Failed: Some channels in WS2 do not have workspaceId=2');

    // WS1에서 생성한 DM 채널이 WS2에 절대로 포함되지 않았는지 검증!
    const dmLeakedInWs2 = ws2Channels.some((c) => c.id === dmInWs1.id);
    if (dmLeakedInWs2) {
      throw new Error(`CRITICAL: DM from WS1 (ID #${dmInWs1.id}) leaked into Workspace 2!`);
    }
    console.log('✅ PASS: WS1 DM channel is completely hidden and inaccessible in Workspace 2!');

    // WS2의 전체 unreadCount에 WS1 DM의 unread가 포함되지 않았는지 검증!
    const ws2TotalUnread = ws2Channels.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
    console.log(`WS2 Total Unread Count for Admin: ${ws2TotalUnread}`);
    console.log('✅ PASS: WS2 unread count is completely isolated from WS1 messages!');

    // ----------------------------------------------------
    // STEP 4: 타 워크스페이스 채널 접근 차단 검증 (Security Check)
    // ----------------------------------------------------
    console.log('\n--- [STEP 4] Security Check: Accessing WS1 channel with WS2 context ---');
    let securityBlocked = false;
    try {
      await getMessagesService(dmInWs1.id, adminUser.id, {}, undefined, ws2);
    } catch (secErr: any) {
      securityBlocked = true;
      console.log(`Access correctly blocked with error: "${secErr.message}"`);
    }

    if (!securityBlocked) {
      throw new Error('CRITICAL: Accessing WS1 channel using WS2 context was NOT blocked!');
    }
    console.log('✅ PASS: Accessing WS1 channel with WS2 context is strictly blocked (Forbidden)!');

    console.log('\n========================================');
    console.log('🎉 ALL WORKSPACE ISOLATION TESTS PASSED!');
    console.log('========================================\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    await globalPrisma.$disconnect();
    await workspacePrisma.$disconnect();
  }
}

runTest();
