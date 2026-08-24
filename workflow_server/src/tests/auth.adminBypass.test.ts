// -*- coding: utf-8 -*-
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';
import jwt from 'jsonwebtoken';

describe('👑 [Auth: Admin Bypass] worean@naver.com 어드민 계정 인증 및 인가 검증 무시 테스트', () => {
  let otherUser: any;
  let otherToken: string;
  let privateProject: any;

  beforeAll(async () => {
    // 1. 일반 사용자 생성 (프로젝트 오너)
    const uniqueEmail = `regular_user_${Date.now()}@example.com`;
    otherUser = await prisma.user.create({
      data: {
        email: uniqueEmail,
        name: '일반 사용자',
        password: 'password123',
        role: 'MEMBER',
      },
    });

    const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
    otherToken = jwt.sign(
      { userId: otherUser.id, email: otherUser.email },
      jwtSecret,
      { expiresIn: '1h' }
    );

    // 2. 일반 사용자가 소유한 비공개 프로젝트 생성 (어드민은 멤버로 등록되어 있지 않음)
    privateProject = await prisma.project.create({
      data: {
        name: '비공개 연구 프로젝트',
        key: `PRIV_${Date.now()}`,
        ownerId: otherUser.id,
      },
    });
  });

  afterAll(async () => {
    if (privateProject) {
      await prisma.project.delete({ where: { id: privateProject.id } }).catch(() => {});
    }
    if (otherUser) {
      await prisma.user.delete({ where: { id: otherUser.id } }).catch(() => {});
    }
    await prisma.user.delete({ where: { email: 'worean@naver.com' } }).catch(() => {});
  });

  it('1️⃣ worean@naver.com 은 비밀번호 없이/임의의 비밀번호로도 모든 인증 절차를 무시하고 즉시 로그인되어야 한다', async () => {
    // 비밀번호 없이 로그인 시도
    const resWithoutPw = await request(app)
      .post('/api/auth/login')
      .send({ email: 'worean@naver.com' });

    expect(resWithoutPw.status).toBe(200);
    expect(resWithoutPw.body.token).toBeDefined();
    expect(resWithoutPw.body.user.email).toBe('worean@naver.com');
    expect(resWithoutPw.body.user.role).toBe('ADMIN');

    // 임의의 비밀번호로 로그인 시도
    const resWithAnyPw = await request(app)
      .post('/api/auth/login')
      .send({ email: 'worean@naver.com', password: 'any_random_password_1234!' });

    expect(resWithAnyPw.status).toBe(200);
    expect(resWithAnyPw.body.token).toBeDefined();
    expect(resWithAnyPw.body.user.email).toBe('worean@naver.com');
    expect(resWithAnyPw.body.user.role).toBe('ADMIN');
  });

  it('2️⃣ 일반 사용자는 잘못된 비밀번호 입력 시 로그인이 차단(400)되어야 한다', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: otherUser.email, password: 'wrong_password' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid password');
  });

  it('3️⃣ worean@naver.com (ADMIN) 은 프로젝트 멤버가 아니더라도 모든 프로젝트 수정/인가 검증을 통과해야 한다', async () => {
    // 어드민 로그인 토큰 발급
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'worean@naver.com' });

    const adminToken = loginRes.body.token;

    // 멤버로 등록되지 않은 privateProject에 이슈 생성 시도 (requireProjectMember 통과 검증)
    const issueRes = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: '어드민 권한 생성 이슈',
        projectId: privateProject.id,
      });

    expect(issueRes.status).toBe(201);
    expect(issueRes.body.title).toBe('어드민 권한 생성 이슈');
    expect(issueRes.body.projectId).toBe(privateProject.id);

    // 프로젝트 정보 수정 시도 (requireProjectPM 통과 검증)
    const updateRes = await request(app)
      .put(`/api/projects/${privateProject.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: '어드민에 의해 수정된 프로젝트 명',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe('어드민에 의해 수정된 프로젝트 명');
  });

  it('4️⃣ 일반 멤버가 아닌 다른 유저는 해당 프로젝트에 접근 시 403 Forbidden 에러가 발생해야 한다', async () => {
    // 제3의 일반 유저 생성
    const thirdUser = await prisma.user.create({
      data: {
        email: `unauthorized_${Date.now()}@example.com`,
        name: '권한없는 유저',
        role: 'MEMBER',
      },
    });

    const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
    const unauthorizedToken = jwt.sign(
      { userId: thirdUser.id, email: thirdUser.email },
      jwtSecret,
      { expiresIn: '1h' }
    );

    const issueRes = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${unauthorizedToken}`)
      .send({
        title: '무단 이슈 생성 시도',
        projectId: privateProject.id,
      });

    expect(issueRes.status).toBe(403);
    expect(issueRes.body.error).toContain('Forbidden');

    await prisma.user.delete({ where: { id: thirdUser.id } }).catch(() => {});
  });
});
