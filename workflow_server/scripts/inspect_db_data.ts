import { globalPrisma } from '../src/lib/globalPrisma.js';
import { prisma } from '../src/lib/prisma.js';

async function main() {
  console.log('=== WORKSPACES IN GLOBAL DB ===');
  const workspaces = await globalPrisma.workspace.findMany();
  for (const ws of workspaces) {
    console.log(`[WS #${ws.id}] name: "${ws.name}", status: ${ws.status}, icon: ${ws.icon ? (ws.icon.startsWith('data:') ? `Base64(len=${ws.icon.length})` : ws.icon) : 'NULL'}, slug: ${ws.slug}`);
  }

  console.log('\n=== USERS IN GLOBAL DB ===');
  const gUsers = await globalPrisma.user.findMany();
  for (const u of gUsers) {
    console.log(`[Global User #${u.id}] email: ${u.email}, name: ${u.name}, avatar: ${u.avatar ? (u.avatar.startsWith('data:') ? `Base64(len=${u.avatar.length})` : u.avatar) : 'NULL'}, avatarColor: ${u.avatarColor}`);
  }

  console.log('\n=== USERS IN WORKSPACE DB ===');
  const wUsers = await prisma.user.findMany();
  for (const u of wUsers) {
    console.log(`[Workspace User #${u.id}] email: ${u.email}, name: ${u.name}, avatar: ${u.avatar ? (u.avatar.startsWith('data:') ? `Base64(len=${u.avatar.length})` : u.avatar) : 'NULL'}, avatarColor: ${u.avatarColor}`);
  }

  console.log('\n=== RECENT CHAT MESSAGES ===');
  const messages = await globalPrisma.chatMessage.findMany({
    take: 5,
    orderBy: { id: 'desc' },
    include: { sender: { select: { id: true, name: true, email: true, avatar: true } } },
  });
  for (const m of messages) {
    console.log(`[Message #${m.id}] sender: #${m.senderId} (${m.sender?.email}), avatar: ${m.sender?.avatar ? 'EXISTS' : 'NULL'}, content: "${m.content.slice(0, 20)}"`);
  }
}

main().catch(console.error).finally(() => process.exit(0));
