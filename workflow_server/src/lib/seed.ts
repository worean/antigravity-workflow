import { prisma } from './prisma.js';

export async function seedDatabase() {
  console.log('🌱 Starting Database Initial Seeding...');

  // 1. Issue Metadata Seeding
  const issueTypes = [
    { id: 1, name: 'Task', description: '일반 작업/할 일', icon: 'CheckSquare', isSystem: true },
    { id: 2, name: 'Bug', description: '버그 및 결함 수정', icon: 'Bug', isSystem: true },
    { id: 3, name: 'Feature', description: '신규 기능 개발', icon: 'Sparkles', isSystem: true },
    { id: 4, name: 'Epic', description: '상위 거대 목표', icon: 'Layers', isSystem: true },
  ];

  for (const t of issueTypes) {
    await prisma.issueType.upsert({
      where: { id: t.id },
      update: t,
      create: t,
    });
  }

  const issuePriorities = [
    { id: 1, name: 'Low', level: 1, color: '#10b981', isSystem: true },
    { id: 2, name: 'Medium', level: 2, color: '#f59e0b', isSystem: true },
    { id: 3, name: 'High', level: 3, color: '#f43f5e', isSystem: true },
    { id: 4, name: 'Urgent', level: 4, color: '#9333ea', isSystem: true },
  ];

  for (const p of issuePriorities) {
    await prisma.issuePriority.upsert({
      where: { id: p.id },
      update: p,
      create: p,
    });
  }

  const issueStatuses = [
    { id: 1, name: 'To Do', category: 'TODO', isSystem: true },
    { id: 2, name: 'In Progress', category: 'IN_PROGRESS', isSystem: true },
    { id: 3, name: 'In Review', category: 'IN_REVIEW', isSystem: true },
    { id: 4, name: 'Done', category: 'DONE', isSystem: true },
  ];

  for (const s of issueStatuses) {
    await prisma.issueStatus.upsert({
      where: { id: s.id },
      update: s,
      create: s,
    });
  }

  // 2. Project Metadata Seeding
  const projectPriorities = [
    { id: 1, name: 'Normal', level: 1, color: '#3b82f6', isSystem: true },
    { id: 2, name: 'High', level: 2, color: '#f43f5e', isSystem: true },
  ];

  for (const pp of projectPriorities) {
    await prisma.projectPriority.upsert({
      where: { id: pp.id },
      update: pp,
      create: pp,
    });
  }

  const projectStatuses = [
    { id: 1, name: 'Active', category: 'IN_PROGRESS', isSystem: true },
    { id: 2, name: 'Archived', category: 'DONE', isSystem: true },
  ];

  for (const ps of projectStatuses) {
    await prisma.projectStatus.upsert({
      where: { id: ps.id },
      update: ps,
      create: ps,
    });
  }

  console.log('✅ Base Metadata Seed Completed Cleanly!');
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding Failed:', err);
      process.exit(1);
    });
}
