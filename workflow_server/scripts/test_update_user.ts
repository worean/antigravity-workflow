import { globalPrisma } from '../src/lib/globalPrisma.js';
import { prisma } from '../src/lib/prisma.js';
import { updateUserService } from '../src/modules/users/services/updateUser.service.js';

async function main() {
  const wUser = await prisma.user.findUnique({ where: { id: 1 } });
  console.log('Workspace user avatar length:', wUser?.avatar?.length);

  try {
    const res = await updateUserService(1, {
      name: wUser?.name || '시스템 최고 관리자',
      avatar: wUser?.avatar,
      avatarColor: wUser?.avatarColor,
    });
    console.log('updateUserService result avatar len:', res.avatar?.length);
  } catch (err: any) {
    console.error('updateUserService failed:', err.message);
  }

  const gUser = await globalPrisma.user.findUnique({ where: { id: 1 } });
  console.log('Global user avatar length after update:', gUser?.avatar?.length);
}

main().catch(console.error).finally(() => process.exit(0));
