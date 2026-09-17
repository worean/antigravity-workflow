import { describe, it, expect } from 'vitest';
import { globalPrisma } from '#lib/globalPrisma.js';
import { registerService } from '../modules/auth/services/register.service.js';
import { verifyEmailService } from '../modules/auth/services/verifyEmail.service.js';
import { verifyEmailLinkService } from '../modules/auth/services/verifyEmailLink.service.js';
import { emailLoginService } from '../modules/auth/services/emailLogin.service.js';
import { googleLoginService } from '../modules/auth/services/googleLogin.service.js';

describe('🔐 Auth Email Verification & Social Multi-OAuth System Tests', () => {
  const getUniqueEmail = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`;
  const testPassword = 'securePassword123';

  it('❌ 비밀번호가 6자 미만인 경우 회원가입이 거부되어야 한다', async () => {
    const email = getUniqueEmail('pwd_short');
    await expect(
      registerService({
        email,
        password: '12345', // 5자
        name: '비번테스터',
      })
    ).rejects.toThrow('비밀번호는 최소 6자 이상이어야 합니다.');
  });

  it('✅ 정상 회원가입 요청 시 isEmailVerified = false 상태와 인증코드가 발급되어야 한다', async () => {
    const email = getUniqueEmail('reg_success');
    const res = await registerService({
      email,
      password: testPassword,
      name: '정상가입자',
    });

    expect(res.requireVerification).toBe(true);
    expect(res.email).toBe(email);

    const user = await globalPrisma.user.findUnique({
      where: { email },
    });
    expect(user).not.toBeNull();
    expect(user?.isEmailVerified).toBe(false);
    expect(user?.verificationCode).toHaveLength(6);
    expect(user?.verificationToken).toBeDefined();
    expect(user?.verificationExpiresAt).toBeDefined();
  });

  it('❌ 미인증 상태에서 일반 로그인 시도 시 인증 필요 응답을 반환해야 한다', async () => {
    const email = getUniqueEmail('unverified_login');
    await registerService({
      email,
      password: testPassword,
      name: '미인증유저',
    });

    const loginRes = await emailLoginService({
      email,
      password: testPassword,
    });

    expect(loginRes.requireVerification).toBe(true);
    expect(loginRes.token).toBeUndefined();
  });

  it('❌ 잘못된 6자리 코드로 인증 시도 시 에러가 발생해야 한다', async () => {
    const email = getUniqueEmail('wrong_otp');
    await registerService({
      email,
      password: testPassword,
      name: '오답유저',
    });

    await expect(
      verifyEmailService({
        email,
        code: '999999', // 잘못된 코드
      })
    ).rejects.toThrow('인증코드가 올바르지 않습니다.');
  });

  it('✅ 올바른 6자리 코드로 인증 시 isEmailVerified = true 전환 및 기본 Workspace가 자동 생성되어야 한다', async () => {
    const email = getUniqueEmail('valid_otp');
    await registerService({
      email,
      password: testPassword,
      name: '인증완료유저',
    });

    const userBefore = await globalPrisma.user.findUnique({
      where: { email },
    });
    const validCode = userBefore!.verificationCode!;

    const verifyRes = await verifyEmailService({
      email,
      code: validCode,
    });

    expect(verifyRes.token).toBeDefined();
    expect(verifyRes.user.isEmailVerified).toBe(true);
    expect(verifyRes.workspace).toBeDefined();
    expect(verifyRes.workspace.name).toContain('Workspace');

    // DB 재검증
    const userAfter = await globalPrisma.user.findUnique({
      where: { email },
      include: { ownedWorkspaces: true },
    });
    expect(userAfter?.isEmailVerified).toBe(true);
    expect(userAfter?.verificationCode).toBeNull();
    expect(userAfter?.ownedWorkspaces.length).toBeGreaterThan(0);
  });

  it('✅ URL 매직 토큰 링크로 인증 시 정상 완료 및 JWT 토큰이 발급되어야 한다', async () => {
    const email = getUniqueEmail('magic_link');
    await registerService({
      email,
      password: testPassword,
      name: '링크유저',
    });

    const user = await globalPrisma.user.findUnique({
      where: { email },
    });
    const token = user!.verificationToken!;

    const linkRes = await verifyEmailLinkService(token);
    expect(linkRes.token).toBeDefined();
    expect(linkRes.user.isEmailVerified).toBe(true);
    expect(linkRes.workspace).toBeDefined();
  });

  it('✅ Google 소셜 로그인 시 자동 회원가입(isEmailVerified=true, password=null) 및 기본 Workspace가 생성되어야 한다', async () => {
    const googleToken = `mock_gtoken_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const gRes = await googleLoginService(googleToken);

    expect(gRes.token).toBeDefined();
    expect(gRes.user.isGoogleLinked).toBe(true);
    expect(gRes.user.isEmailVerified).toBe(true);
    expect(gRes.workspace).toBeDefined();

    const gUser = await globalPrisma.user.findUnique({
      where: { id: gRes.user.id },
      include: { socialAccounts: true, ownedWorkspaces: true },
    });
    expect(gUser?.password).toBeNull();
    expect(gUser?.socialAccounts[0].provider).toBe('GOOGLE');
    expect(gUser?.ownedWorkspaces.length).toBeGreaterThan(0);

    // 🔒 소셜 가입자가 일반 비밀번호 로그인을 시도할 때 방어되는지 검증
    await expect(
      emailLoginService({
        email: gUser!.email,
        password: 'anyPassword123',
      })
    ).rejects.toThrow('해당 계정은 Google 간편 로그인으로 가입된 계정입니다. 소셜 로그인을 이용해주세요.');
  });
});
