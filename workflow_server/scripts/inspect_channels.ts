import dotenv from 'dotenv';
dotenv.config();

import { globalPrisma } from '../src/lib/globalPrisma.js';

async function main() {
  try {
    const channels = await globalPrisma.chatChannel.findMany({
      include: {
        _count: {
          select: { messages: true, members: true }
        }
      },
      orderBy: [
        { workspaceId: 'asc' },
        { type: 'asc' },
        { name: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    console.log(`\n================ Total Global Chat Channels: ${channels.length} ================`);
    for (const c of channels) {
      console.log(`[ID: ${c.id}] Name: "${c.name}" | Type: ${c.type} | Workspace: ${c.workspaceId} | ProjectId: ${c.projectId} | GroupId: ${c.groupId} | Messages: ${c._count.messages} | Members: ${c._count.members} | Created: ${c.createdAt.toISOString()}`);
    }
    console.log(`========================================================================\n`);
  } catch (err) {
    console.error('Inspect error:', err);
  } finally {
    await globalPrisma.$disconnect();
  }
}

main();
