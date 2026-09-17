import { prisma } from './prisma.js';
import { seedDatabase } from './seed.js';

export async function cleanAllExceptAdmin() {
  console.log('🧹 [DB Cleanup] Starting database purge (preserving only admin and system metadata)...');

  // 1. 이슈 및 댓글 관련 종속 데이터 삭제
  await prisma.commentReaction.deleteMany({});
  await prisma.commentMention.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.linkPreview.deleteMany({});
  await prisma.issueLike.deleteMany({});
  await prisma.issueLink.deleteMany({});
  await prisma.issueWatcher.deleteMany({});
  await prisma.issueHistory.deleteMany({});
  await prisma.issueRevision.deleteMany({});
  await prisma.worklog.deleteMany({});
  await prisma.reminder.deleteMany({});
  await prisma.issueCalendarLink.deleteMany({});

  // 2. QA/테스트 관리 데이터 삭제
  await prisma.testResult.deleteMany({});
  await prisma.testRunTestCase.deleteMany({});
  await prisma.testRunTestSuite.deleteMany({});
  await prisma.testStep.deleteMany({});
  await prisma.testRun.deleteMany({});
  await prisma.testCase.deleteMany({});
  await prisma.testSuite.deleteMany({});

  // 3. 이슈, 스프린트, 마일스톤, 커스텀 필드, 프로젝트 멤버 및 프로젝트 삭제
  await prisma.issue.deleteMany({});
  await prisma.sprint.deleteMany({});
  await prisma.milestone.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.customFieldDefinition.deleteMany({});
  await prisma.project.deleteMany({});

  // 4. 조직도 및 그룹 데이터 삭제
  await prisma.groupMember.deleteMany({});
  await prisma.group.deleteMany({});

  // 5. 알림 및 활동 로그 삭제
  await prisma.notification.deleteMany({});
  await prisma.activityLog.deleteMany({});

  // 6. admin (worean@naver.com) 을 제외한 모든 소셜 연동 계정 및 유저 삭제
  await prisma.socialAccount.deleteMany({
    where: {
      user: {
        email: { not: 'worean@naver.com' }
      }
    }
  });

  const deletedUsers = await prisma.user.deleteMany({
    where: {
      email: { not: 'worean@naver.com' }
    }
  });

  console.log(`🗑️ Removed ${deletedUsers.count} non-admin user(s).`);

  // 7. 어드민 계정 (worean@naver.com) 단독 보장 및 생성
  const adminUser = await prisma.user.upsert({
    where: { email: 'worean@naver.com' },
    update: {
      name: '시스템 최고 관리자',
      role: 'ADMIN',
    },
    create: {
      email: 'worean@naver.com',
      name: '시스템 최고 관리자',
      role: 'ADMIN',
    },
  });

  console.log(`👑 Admin Account Ready: ${adminUser.email} (ID: ${adminUser.id}, Role: ${adminUser.role})`);

  // 8. 기본 시스템 메타데이터 시드 확인 및 복구
  await seedDatabase();

  console.log('✨ [DB Cleanup Finished] All issues, comments, likes, groups, and non-admin users purged cleanly!');
}

if (process.argv[1] && process.argv[1].endsWith('cleanData.ts')) {
  cleanAllExceptAdmin()
    .then(() => {
      console.log('✅ Purge completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Purge Failed:', err);
      process.exit(1);
    });
}
