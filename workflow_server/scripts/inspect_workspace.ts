import dotenv from 'dotenv';
dotenv.config();

import { prisma as workspacePrisma } from '../src/lib/prisma.js';

async function main() {
  try {
    const projects = await workspacePrisma.project.findMany({
      select: { id: true, name: true, key: true, status: true, ownerId: true }
    });
    console.log(`\n================ Total Projects: ${projects.length} ================`);
    for (const p of projects) {
      console.log(`[Project ID: ${p.id}] Name: "${p.name}" | Key: ${p.key} | Status: ${p.status} | Owner: ${p.ownerId}`);
    }

    const groups = await workspacePrisma.group.findMany({
      select: { id: true, name: true, description: true }
    });
    console.log(`\n================ Total Groups: ${groups.length} ================`);
    for (const g of groups) {
      console.log(`[Group ID: ${g.id}] Name: "${g.name}" | Description: ${g.description}`);
    }
  } catch (err) {
    console.error('Workspace inspect error:', err);
  } finally {
    await workspacePrisma.$disconnect();
  }
}

main();
