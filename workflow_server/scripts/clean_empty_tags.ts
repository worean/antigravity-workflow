import { prisma } from '../src/lib/prisma.js';
import { cleanupUnusedTagsService } from '../src/modules/tags/services/cleanupUnusedTags.service.js';

async function main() {
  console.log('🔍 [태그 정리] 현재 DB의 태그 상태를 확인합니다...');

  // 현재 모든 태그 및 연결 개수 조회
  const allTags = await prisma.tag.findMany({
    include: {
      _count: {
        select: {
          issues: true,
          projects: true,
        },
      },
    },
  });

  console.log(`📌 총 태그 수: ${allTags.length}개`);

  const emptyTags = allTags.filter(
    (tag) => tag._count.issues === 0 && tag._count.projects === 0
  );
  const activeTags = allTags.filter(
    (tag) => tag._count.issues > 0 || tag._count.projects > 0
  );

  console.log(`\n✅ 사용 중인 활성 태그 (${activeTags.length}개):`);
  activeTags.forEach((tag) => {
    console.log(
      ` - [#${tag.id}] ${tag.name} (이슈: ${tag._count.issues}개, 프로젝트: ${tag._count.projects}개)`
    );
  });

  console.log(`\n⚠️ 사용처가 없는 비어있는(0개 항목) 태그 (${emptyTags.length}개):`);
  if (emptyTags.length === 0) {
    console.log(' - 현재 비어있는 태그가 없습니다. DB가 이미 깨끗합니다.');
  } else {
    emptyTags.forEach((tag) => {
      console.log(` - [#${tag.id}] ${tag.name} (이슈: 0개, 프로젝트: 0개) -> 정리 대상`);
    });

    console.log('\n🧹 비어있는 태그 정리를 진행합니다...');
    const deletedCount = await cleanupUnusedTagsService();
    console.log(`✨ 정리 완료: 총 ${deletedCount}개의 고아 태그가 DB에서 정상적으로 제거되었습니다.`);
  }

  // 정리 후 최종 태그 목록 조회
  const remainingTags = await prisma.tag.findMany({
    include: {
      _count: {
        select: {
          issues: true,
          projects: true,
        },
      },
    },
  });

  console.log(`\n🎉 최종 잔여 태그 수: ${remainingTags.length}개`);
}

main()
  .catch((err) => {
    console.error('❌ 태그 정리 중 오류 발생:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
