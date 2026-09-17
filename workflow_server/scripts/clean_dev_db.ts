import { globalPrisma } from '../src/lib/globalPrisma.js';
import { prisma } from '../src/lib/prisma.js';
import { workspaceManager } from '../src/lib/workspaceManager.js';

const SEED_PROJECT_IDS = [73, 74, 75];
const ADMIN_EMAIL = 'worean@naver.com';

export async function cleanDevDatabase() {
  console.log('🧹 [Database Cleanup] Starting deep purge of test artifacts from Dev Databases...');

  // ==========================================
  // 1. 워크스페이스 DB (workspace) 청소
  // ==========================================
  console.log('\n--- 1. Purging Workspace DB Test Data ---');

  // 1-1. 유지할 프로젝트(73, 74, 75)에 속하지 않는 모든 이슈 삭제 및 종속 데이터 삭제
  const targetIssues = await prisma.issue.findMany({
    where: { projectId: { notIn: SEED_PROJECT_IDS } },
    select: { id: true },
  });
  const targetIssueIds = targetIssues.map((i) => i.id);
  console.log(`Found ${targetIssueIds.length} test issue(s) to remove.`);

  if (targetIssueIds.length > 0) {
    await prisma.commentReaction.deleteMany({ where: { comment: { issueId: { in: targetIssueIds } } } });
    await prisma.commentMention.deleteMany({ where: { comment: { issueId: { in: targetIssueIds } } } });
    await prisma.comment.deleteMany({ where: { issueId: { in: targetIssueIds } } });
    await prisma.attachment.deleteMany({ where: { issueId: { in: targetIssueIds } } });
    await prisma.linkPreview.deleteMany({});
    await prisma.issueLike.deleteMany({ where: { issueId: { in: targetIssueIds } } });
    await prisma.issueLink.deleteMany({
      where: { OR: [{ sourceIssueId: { in: targetIssueIds } }, { targetIssueId: { in: targetIssueIds } }] },
    });
    await prisma.issueWatcher.deleteMany({ where: { issueId: { in: targetIssueIds } } });
    await prisma.issueHistory.deleteMany({ where: { issueId: { in: targetIssueIds } } });
    await prisma.issueRevision.deleteMany({ where: { issueId: { in: targetIssueIds } } });
    await prisma.worklog.deleteMany({ where: { issueId: { in: targetIssueIds } } });
    await prisma.reminder.deleteMany({ where: { issueId: { in: targetIssueIds } } });
    await prisma.issueCalendarLink.deleteMany({ where: { issueId: { in: targetIssueIds } } });

    // QA/테스트 결과 데이터 삭제
    await prisma.testResult.deleteMany({});
    await prisma.testRunTestCase.deleteMany({});
    await prisma.testRunTestSuite.deleteMany({});
    await prisma.testStep.deleteMany({});
    await prisma.testRun.deleteMany({});
    await prisma.testCase.deleteMany({});
    await prisma.testSuite.deleteMany({});

    const deletedIssues = await prisma.issue.deleteMany({
      where: { id: { in: targetIssueIds } },
    });
    console.log(`🗑️ Deleted ${deletedIssues.count} test issues.`);
  }

  // 1-2. 유지할 프로젝트(73, 74, 75)에 속하지 않는 스프린트, 마일스톤 삭제
  const deletedSprints = await prisma.sprint.deleteMany({
    where: { projectId: { notIn: SEED_PROJECT_IDS } },
  });
  console.log(`🗑️ Deleted ${deletedSprints.count} test sprints.`);

  const deletedMilestones = await prisma.milestone.deleteMany({
    where: { projectId: { notIn: SEED_PROJECT_IDS } },
  });
  console.log(`🗑️ Deleted ${deletedMilestones.count} test milestones.`);

  // 1-3. 유지할 프로젝트(73, 74, 75)에 속하지 않는 프로젝트 멤버 및 프로젝트 삭제
  await prisma.projectMember.deleteMany({
    where: { projectId: { notIn: SEED_PROJECT_IDS } },
  });
  await prisma.customFieldDefinition.deleteMany({
    where: { projectId: { notIn: SEED_PROJECT_IDS } },
  });
  const deletedProjects = await prisma.project.deleteMany({
    where: { id: { notIn: SEED_PROJECT_IDS } },
  });
  console.log(`🗑️ Deleted ${deletedProjects.count} test projects.`);

  // 1-4. 조직도, 그룹, 알림, 활동 로그 정리
  await prisma.groupMember.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.activityLog.deleteMany({});
  console.log('🗑️ Cleared groups, notifications, and activity logs.');

  // ==========================================
  // 2. 글로벌 DB (global) 청소
  // ==========================================
  console.log('\n--- 2. Purging Global DB Test Data ---');

  // 2-1. 어드민 유저 ID 확보
  const adminUser = await globalPrisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (!adminUser) {
    throw new Error(`Admin user (${ADMIN_EMAIL}) not found in Global DB!`);
  }
  const adminId = adminUser.id;
  console.log(`👑 Found Admin User: ${adminUser.email} (ID: ${adminId})`);

  // 2-2. 채팅 관련 데이터 정리
  await globalPrisma.chatMessageReaction.deleteMany({});
  await globalPrisma.chatMessage.deleteMany({});
  await globalPrisma.chatMember.deleteMany({});
  await globalPrisma.chatChannel.deleteMany({});
  console.log('🗑️ Cleared global chat data.');

  // 2-3. 워크스페이스 초대장 정리
  await globalPrisma.workspaceInvitation.deleteMany({});

  // 2-4. 메인 워크스페이스(ID 2 또는 slug 'default-workspace'/'antigravity') 확보 및 나머지 테스트 워크스페이스 삭제
  const mainWorkspace = await globalPrisma.workspace.findFirst({
    where: {
      OR: [
        { id: 2 },
        { slug: 'antigravity' },
        { name: 'AntiGravity' },
        { slug: 'default-workspace' },
      ],
    },
  });

  let mainWsId = mainWorkspace?.id ?? 2;

  // 나머지 워크스페이스 멤버십 및 워크스페이스 삭제
  await globalPrisma.userWorkspace.deleteMany({
    where: { workspaceId: { not: mainWsId } },
  });
  const deletedWs = await globalPrisma.workspace.deleteMany({
    where: { id: { not: mainWsId } },
  });
  console.log(`🗑️ Deleted ${deletedWs.count} test workspaces.`);

  // 메인 워크스페이스 정상화
  await globalPrisma.workspace.update({
    where: { id: mainWsId },
    data: {
      slug: 'antigravity',
      name: 'AntiGravity',
      ownerId: adminId,
      status: 'ACTIVE',
      dbType: 'postgresql',
      dbUrl: 'postgresql://juyeong:qkrwndud@localhost:5432/workspace',
    },
  });
  console.log(`✨ Main Workspace updated: id=${mainWsId}, slug=antigravity, ownerId=${adminId}`);

  // 2-5. 어드민을 제외한 모든 글로벌 유저 삭제
  await globalPrisma.socialAccount.deleteMany({
    where: { userId: { not: adminId } },
  });
  await globalPrisma.userWorkspace.deleteMany({
    where: { userId: { not: adminId } },
  });
  const deletedGlobalUsers = await globalPrisma.user.deleteMany({
    where: { id: { not: adminId } },
  });
  console.log(`🗑️ Deleted ${deletedGlobalUsers.count} test global users.`);

  // 2-6. 어드민의 메인 워크스페이스 멤버십 보장
  await globalPrisma.userWorkspace.upsert({
    where: {
      userId_workspaceId: {
        userId: adminId,
        workspaceId: mainWsId,
      },
    },
    update: { role: 'OWNER', status: 'ACTIVE' },
    create: {
      userId: adminId,
      workspaceId: mainWsId,
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });

  // ==========================================
  // 3. 워크스페이스 DB의 유저 및 프로젝트 소유권 정상화
  // ==========================================
  console.log('\n--- 3. Normalizing Workspace DB Ownership ---');

  // 워크스페이스 DB에서 worean@naver.com 찾기
  const wsAdmin = await prisma.user.findFirst({
    where: { email: ADMIN_EMAIL },
  });

  if (!wsAdmin) {
    throw new Error(`Admin user (${ADMIN_EMAIL}) not found in Workspace DB!`);
  }
  const wsAdminId = wsAdmin.id;
  console.log(`👑 Workspace DB Admin User ID: ${wsAdminId} (${wsAdmin.email})`);

  // 어드민을 제외한 워크스페이스 DB 유저 삭제
  await prisma.socialAccount.deleteMany({
    where: { userId: { not: wsAdminId } },
  });
  const deletedWsUsers = await prisma.user.deleteMany({
    where: { id: { not: wsAdminId } },
  });
  console.log(`🗑️ Deleted ${deletedWsUsers.count} test workspace users.`);

  // 유지할 프로젝트(73, 74, 75)의 소유자를 wsAdminId로 보장하고 멤버 등록
  for (const prjId of SEED_PROJECT_IDS) {
    await prisma.project.update({
      where: { id: prjId },
      data: { ownerId: wsAdminId },
    });

    await prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: prjId,
          userId: wsAdminId,
        },
      },
      update: { role: 'OWNER' },
      create: {
        projectId: prjId,
        userId: wsAdminId,
        role: 'OWNER',
      },
    });
  }
  console.log(`✨ Seed projects (73, 74, 75) ownership verified for Admin (ID: ${wsAdminId}).`);

  // 워크스페이스 기본 메타데이터 보장
  await workspaceManager.seedDefaultMetadata(prisma);

  console.log('\n🎉 [Database Cleanup Finished] Dev Databases are completely cleaned up and restored to pristine state!');
}

cleanDevDatabase()
  .catch((err) => {
    console.error('❌ Cleanup failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await globalPrisma.$disconnect();
    await prisma.$disconnect();
  });
