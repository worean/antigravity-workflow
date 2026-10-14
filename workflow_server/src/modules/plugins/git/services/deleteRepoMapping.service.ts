﻿﻿import { prisma } from '#lib/prisma.js';

export async function deleteRepoMappingService(mappingId: number) {
  const existing = await prisma.gitRepositoryMapping.findUnique({
    where: { id: mappingId },
  });

  if (!existing) {
    throw new Error('존재하지 않는 저장소 매핑입니다.');
  }

  await prisma.gitRepositoryMapping.delete({
    where: { id: mappingId },
  });

  return { success: true, message: '저장소 매핑이 성공적으로 해제되었습니다.' };
}
