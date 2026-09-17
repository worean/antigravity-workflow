import 'dotenv/config';
import { prisma } from './src/lib/prisma.js';
import { globalPrisma } from './src/lib/globalPrisma.js';

async function resetAndSeedExamples() {
  console.log('🚀 [Reset & Seed] Starting database cleanup and example project seeding...\n');

  try {
    // 1. 관리자 유저 식별 (Global DB 및 Workspace DB)
    let adminUser = await globalPrisma.user.findUnique({
      where: { email: 'worean@naver.com' },
    });

    if (!adminUser) {
      adminUser = await globalPrisma.user.create({
        data: {
          email: 'worean@naver.com',
          name: '시스템 최고 관리자',
          role: 'ADMIN',
        },
      });
    }

    // Workspace DB의 User도 보장
    await prisma.user.upsert({
      where: { email: 'worean@naver.com' },
      update: {
        name: '시스템 최고 관리자',
        role: 'ADMIN',
      },
      create: {
        id: adminUser.id,
        email: 'worean@naver.com',
        name: '시스템 최고 관리자',
        role: 'ADMIN',
      },
    });

    const currentAdmin = await prisma.user.findUnique({ where: { email: 'worean@naver.com' } });
    if (!currentAdmin) throw new Error('Admin user in workspace DB not found');
    const adminId = currentAdmin.id;

    console.log(`👤 Admin User verified: ${currentAdmin.email} (ID: ${adminId})`);

    // 2. 기존 프로젝트/이슈 및 모든 연관 종속 데이터 안전 삭제
    console.log('\n🧹 Cleaning up existing projects, issues, and dependent data...');

    await prisma.issueLike.deleteMany({});
    await prisma.issueWatcher.deleteMany({});
    await prisma.issueLink.deleteMany({});
    await prisma.issueRevision.deleteMany({});
    await prisma.issueHistory.deleteMany({});
    await prisma.issueCalendarLink.deleteMany({});
    await prisma.commentMention.deleteMany({});
    await prisma.commentReaction.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.attachment.deleteMany({});
    await prisma.worklog.deleteMany({});
    await prisma.reminder.deleteMany({});
    await prisma.testRun.deleteMany({});
    await prisma.testCase.deleteMany({});
    await prisma.testSuite.deleteMany({});
    await prisma.favorite.deleteMany({});
    await prisma.notification.deleteMany({});

    // 이슈 삭제
    const deletedIssues = await prisma.issue.deleteMany({});
    console.log(` - Deleted Issues: ${deletedIssues.count}`);

    // 스프린트 및 마일스톤 삭제
    await prisma.sprint.deleteMany({});
    await prisma.milestone.deleteMany({});

    // 프로젝트 멤버, 그룹 및 프로젝트 삭제
    await prisma.projectMember.deleteMany({});
    await prisma.projectGroup.deleteMany({});
    await prisma.customFieldDefinition.deleteMany({});

    const deletedProjects = await prisma.project.deleteMany({});
    console.log(` - Deleted Projects: ${deletedProjects.count}`);

    // 태그 정리
    await prisma.tag.deleteMany({});

    console.log('✅ Clean up completed cleanly!\n');

    // 3. 메타데이터 조회 및 캐싱
    const issueTypes = await prisma.issueType.findMany();
    const typeMap = Object.fromEntries(issueTypes.map((t) => [t.name.toUpperCase(), t.id]));

    const issuePriorities = await prisma.issuePriority.findMany();
    const priorityMap = Object.fromEntries(issuePriorities.map((p) => [p.name.toUpperCase(), p.id]));

    const issueStatuses = await prisma.issueStatus.findMany();
    const statusMap = Object.fromEntries(issueStatuses.map((s) => [s.name.toUpperCase(), s.id]));

    const taskTypeId = typeMap['TASK'] || 1;
    const bugTypeId = typeMap['BUG'] || 2;
    const epicTypeId = typeMap['EPIC'] || 3;
    const storyTypeId = typeMap['STORY'] || 4;

    const lowPriorityId = priorityMap['LOW'] || 1;
    const medPriorityId = priorityMap['MEDIUM'] || 2;
    const highPriorityId = priorityMap['HIGH'] || 3;
    const critPriorityId = priorityMap['CRITICAL'] || 4;

    const todoStatusId = statusMap['TODO'] || 1;
    const inProgressStatusId = statusMap['IN_PROGRESS'] || 2;
    const inReviewStatusId = statusMap['IN_REVIEW'] || 3;
    const doneStatusId = statusMap['DONE'] || 4;
    const holdStatusId = statusMap['HOLD'] || 5;

    // 4. 예제 태그 생성
    const tagFrontend = await prisma.tag.create({ data: { name: 'Frontend', color: '#38bdf8' } });
    const tagBackend = await prisma.tag.create({ data: { name: 'Backend', color: '#10b981' } });
    const tagDatabase = await prisma.tag.create({ data: { name: 'Database', color: '#a855f7' } });
    const tagSecurity = await prisma.tag.create({ data: { name: 'Security', color: '#ef4444' } });
    const tagMobile = await prisma.tag.create({ data: { name: 'Mobile', color: '#f59e0b' } });

    // ----------------------------------------------------
    // 5. 예제 프로젝트 1: 안티그래비티 워크플로우 2.0 (차세대 업무 관리 솔루션)
    // ----------------------------------------------------
    console.log('📦 Creating Project 1: AntiGravity Workflow 2.0...');
    const project1 = await prisma.project.create({
      data: {
        name: 'AntiGravity Workflow 2.0',
        key: 'WF2',
        description: 'Linear & Jira 스타일의 고성능 태스크 및 이슈 트래킹 풀스택 웹 애플리케이션 개발',
        ownerId: adminId,
        statusId: 2, // ACTIVE
        priorityId: 3, // HIGH
        plannedStartDate: new Date('2026-09-01T00:00:00.000Z'),
        dueDate: new Date('2026-10-31T23:59:59.000Z'),
        members: {
          create: [{ userId: adminId, role: 'ADMIN' }],
        },
        tags: {
          connect: [{ id: tagFrontend.id }, { id: tagBackend.id }, { id: tagDatabase.id }],
        },
      },
    });

    const sprint1_1 = await prisma.sprint.create({
      data: {
        name: 'Sprint 1: Core Architecture & PostgreSQL',
        goal: 'Zustand 상태 관리 마이그레이션 및 PostgreSQL DB 안정화',
        projectId: project1.id,
        startDate: new Date('2026-09-01T00:00:00.000Z'),
        endDate: new Date('2026-09-14T23:59:59.000Z'),
        status: 'ACTIVE',
      },
    });

    const sprint1_2 = await prisma.sprint.create({
      data: {
        name: 'Sprint 2: Realtime Collab & WBS',
        goal: '실시간 소켓 알림 및 WBS 간트 차트 성능 튜닝',
        projectId: project1.id,
        startDate: new Date('2026-09-15T00:00:00.000Z'),
        endDate: new Date('2026-09-28T23:59:59.000Z'),
        status: 'PLANNED',
      },
    });

    // Project 1 이슈들
    const p1Issues = [
      {
        issueNumber: 1,
        title: 'React + Zustand 기반 클라이언트 전역 상태 관리 마이그레이션',
        description: 'Context API의 과도한 전체 리렌더링 문제를 해결하기 위해 Zustand 스토어(`usePrefStore`, `useUIStore`, `useDraftStore`) 도입 및 Selector 기반 최적화 완료.',
        typeId: epicTypeId,
        priorityId: highPriorityId,
        statusId: doneStatusId,
        progress: 100,
        estimatedHours: 16,
        loggedHours: 16,
        plannedStartDate: new Date('2026-09-01T09:00:00.000Z'),
        dueDate: new Date('2026-09-04T18:00:00.000Z'),
        sprintId: sprint1_1.id,
        tags: [tagFrontend.id],
      },
      {
        issueNumber: 2,
        title: 'PostgreSQL 18 데이터베이스 전환 및 마이그레이션 파이프라인 구축',
        description: 'SQLite 단일 파일 구조에서 멀티 테넌트 PostgreSQL 분리 구조(`global`, `workspace`)로 전환하고 Prisma Client 갱신 및 시딩 파이프라인 구축.',
        typeId: storyTypeId,
        priorityId: critPriorityId,
        statusId: doneStatusId,
        progress: 100,
        estimatedHours: 20,
        loggedHours: 20,
        plannedStartDate: new Date('2026-09-04T09:00:00.000Z'),
        dueDate: new Date('2026-09-07T12:00:00.000Z'),
        sprintId: sprint1_1.id,
        tags: [tagBackend.id, tagDatabase.id],
      },
      {
        issueNumber: 3,
        title: 'WBS 간트 차트 반응형 타임라인 렌더링 최적화',
        description: '대규모 일감 데이터 렌더링 시 가상 스크롤링(Virtual Scrolling) 적용 및 브라우저 성능 최적화.',
        typeId: taskTypeId,
        priorityId: highPriorityId,
        statusId: inProgressStatusId,
        progress: 65,
        estimatedHours: 14,
        loggedHours: 9,
        plannedStartDate: new Date('2026-09-07T09:00:00.000Z'),
        dueDate: new Date('2026-09-11T18:00:00.000Z'),
        sprintId: sprint1_1.id,
        tags: [tagFrontend.id],
      },
      {
        issueNumber: 4,
        title: '실시간 WebSocket 이벤트 기반 협업 알림 토스트 연동',
        description: '타 사용자가 이슈 상태나 담당자를 변경했을 때 상단 데스크톱 알림 및 토스트를 실시간으로 브로드캐스팅.',
        typeId: taskTypeId,
        priorityId: medPriorityId,
        statusId: inProgressStatusId,
        progress: 40,
        estimatedHours: 10,
        loggedHours: 4,
        plannedStartDate: new Date('2026-09-08T09:00:00.000Z'),
        dueDate: new Date('2026-09-12T18:00:00.000Z'),
        sprintId: sprint1_1.id,
        tags: [tagFrontend.id, tagBackend.id],
      },
      {
        issueNumber: 5,
        title: '다크 테마 전환 시 모달 테두리 대비비(Contrast) 개선',
        description: 'WCAG 2.1 접근성 가이드라인에 맞춰 어두운 배경에서 보더와 텍스트 시인성 향상.',
        typeId: bugTypeId,
        priorityId: lowPriorityId,
        statusId: todoStatusId,
        progress: 0,
        estimatedHours: 4,
        loggedHours: 0,
        plannedStartDate: new Date('2026-09-14T09:00:00.000Z'),
        dueDate: new Date('2026-09-16T18:00:00.000Z'),
        sprintId: sprint1_2.id,
        tags: [tagFrontend.id],
      },
      {
        issueNumber: 6,
        title: '칸반 보드 드래그 앤 드롭 카드 이동 인터랙션 구현',
        description: 'HTML5 Drag and Drop API 또는 dnd-kit을 활용한 직관적인 상태 전이 UX 제공.',
        typeId: taskTypeId,
        priorityId: medPriorityId,
        statusId: todoStatusId,
        progress: 0,
        estimatedHours: 12,
        loggedHours: 0,
        plannedStartDate: new Date('2026-09-15T09:00:00.000Z'),
        dueDate: new Date('2026-09-20T18:00:00.000Z'),
        sprintId: sprint1_2.id,
        tags: [tagFrontend.id],
      },
    ];

    for (const item of p1Issues) {
      const { tags, ...data } = item;
      await prisma.issue.create({
        data: {
          ...data,
          projectId: project1.id,
          authorId: adminId,
          assigneeId: adminId,
          tags: { connect: tags.map((tId) => ({ id: tId })) },
        },
      });
    }

    // ----------------------------------------------------
    // 6. 예제 프로젝트 2: 글로벌 스마트 커머스 플랫폼 고도화
    // ----------------------------------------------------
    console.log('📦 Creating Project 2: Global Smart Commerce Platform...');
    const project2 = await prisma.project.create({
      data: {
        name: '글로벌 스마트 커머스 플랫폼 고도화',
        key: 'SHOP',
        description: '대규모 트래픽 처리와 개인화 추천 AI를 결합한 글로벌 이커머스 서비스',
        ownerId: adminId,
        statusId: 2, // ACTIVE
        priorityId: 2, // MEDIUM
        plannedStartDate: new Date('2026-09-15T00:00:00.000Z'),
        dueDate: new Date('2026-12-31T23:59:59.000Z'),
        members: {
          create: [{ userId: adminId, role: 'ADMIN' }],
        },
        tags: {
          connect: [{ id: tagBackend.id }, { id: tagSecurity.id }],
        },
      },
    });

    const sprint2_1 = await prisma.sprint.create({
      data: {
        name: 'Sprint 1: 결제 & 장바구니 파이프라인',
        goal: '결제 게이트웨이 연동 및 장바구니 안정성 확보',
        projectId: project2.id,
        startDate: new Date('2026-09-15T00:00:00.000Z'),
        endDate: new Date('2026-09-30T23:59:59.000Z'),
        status: 'ACTIVE',
      },
    });

    const p2Issues = [
      {
        issueNumber: 1,
        title: '간편 결제(PG사 및 간편결제 연동) 모듈 개발',
        description: 'Stripe, 네이버페이, 카카오페이 등 글로벌/국내 주요 결제 수단 일원화 결제 API 연동.',
        typeId: storyTypeId,
        priorityId: critPriorityId,
        statusId: inProgressStatusId,
        progress: 55,
        estimatedHours: 32,
        loggedHours: 18,
        plannedStartDate: new Date('2026-09-15T09:00:00.000Z'),
        dueDate: new Date('2026-09-22T18:00:00.000Z'),
        sprintId: sprint2_1.id,
        tags: [tagBackend.id, tagSecurity.id],
      },
      {
        issueNumber: 2,
        title: '장바구니 담기 성능 최적화 및 Redis 캐싱 전략 수립',
        description: '동시 접속자 폭증 시 DB 부하를 완화하기 위한 Redis 분산 캐시 레이어 도입.',
        typeId: taskTypeId,
        priorityId: highPriorityId,
        statusId: todoStatusId,
        progress: 0,
        estimatedHours: 16,
        loggedHours: 0,
        plannedStartDate: new Date('2026-09-20T09:00:00.000Z'),
        dueDate: new Date('2026-09-26T18:00:00.000Z'),
        sprintId: sprint2_1.id,
        tags: [tagBackend.id, tagDatabase.id],
      },
      {
        issueNumber: 3,
        title: '모바일 웹 뷰포트에서 결제 금액 폰트 잘림 현상 조치',
        description: 'iPhone SE 등 저해상도 화면에서 할인 적용 총 결제 금액 텍스트가 줄바꿈되는 현상 수정.',
        typeId: bugTypeId,
        priorityId: highPriorityId,
        statusId: inReviewStatusId,
        progress: 90,
        estimatedHours: 6,
        loggedHours: 5,
        plannedStartDate: new Date('2026-09-16T09:00:00.000Z'),
        dueDate: new Date('2026-09-18T18:00:00.000Z'),
        sprintId: sprint2_1.id,
        tags: [tagFrontend.id],
      },
      {
        issueNumber: 4,
        title: '주문 내역 및 배송 상태 실시간 추적 API 연동',
        description: '택배사 OpenAPI 연동을 통한 실시간 배송 현황 조회 및 카카오 알림톡 발송 기능.',
        typeId: taskTypeId,
        priorityId: medPriorityId,
        statusId: todoStatusId,
        progress: 0,
        estimatedHours: 18,
        loggedHours: 0,
        plannedStartDate: new Date('2026-09-23T09:00:00.000Z'),
        dueDate: new Date('2026-09-29T18:00:00.000Z'),
        sprintId: sprint2_1.id,
        tags: [tagBackend.id],
      },
    ];

    for (const item of p2Issues) {
      const { tags, ...data } = item;
      await prisma.issue.create({
        data: {
          ...data,
          projectId: project2.id,
          authorId: adminId,
          assigneeId: adminId,
          tags: { connect: tags.map((tId) => ({ id: tId })) },
        },
      });
    }

    // ----------------------------------------------------
    // 7. 예제 프로젝트 3: 사내 업무용 모바일 메신저 앱
    // ----------------------------------------------------
    console.log('📦 Creating Project 3: Enterprise Mobile Messenger...');
    const project3 = await prisma.project.create({
      data: {
        name: '사내 업무용 모바일 메신저 앱',
        key: 'TALK',
        description: '임직원 소통과 프로젝트 연계를 위한 크로스 플랫폼(React Native) 모바일 메신저',
        ownerId: adminId,
        statusId: 2, // ACTIVE
        priorityId: 3, // HIGH
        plannedStartDate: new Date('2026-08-01T00:00:00.000Z'),
        dueDate: new Date('2026-11-30T23:59:59.000Z'),
        members: {
          create: [{ userId: adminId, role: 'ADMIN' }],
        },
        tags: {
          connect: [{ id: tagMobile.id }, { id: tagSecurity.id }],
        },
      },
    });

    const sprint3_1 = await prisma.sprint.create({
      data: {
        name: 'Sprint 1: 실시간 채팅 엔진 안정화',
        goal: 'E2EE 암호화 및 오프라인 동기화 지원',
        projectId: project3.id,
        startDate: new Date('2026-09-01T00:00:00.000Z'),
        endDate: new Date('2026-09-20T23:59:59.000Z'),
        status: 'ACTIVE',
      },
    });

    const p3Issues = [
      {
        issueNumber: 1,
        title: '종단간 암호화(E2EE) 보안 메시징 프로토콜 적용',
        description: 'Signal 프로토콜 기반의 메시지 기밀성 보장 및 로컬 SQLite DB 암호화(SQLCipher) 적용.',
        typeId: taskTypeId,
        priorityId: critPriorityId,
        statusId: doneStatusId,
        progress: 100,
        estimatedHours: 24,
        loggedHours: 24,
        plannedStartDate: new Date('2026-08-10T09:00:00.000Z'),
        dueDate: new Date('2026-08-20T18:00:00.000Z'),
        sprintId: sprint3_1.id,
        tags: [tagSecurity.id, tagMobile.id],
      },
      {
        issueNumber: 2,
        title: '오프라인 메시지 큐 및 네트워크 재연결 시 자동 동기화',
        description: '네트워크 단절 상태에서 작성된 메시지를 로컬 큐에 저장하고 연결 복구 시 순차 전송.',
        typeId: taskTypeId,
        priorityId: highPriorityId,
        statusId: inProgressStatusId,
        progress: 75,
        estimatedHours: 20,
        loggedHours: 15,
        plannedStartDate: new Date('2026-08-25T09:00:00.000Z'),
        dueDate: new Date('2026-09-10T18:00:00.000Z'),
        sprintId: sprint3_1.id,
        tags: [tagMobile.id],
      },
      {
        issueNumber: 3,
        title: '백그라운드 푸시 알림 수신 시 배지 카운트 불일치 버그 수정',
        description: '앱이 종료된 상태에서 연속 수신된 푸시 알림의 읽지 않은 개수 카운팅 동기화 처리.',
        typeId: bugTypeId,
        priorityId: medPriorityId,
        statusId: todoStatusId,
        progress: 0,
        estimatedHours: 8,
        loggedHours: 0,
        plannedStartDate: new Date('2026-09-08T09:00:00.000Z'),
        dueDate: new Date('2026-09-12T18:00:00.000Z'),
        sprintId: sprint3_1.id,
        tags: [tagMobile.id],
      },
      {
        issueNumber: 4,
        title: '음성 메모 녹음 및 미디어 파일 썸네일 고속 생성',
        description: '채팅방 내 음성 녹음 메시지 전송 및 동영상/이미지 전송 시 클라이언트 측 썸네일 생성 파이프라인.',
        typeId: taskTypeId,
        priorityId: lowPriorityId,
        statusId: todoStatusId,
        progress: 0,
        estimatedHours: 14,
        loggedHours: 0,
        plannedStartDate: new Date('2026-09-12T09:00:00.000Z'),
        dueDate: new Date('2026-09-18T18:00:00.000Z'),
        sprintId: sprint3_1.id,
        tags: [tagMobile.id],
      },
    ];

    for (const item of p3Issues) {
      const { tags, ...data } = item;
      await prisma.issue.create({
        data: {
          ...data,
          projectId: project3.id,
          authorId: adminId,
          assigneeId: adminId,
          tags: { connect: tags.map((tId) => ({ id: tId })) },
        },
      });
    }

    // ----------------------------------------------------
    // 8. 최종 결과 확인
    // ----------------------------------------------------
    const finalProjects = await prisma.project.findMany({
      include: {
        _count: { select: { issues: true, sprints: true } },
      },
    });

    const finalIssuesCount = await prisma.issue.count();

    console.log('\n========================================');
    console.log('🎉 [SUCCESS] PostgreSQL Seed Finished!');
    console.log('========================================');
    console.log(`Total Projects: ${finalProjects.length}`);
    for (const p of finalProjects) {
      console.log(` - [${p.key}] ${p.name} (Issues: ${p._count.issues}, Sprints: ${p._count.sprints})`);
    }
    console.log(`Total Issues: ${finalIssuesCount}`);
    console.log('========================================\n');
  } catch (err) {
    console.error('❌ Failed to reset and seed examples:', err);
    throw err;
  } finally {
    await prisma.$disconnect();
    await globalPrisma.$disconnect();
  }
}

resetAndSeedExamples();
