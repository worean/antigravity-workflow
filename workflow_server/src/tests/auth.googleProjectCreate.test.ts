/**
 * 🧪 [Domain: auth & projects / Service: googleLogin & createProject Integration]
 * - 기능: 구글 계정 로그인 후 발급된 JWT 토큰 기반으로 프로젝트 신규 생성 E2E 통합 테스트
 * - 경우의 수: Google 로그인 ➔ JWT 토큰 발급 ➔ 토큰 기반 프로젝트 생성 ➔ ownerId가 구글 사용자로 지정됨
 */

import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🧪 [Google Auth & Project Creation] E2E Integration Test', () => {
  let googleAuthToken: string;
  let googleUser: any;
  let createdProjectId: number;

  afterAll(async () => {
    if (createdProjectId) {
      await prisma.projectMember.deleteMany({ where: { projectId: createdProjectId } });
      await prisma.project.delete({ where: { id: createdProjectId } }).catch(() => {});
    }
    if (googleUser?.id) {
      await prisma.socialAccount.deleteMany({ where: { userId: googleUser.id } });
      await prisma.user.delete({ where: { id: googleUser.id } }).catch(() => {});
    }
  });

  it('1️⃣ Google 계정 로그인 ➔ JWT Access Token 발급 완료', async () => {
    console.log('\n==================================================');
    console.log('🌐 Step 1: 구글 계정 로그인 요청 (POST /api/auth/google)');
    console.log('==================================================');

    const loginResponse = await request(app)
      .post('/api/auth/google')
      .send({ accessToken: 'mock_google_access_token_user_123' });

    console.log('📥 Response Status:', loginResponse.status);
    console.log('🔑 Generated JWT Token:', loginResponse.body.token ? `${loginResponse.body.token.substring(0, 30)}...` : 'NULL');
    console.log('👤 Authenticated Google User:', JSON.stringify(loginResponse.body.user, null, 2));

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty('token');
    expect(loginResponse.body.user).toHaveProperty('isGoogleLinked', true);

    googleAuthToken = loginResponse.body.token;
    googleUser = loginResponse.body.user;
  });

  it('2️⃣ 발급받은 구글 계정 토큰 기반으로 Project 생성 완료', async () => {
    console.log('\n==================================================');
    console.log('🏗️ Step 2: 구글 계정 토큰 기반 프로젝트 생성 요청 (POST /api/projects/create)');
    console.log('==================================================');

    const projectKey = `GPROJ_${Date.now()}`;
    const projectResponse = await request(app)
      .post('/api/projects/create')
      .set('Authorization', `Bearer ${googleAuthToken}`)
      .send({
        name: 'Google User Workspace Project',
        key: projectKey,
        description: 'Project created by Google authenticated user'
      });

    console.log('📥 Response Status:', projectResponse.status);
    console.log('📁 Created Project Details:', JSON.stringify(projectResponse.body, null, 2));

    expect(projectResponse.status).toBe(201);
    expect(projectResponse.body).toHaveProperty('id');
    expect(projectResponse.body.ownerId).toBe(googleUser.id);
    expect(projectResponse.body.key).toBe(projectKey);

    createdProjectId = projectResponse.body.id;

    console.log('\n==================================================');
    console.log(`✅ 검증 완료: Project (ID: ${createdProjectId}) 의 ownerId(${projectResponse.body.ownerId})가 Google 로그인 유저 ID(${googleUser.id})와 일치합니다!`);
    console.log('==================================================\n');
  });
});
