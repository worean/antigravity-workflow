import { describe, it, expect } from 'vitest';
import { createUserService } from '../modules/users/services/createUser.service.js';
import { emailLoginService } from '../modules/auth/services/emailLogin.service.js';
import { prisma } from '#lib/prisma.js';
import bcrypt from 'bcryptjs';

describe('Auth & User bcrypt Unit Tests', () => {
  const testEmail = `bcrypt_test_${Date.now()}@example.com`;
  const rawPassword = 'SecurePassword123!';

  it('createUser - should hash user password with bcrypt', async () => {
    const user = await createUserService({
      email: testEmail,
      name: 'Bcrypt User',
      password: rawPassword
    });

    expect(user).toBeDefined();
    expect(user.email).toBe(testEmail);

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    expect(dbUser).toBeDefined();
    expect(dbUser?.password).not.toBe(rawPassword);
    expect(dbUser?.password?.startsWith('$2b$') || dbUser?.password?.startsWith('$2a$')).toBe(true);

    const isMatch = await bcrypt.compare(rawPassword, dbUser!.password!);
    expect(isMatch).toBe(true);
  });

  it('emailLogin - should verify hashed password successfully', async () => {
    const res = await emailLoginService({
      email: testEmail,
      password: rawPassword
    });

    expect(res).toBeDefined();
    expect(res.token).toBeDefined();
    expect(res.user.email).toBe(testEmail);
  });

  it('emailLogin - should reject incorrect password', async () => {
    await expect(
      emailLoginService({
        email: testEmail,
        password: 'WrongPassword!'
      })
    ).rejects.toThrow('Invalid password');
  });
});
