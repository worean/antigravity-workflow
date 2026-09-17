import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '#lib/prisma.js';
import { updateUserService } from '../modules/users/services/updateUser.service.js';
import { getUserService } from '../modules/users/services/getUser.service.js';
import { getMeService } from '../modules/auth/services/getMe.service.js';

describe('User Preferences Service Tests', () => {
  let testUserId: number;

  beforeEach(async () => {
    const testEmail = `test_pref_${Date.now()}_${Math.random()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Preferences Tester',
        preferences: JSON.stringify({ isSundayStart: true, defaultPriority: 2 }),
      },
    });
    testUserId = user.id;
  });

  it('should retrieve default preferences when user is fetched', async () => {
    const user = await getUserService(testUserId);
    expect(user.preferences).toBeDefined();
    const parsed = JSON.parse(user.preferences || '{}');
    expect(parsed.isSundayStart).toBe(true);
    expect(parsed.defaultPriority).toBe(2);
  });

  it('should update user preferences successfully', async () => {
    const newPreferences = {
      isSundayStart: false,
      defaultPriority: 4,
      compactCards: true,
      desktopNotifications: false,
    };

    const updated = await updateUserService(testUserId, {
      preferences: JSON.stringify(newPreferences),
    });

    expect(updated.preferences).toBeDefined();
    const parsed = JSON.parse(updated.preferences || '{}');
    expect(parsed.isSundayStart).toBe(false);
    expect(parsed.defaultPriority).toBe(4);
    expect(parsed.compactCards).toBe(true);

    const me = await getMeService(testUserId);
    expect(me.preferences).toBe(JSON.stringify(newPreferences));
  });
});