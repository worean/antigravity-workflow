import { globalPrisma } from '../src/lib/globalPrisma.js';
import { prisma } from '../src/lib/prisma.js';

async function main() {
  const globalUsers = await globalPrisma.user.findMany();
  console.log(`--- Global Users (${globalUsers.length}) ---`);
  globalUsers.forEach((u) => console.log(`[${u.id}] ${u.email} | ${u.name} | ${u.role}`));

  const workspaces = await globalPrisma.workspace.findMany();
  console.log(`\n--- Workspaces (${workspaces.length}) ---`);
  workspaces.forEach((w) => console.log(`[${w.id}] ${w.name} (${w.slug}) => ${w.dbUrl}`));

  const workspaceUsers = await prisma.user.findMany();
  console.log(`\n--- Workspace Users (${workspaceUsers.length}) ---`);
  workspaceUsers.forEach((u) => console.log(`[${u.id}] ${u.email} | ${u.name} | ${u.role}`));

  const projects = await prisma.project.findMany();
  console.log(`\n--- Projects (${projects.length}) ---`);
  projects.forEach((p) => console.log(`[${p.id}] ${p.name} (${p.key})`));

  const issues = await prisma.issue.count();
  console.log('\nTotal Issues count:', issues);

  const activities = await prisma.activityLog.count();
  console.log('Total Activity Logs count:', activities);

  const comments = await prisma.comment.count();
  console.log('Total Comments count:', comments);
}

main()
  .catch(console.error)
  .finally(async () => {
    await globalPrisma.$disconnect();
    await prisma.$disconnect();
  });
