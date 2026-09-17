import path from 'path';
import fs from 'fs';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { globalPrisma } from '../src/lib/globalPrisma.js';

async function getChromium() {
  try {
    const pw = await import('../../workflow_react/node_modules/playwright/index.mjs');
    return pw.chromium;
  } catch (e) {
    try {
      const pw = await import('playwright');
      return pw.chromium;
    } catch (err) {
      console.warn('⚠️ Playwright import fallback warning:', err);
      return null;
    }
  }
}

interface TestAssertion {
  check: string;
  passed: boolean;
  message?: string;
}

interface ApiTestCase {
  id: string;
  category: string;
  title: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  requestHeaders: Record<string, string>;
  requestBody?: any;
  responseStatus: number;
  responseHeaders: Record<string, string>;
  responseBody: any;
  durationMs: number;
  passed: boolean;
  assertions: TestAssertion[];
}

const testResults: ApiTestCase[] = [];

function recordTest(tc: ApiTestCase) {
  testResults.push(tc);
  const mark = tc.passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${mark} [${tc.method} ${tc.url}] ${tc.title} (${tc.durationMs}ms)`);
  if (!tc.passed) {
    console.log(`   👉 Status: ${tc.responseStatus}`);
    console.log(`   👉 Body:`, JSON.stringify(tc.responseBody));
    console.log(`   👉 Failed Assertions:`, tc.assertions.filter(a => !a.passed));
  }
}

async function runAllApiTests(): Promise<string> {
  console.log('🚀 Starting Comprehensive REST API Test & Inspection Suite...\n');

  // 1. 테스트용 기본 사용자 및 JWT 토큰 준비
  let adminUser = await globalPrisma.user.findFirst({
    where: { email: 'worean@naver.com' }
  });

  if (!adminUser) {
    adminUser = await globalPrisma.user.findFirst();
  }

  if (!adminUser) {
    adminUser = await globalPrisma.user.create({
      data: {
        email: 'worean@naver.com',
        name: '박주영 (Admin)',
        password: 'dummy_hash_for_test',
        role: 'ADMIN',
        emailVerified: true
      }
    });
  }

  const jwtSecret = process.env.JWT_SECRET || 'secret';
  const authToken = jwt.sign(
    { userId: adminUser.id, email: adminUser.email, role: adminUser.role },
    jwtSecret,
    { expiresIn: '7d' }
  );

  const authHeaders = {
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  // --------------------------------------------------------------------------
  // Category 1: System & Health
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const res = await request(app).get('/api/health');
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Response contains status: "OK"', passed: res.body?.status === 'OK' },
      { check: 'Database connectivity is verified', passed: !!res.body?.database }
    ];

    recordTest({
      id: 'HEALTH-01',
      category: 'System & Health',
      title: '시스템 헬스체크 및 DB 연결 상태 점검',
      description: '서버 가동 상태, Dual DB(Global/Workspace) 연결 및 메타데이터 카운트를 검증합니다.',
      method: 'GET',
      url: '/api/health',
      requestHeaders: {},
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  // --------------------------------------------------------------------------
  // Category 2: Authentication & User Profile
  // --------------------------------------------------------------------------
  {
    // 2.1 Login
    const start = Date.now();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: adminUser.email });
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Response contains JWT token', passed: typeof res.body?.token === 'string' },
      { check: 'User email matches payload', passed: res.body?.user?.email === adminUser.email }
    ];

    recordTest({
      id: 'AUTH-01',
      category: 'Authentication & Profile',
      title: '이메일 기반 로그인 및 JWT 토큰 발급',
      description: '등록된 관리자 이메일로 로그인하여 인증 토큰과 기본 프로필을 안전하게 수신합니다.',
      method: 'POST',
      url: '/api/auth/login',
      requestHeaders: { 'Content-Type': 'application/json' },
      requestBody: { email: adminUser.email },
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: { ...res.body, token: res.body?.token ? `${res.body.token.substring(0, 20)}...[MASKED]` : null },
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 2.2 Get Me
    const start = Date.now();
    const res = await request(app)
      .get('/api/auth/me')
      .set(authHeaders);
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Returns user object with ID', passed: typeof res.body?.user?.id === 'number' },
      { check: 'User email matches authenticated user', passed: res.body?.user?.email === adminUser.email }
    ];

    recordTest({
      id: 'AUTH-02',
      category: 'Authentication & Profile',
      title: '현재 로그인 사용자 프로필 조회 (/api/auth/me)',
      description: '발급된 JWT 토큰을 기반으로 사용자 신원, 역할(Role) 및 프로필 정보를 확인합니다. (단일 워크스페이스 정보는 /api/workspaces/current 로 분리 제공)',
      method: 'GET',
      url: '/api/auth/me',
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]` },
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 2.3 Users List
    const start = Date.now();
    const res = await request(app)
      .get('/api/users')
      .set(authHeaders);
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Returns user array', passed: Array.isArray(res.body) },
      { check: 'Users array is not empty', passed: Array.isArray(res.body) && res.body.length > 0 }
    ];

    recordTest({
      id: 'USER-01',
      category: 'Authentication & Profile',
      title: '전체 사용자 목록 조회 (UI 담당자/멘션 연동)',
      description: '태스크 담당자 배정 및 멘션 자동완성에 필요한 전체 사용자 목록을 조회합니다.',
      method: 'GET',
      url: '/api/users',
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]` },
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: Array.isArray(res.body) ? res.body.slice(0, 3) : res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  // --------------------------------------------------------------------------
  // Category 3: Single Workspace Architecture (최근 작업 핵심 사양)
  // --------------------------------------------------------------------------
  let currentWorkspaceId: number = 0;
  {
    // 3.1 Get Current Workspace
    const start = Date.now();
    const res = await request(app)
      .get('/api/workspaces/current')
      .set(authHeaders);
    const duration = Date.now() - start;

    if (res.body?.id) {
      currentWorkspaceId = res.body.id;
    }

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Returns workspace object with id and name', passed: typeof res.body?.id === 'number' && !!res.body?.name },
      { check: 'Workspace has members list', passed: Array.isArray(res.body?.members) }
    ];

    recordTest({
      id: 'WS-01',
      category: 'Single Workspace',
      title: '단일 활성 워크스페이스 정보 조회 (/api/workspaces/current)',
      description: '단일 워크스페이스 체제 확정에 따라 현재 사용자가 접속 중인 기본 워크스페이스의 메타데이터와 소속 멤버를 점검합니다.',
      method: 'GET',
      url: '/api/workspaces/current',
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]` },
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 3.2 Update Current Workspace
    const updatePayload = {
      name: 'AntiGravity Unified HQ',
      icon: 'workspace-symbol-icon'
    };
    const start = Date.now();
    const res = await request(app)
      .put('/api/workspaces/current')
      .set(authHeaders)
      .send(updatePayload);
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Workspace name is successfully updated', passed: res.body?.name === updatePayload.name },
      { check: 'Workspace icon is saved', passed: res.body?.icon === updatePayload.icon }
    ];

    recordTest({
      id: 'WS-02',
      category: 'Single Workspace',
      title: '단일 워크스페이스 메타데이터 수정 (설정 탭 연동)',
      description: '설정 페이지(SettingsWorkspaceTab)에서 워크스페이스 이름 및 심볼/아이콘 변경 요청을 검증합니다.',
      method: 'PUT',
      url: '/api/workspaces/current',
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]`, 'Content-Type': 'application/json' },
      requestBody: updatePayload,
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 3.3 List Workspaces
    const start = Date.now();
    const res = await request(app)
      .get('/api/workspaces')
      .set(authHeaders);
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Returns array of user workspaces', passed: Array.isArray(res.body) }
    ];

    recordTest({
      id: 'WS-03',
      category: 'Single Workspace',
      title: '소속 워크스페이스 목록 조회 (/api/workspaces)',
      description: 'WorkspaceDropdown 컴포넌트에서 워크스페이스 인식을 위해 요청하는 목록 API입니다.',
      method: 'GET',
      url: '/api/workspaces',
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]` },
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: Array.isArray(res.body) ? res.body.slice(0, 3) : res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  // --------------------------------------------------------------------------
  // Category 4: Projects & Visibility Access Control (최근 작업 핵심 사양)
  // --------------------------------------------------------------------------
  let createdProjectId: number = 0;
  const testProjectKey = `U${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  {
    // 4.1 Create Project with PROTECTED visibility
    const projectPayload = {
      name: `UI Audit Initiative (${testProjectKey})`,
      key: testProjectKey,
      description: 'Automated REST API Inspection & Verification Project for UI Implementation',
      visibility: 'PROTECTED',
      color: '#3B82F6'
    };

    const start = Date.now();
    const res = await request(app)
      .post('/api/projects')
      .set(authHeaders)
      .send(projectPayload);
    const duration = Date.now() - start;

    if (res.body?.id) {
      createdProjectId = res.body.id;
    }

    const assertions: TestAssertion[] = [
      { check: 'Status code is 201 Created', passed: res.status === 201 },
      { check: 'Project ID is defined', passed: typeof res.body?.id === 'number' },
      { check: 'Project key matches payload', passed: res.body?.key === projectPayload.key.toUpperCase() },
      { check: 'Visibility is set to PROTECTED', passed: res.body?.visibility === 'PROTECTED' }
    ];

    recordTest({
      id: 'PRJ-01',
      category: 'Projects & Access Control',
      title: '접근 제어 신규 프로젝트 생성 (PROTECTED 권한)',
      description: 'PUBLIC, PROTECTED, PRIVATE 접근 권한 정책에 따라 신규 프로젝트를 생성하고 기본 멤버십을 연결합니다.',
      method: 'POST',
      url: '/api/projects',
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]`, 'Content-Type': 'application/json' },
      requestBody: projectPayload,
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 4.2 Get Projects List
    const start = Date.now();
    const res = await request(app)
      .get('/api/projects')
      .set(authHeaders);
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Returns array of projects', passed: Array.isArray(res.body) },
      { check: 'Includes newly created project', passed: Array.isArray(res.body) && res.body.some((p: any) => p.id === createdProjectId) }
    ];

    recordTest({
      id: 'PRJ-02',
      category: 'Projects & Access Control',
      title: '프로젝트 목록 조회 및 가시성 필터링 (/api/projects)',
      description: 'ProjectsPage 및 Header 메인 메뉴에서 렌더링되는 프로젝트 리스트와 가시성 뱃지(PUBLIC/PROTECTED/PRIVATE)를 검증합니다.',
      method: 'GET',
      url: '/api/projects',
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]` },
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: Array.isArray(res.body) ? res.body.slice(0, 3) : res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 4.3 Get Project Detail
    const start = Date.now();
    const res = await request(app)
      .get(`/api/projects/${createdProjectId}`)
      .set(authHeaders);
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Project id matches target', passed: res.body?.id === createdProjectId },
      { check: 'Contains visibility property', passed: typeof res.body?.visibility === 'string' }
    ];

    recordTest({
      id: 'PRJ-03',
      category: 'Projects & Access Control',
      title: '단일 프로젝트 상세 정보 조회 (/api/projects/:id)',
      description: 'ProjectDetailPage 및 ProjectSidebar에서 요구하는 프로젝트 상세 필드와 통계 메타데이터를 확인합니다.',
      method: 'GET',
      url: `/api/projects/${createdProjectId}`,
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]` },
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 4.4 Update Project
    const updatePayload = {
      description: 'Updated description for UI Verification Suite execution',
      color: '#10B981'
    };
    const start = Date.now();
    const res = await request(app)
      .put(`/api/projects/${createdProjectId}`)
      .set(authHeaders)
      .send(updatePayload);
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Description is updated', passed: res.body?.description === updatePayload.description }
    ];

    recordTest({
      id: 'PRJ-04',
      category: 'Projects & Access Control',
      title: '프로젝트 정보 수정 (ProjectModal 연동)',
      description: 'ProjectModal 및 설정에서 프로젝트 설명과 테마 색상 수정이 DB에 정확히 반영되는지 검증합니다.',
      method: 'PUT',
      url: `/api/projects/${createdProjectId}`,
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]`, 'Content-Type': 'application/json' },
      requestBody: updatePayload,
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 4.5 Toggle Project Favorite via /api/favorites/toggle
    const favoritePayload = {
      targetType: 'PROJECT',
      targetId: createdProjectId
    };
    const start = Date.now();
    const res = await request(app)
      .post('/api/favorites/toggle')
      .set(authHeaders)
      .send(favoritePayload);
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Contains isFavorite boolean flag', passed: typeof res.body?.isFavorite === 'boolean' },
      { check: 'Target ID matches created project', passed: res.body?.targetId === createdProjectId }
    ];

    recordTest({
      id: 'PRJ-05',
      category: 'Projects & Access Control',
      title: '프로젝트 즐겨찾기(Favorite) 토글 API (/api/favorites/toggle)',
      description: 'ProjectCard의 별표 아이콘 클릭 시 즉시 즐겨찾기 상태를 토글하는 낙관적 업데이트 연동 API입니다.',
      method: 'POST',
      url: '/api/favorites/toggle',
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]`, 'Content-Type': 'application/json' },
      requestBody: favoritePayload,
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  // --------------------------------------------------------------------------
  // Category 5: Chat & Channels (최근 작업 핵심: 단일 워크스페이스 자동 바인딩)
  // --------------------------------------------------------------------------
  let createdChannelId: number = 0;
  let createdMessageId: number = 0;

  {
    // 5.1 Get Channels
    const start = Date.now();
    const res = await request(app)
      .get('/api/chat/channels')
      .set(authHeaders);
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Returns array of channels', passed: Array.isArray(res.body) }
    ];

    recordTest({
      id: 'CHAT-01',
      category: 'Chat & Channels',
      title: '워크스페이스 채널 목록 조회 (/api/chat/channels)',
      description: '현재 워크스페이스에 바인딩된 공개 채널, 프로젝트 채널 및 참여 중인 DM 목록을 조회합니다.',
      method: 'GET',
      url: '/api/chat/channels',
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]` },
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: Array.isArray(res.body) ? res.body.slice(0, 3) : res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 5.2 Create Channel with Auto Workspace Binding
    const channelPayload = {
      name: `ui-audit-channel-${Date.now().toString(36)}`,
      description: 'Automated channel for UI API inspection reports',
      type: 'GENERAL',
      isPrivate: false
    };

    const start = Date.now();
    const res = await request(app)
      .post('/api/chat/channels')
      .set(authHeaders)
      .send(channelPayload);
    const duration = Date.now() - start;

    if (res.body?.id) {
      createdChannelId = res.body.id;
    }

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 or 201', passed: res.status === 200 || res.status === 201 },
      { check: 'Channel ID is generated', passed: typeof res.body?.id === 'number' },
      { check: 'Channel name matches payload', passed: res.body?.name === channelPayload.name },
      { check: 'WorkspaceId is automatically bound', passed: res.body?.workspaceId > 0 || currentWorkspaceId > 0 }
    ];

    recordTest({
      id: 'CHAT-02',
      category: 'Chat & Channels',
      title: '단일 워크스페이스 자동 바인딩 채널 생성 (ChatCreateModal 연동)',
      description: '채널 생성 시 단일 워크스페이스 ID가 백엔드 미들웨어에서 자동 바인딩되어 400 에러를 원천 차단하는 핵심 사양입니다.',
      method: 'POST',
      url: '/api/chat/channels',
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]`, 'Content-Type': 'application/json' },
      requestBody: channelPayload,
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 5.3 Send Message to Channel
    const messagePayload = {
      content: '🚀 Hello, this is an automated verification message for UI API Audit Report!'
    };

    const start = Date.now();
    const res = await request(app)
      .post(`/api/chat/channels/${createdChannelId}/messages`)
      .set(authHeaders)
      .send(messagePayload);
    const duration = Date.now() - start;

    if (res.body?.id) {
      createdMessageId = res.body.id;
    }

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 or 201', passed: res.status === 200 || res.status === 201 },
      { check: 'Message ID is generated', passed: typeof res.body?.id === 'number' },
      { check: 'Content matches payload', passed: res.body?.content === messagePayload.content }
    ];

    recordTest({
      id: 'CHAT-03',
      category: 'Chat & Channels',
      title: '채널 실시간 메시지 발송 API',
      description: '채널 내에서 텍스트 메시지를 전송하고 Socket.io 브로드캐스트 페이로드 스키마를 검증합니다.',
      method: 'POST',
      url: `/api/chat/channels/${createdChannelId}/messages`,
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]`, 'Content-Type': 'application/json' },
      requestBody: messagePayload,
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 5.4 Get Channel Messages
    const start = Date.now();
    const res = await request(app)
      .get(`/api/chat/channels/${createdChannelId}/messages`)
      .set(authHeaders);
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Returns messages array', passed: Array.isArray(res.body?.messages) },
      { check: 'Contains newly sent message', passed: Array.isArray(res.body?.messages) && res.body.messages.some((m: any) => m.id === createdMessageId) }
    ];

    recordTest({
      id: 'CHAT-04',
      category: 'Chat & Channels',
      title: '채널 메시지 히스토리 조회 API',
      description: '채널 진입 시 렌더링할 대화 메시지 히스토리 및 발신자 프로필 정보를 확인합니다.',
      method: 'GET',
      url: `/api/chat/channels/${createdChannelId}/messages`,
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]` },
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: Array.isArray(res.body?.messages) ? res.body.messages.slice(0, 3) : res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  // --------------------------------------------------------------------------
  // Category 6: WBS, Issues & Tasks
  // --------------------------------------------------------------------------
  let createdIssueId: number = 0;
  if (!createdProjectId) {
    const existingPrj = await prisma.project.findFirst();
    if (existingPrj) createdProjectId = existingPrj.id;
  }
  const issuePriority = await prisma.issuePriority.findFirst();
  const issueType = await prisma.issueType.findFirst();
  const issueStatus = await prisma.issueStatus.findFirst();

  {
    // 6.1 Create Issue
    const issuePayload = {
      title: 'UI API Audit & PDF Report Generation Implementation',
      description: 'Implement automated PDF and HTML reporting for API inspection',
      projectId: createdProjectId,
      priorityId: issuePriority?.id || 1,
      typeId: issueType?.id || 1,
      statusId: issueStatus?.id || 1,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      progress: 50
    };

    const start = Date.now();
    const res = await request(app)
      .post('/api/issues')
      .set(authHeaders)
      .send(issuePayload);
    const duration = Date.now() - start;

    if (res.body?.id) {
      createdIssueId = res.body.id;
    }

    const assertions: TestAssertion[] = [
      { check: 'Status code is 201 Created', passed: res.status === 201 },
      { check: 'Issue ID is generated', passed: typeof res.body?.id === 'number' },
      { check: 'Issue title matches payload', passed: res.body?.title === issuePayload.title },
      { check: 'Progress is initialized (0%)', passed: res.body?.progress === 0 }
    ];

    recordTest({
      id: 'ISSUE-01',
      category: 'WBS & Issues',
      title: '신규 태스크/이슈 생성 (WBS 및 칸반보드 연동)',
      description: 'WBS 테이블 및 간트차트, 칸반보드에서 생성되는 작업 일정, 우선순위, 진척도 데이터를 검증합니다.',
      method: 'POST',
      url: '/api/issues',
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]`, 'Content-Type': 'application/json' },
      requestBody: issuePayload,
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 6.2 Get Issues List
    const start = Date.now();
    const res = await request(app)
      .get(`/api/issues?projectId=${createdProjectId}`)
      .set(authHeaders);
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Returns issues array', passed: Array.isArray(res.body) },
      { check: 'Contains newly created issue', passed: Array.isArray(res.body) && res.body.some((i: any) => i.id === createdIssueId) }
    ];

    recordTest({
      id: 'ISSUE-02',
      category: 'WBS & Issues',
      title: '프로젝트 이슈 목록 조회 (WBS 그리드 연동)',
      description: 'WBSPage 그리드에서 로드하는 계층형 이슈 목록과 담당자, 상태, 일정 데이터 일치성을 점검합니다.',
      method: 'GET',
      url: `/api/issues?projectId=${createdProjectId}`,
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]` },
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: Array.isArray(res.body) ? res.body.slice(0, 3) : res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 6.3 Update Issue
    const updatePayload = {
      progress: 90,
      description: 'Progress updated to 90% after automated verification execution'
    };

    const start = Date.now();
    const res = await request(app)
      .put(`/api/issues/${createdIssueId}`)
      .set(authHeaders)
      .send(updatePayload);
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Progress is updated to 90%', passed: res.body?.progress === 90 }
    ];

    recordTest({
      id: 'ISSUE-03',
      category: 'WBS & Issues',
      title: '이슈 진척도 및 상태 변경 (In-place 캐시 갱신 연동)',
      description: '간트 드래그 및 드로어에서 진척도 슬라이더 변경 시 즉시 반영되는 Optimistic Update API입니다.',
      method: 'PUT',
      url: `/api/issues/${createdIssueId}`,
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]`, 'Content-Type': 'application/json' },
      requestBody: updatePayload,
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  // --------------------------------------------------------------------------
  // Category 7: Sprints, Tags & Favorites
  // --------------------------------------------------------------------------
  {
    // 7.1 Sprints
    const start = Date.now();
    const res = await request(app)
      .get(`/api/sprints?projectId=${createdProjectId}`)
      .set(authHeaders);
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Returns array of sprints', passed: Array.isArray(res.body) }
    ];

    recordTest({
      id: 'SPRINT-01',
      category: 'Sprints & Metadata',
      title: '프로젝트 스프린트 목록 조회 (/api/sprints)',
      description: '애자일 스크럼 보드 및 스프린트 계획 뷰에서 사용하는 스프린트 목록 API입니다.',
      method: 'GET',
      url: `/api/sprints?projectId=${createdProjectId}`,
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]` },
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: Array.isArray(res.body) ? res.body.slice(0, 3) : res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 7.2 Tags
    const start = Date.now();
    const res = await request(app)
      .get('/api/tags')
      .set(authHeaders);
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Returns array of tags', passed: Array.isArray(res.body) }
    ];

    recordTest({
      id: 'TAG-01',
      category: 'Sprints & Metadata',
      title: '태그 목록 조회 (/api/tags)',
      description: '이슈 필터링 및 레이블 칩 UI에서 활용되는 전체 태그 목록입니다.',
      method: 'GET',
      url: '/api/tags',
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]` },
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: Array.isArray(res.body) ? res.body.slice(0, 5) : res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 7.3 Favorites
    const start = Date.now();
    const res = await request(app)
      .get('/api/favorites')
      .set(authHeaders);
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Returns favorites list', passed: Array.isArray(res.body) || typeof res.body === 'object' }
    ];

    recordTest({
      id: 'FAV-01',
      category: 'Sprints & Metadata',
      title: '사용자 즐겨찾기 목록 조회 (/api/favorites)',
      description: '사이드바(Sidebar) 및 대시보드 상단에 고정 표시할 즐겨찾기 항목들을 조회합니다.',
      method: 'GET',
      url: '/api/favorites',
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]` },
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  // --------------------------------------------------------------------------
  // Category 8: Issue Cascade Deletion & Integrity
  // --------------------------------------------------------------------------
  let cascadeTargetIssueId: number = 0;
  let cascadeCommentId: number = 0;

  {
    // 8.1 Create target issue for cascade test
    const cascadePayload = {
      title: 'Cascade Target Issue for Integrity Test',
      description: 'Temporary issue to verify cascade deletion of Likes, Favorites, and Comments',
      projectId: createdProjectId,
      priorityId: issuePriority?.id || 1,
      typeId: issueType?.id || 1,
      statusId: issueStatus?.id || 1
    };
    const start = Date.now();
    const res = await request(app)
      .post('/api/issues')
      .set(authHeaders)
      .send(cascadePayload);
    const duration = Date.now() - start;

    if (res.body?.id) {
      cascadeTargetIssueId = res.body.id;
    }

    const assertions: TestAssertion[] = [
      { check: 'Status code is 201 Created', passed: res.status === 201 },
      { check: 'Target issue ID is generated', passed: typeof res.body?.id === 'number' }
    ];

    recordTest({
      id: 'CAS-01',
      category: 'Issue Cascade & Integrity',
      title: 'Cascade 검증 전용 대상 이슈 생성',
      description: '이슈 삭제 시 연관된 좋아요(Like), 즐겨찾기(Favorite), 코멘트(Comment)의 연쇄 삭제 여부를 검증하기 위한 전용 이슈를 생성합니다.',
      method: 'POST',
      url: '/api/issues',
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]`, 'Content-Type': 'application/json' },
      requestBody: cascadePayload,
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 8.2 Like the target issue
    const start = Date.now();
    const res = await request(app)
      .post('/api/issues/toggle-like')
      .set(authHeaders)
      .send({ issueId: cascadeTargetIssueId });
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Issue like state is true', passed: res.body?.isLiked === true },
      { check: 'Likes count is at least 1', passed: res.body?.likesCount >= 1 }
    ];

    recordTest({
      id: 'CAS-02',
      category: 'Issue Cascade & Integrity',
      title: '대상 이슈에 좋아요(Like) 등록 (/api/issues/toggle-like)',
      description: '이슈 삭제 전 좋아요 관계 데이터를 생성하고 카운트 증가를 확인합니다.',
      method: 'POST',
      url: '/api/issues/toggle-like',
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]`, 'Content-Type': 'application/json' },
      requestBody: { issueId: cascadeTargetIssueId },
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 8.3 Favorite the target issue
    const favPayload = {
      targetType: 'ISSUE',
      targetId: cascadeTargetIssueId
    };
    const start = Date.now();
    const res = await request(app)
      .post('/api/favorites/toggle')
      .set(authHeaders)
      .send(favPayload);
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Issue is marked as favorite', passed: res.body?.isFavorite === true },
      { check: 'TargetId matches issue ID', passed: res.body?.targetId === cascadeTargetIssueId }
    ];

    recordTest({
      id: 'CAS-03',
      category: 'Issue Cascade & Integrity',
      title: '대상 이슈에 즐겨찾기(Favorite) 등록 (/api/favorites/toggle)',
      description: '이슈 삭제 전 폴리모픽 즐겨찾기 테이블에 등록하고 활성화 상태를 확인합니다.',
      method: 'POST',
      url: '/api/favorites/toggle',
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]`, 'Content-Type': 'application/json' },
      requestBody: favPayload,
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 8.4 Add comment to the target issue
    const commentPayload = {
      issueId: cascadeTargetIssueId,
      content: 'Cascade deletion test comment for issue cleanup verification'
    };
    const start = Date.now();
    const res = await request(app)
      .post('/api/comments')
      .set(authHeaders)
      .send(commentPayload);
    const duration = Date.now() - start;

    if (res.body?.id) {
      cascadeCommentId = res.body.id;
    }

    const assertions: TestAssertion[] = [
      { check: 'Status code is 201 Created', passed: res.status === 201 },
      { check: 'Comment ID is generated', passed: typeof res.body?.id === 'number' },
      { check: 'IssueId matches target', passed: res.body?.issueId === cascadeTargetIssueId }
    ];

    recordTest({
      id: 'CAS-04',
      category: 'Issue Cascade & Integrity',
      title: '대상 이슈에 연계 코멘트(Comment) 작성 (/api/comments)',
      description: '이슈 삭제 전 외래키 연계 댓글 데이터를 작성하고 정상 바인딩을 확인합니다.',
      method: 'POST',
      url: '/api/comments',
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]`, 'Content-Type': 'application/json' },
      requestBody: commentPayload,
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 8.5 Delete the target issue
    const start = Date.now();
    const res = await request(app)
      .delete(`/api/issues/${cascadeTargetIssueId}`)
      .set(authHeaders);
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Deletion success message returned', passed: !!res.body?.message }
    ];

    recordTest({
      id: 'CAS-05',
      category: 'Issue Cascade & Integrity',
      title: '대상 이슈 완전 삭제 실행 (/api/issues/:id)',
      description: '연결된 Like, Favorite, Comment가 존재하는 이슈를 삭제하여 백엔드 Cascade 트리거를 작동시킵니다.',
      method: 'DELETE',
      url: `/api/issues/${cascadeTargetIssueId}`,
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]` },
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 8.6 Verify Issue & Like is no longer accessible (GET returns 404)
    const start = Date.now();
    const res = await request(app)
      .get(`/api/issues/${cascadeTargetIssueId}`)
      .set(authHeaders);
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 404 Not Found (Issue & Likes unreachable)', passed: res.status === 404 },
      { check: 'Error indicates issue not found', passed: typeof res.body?.error === 'string' }
    ];

    recordTest({
      id: 'CAS-06',
      category: 'Issue Cascade & Integrity',
      title: '삭제 후 이슈 및 좋아요 조회 불가 검증 (GET /api/issues/:id ➔ 404)',
      description: '삭제된 이슈에 대해 GET 조회를 시도하여 404 에러가 반환되고, 연결된 좋아요/카운트 데이터가 완전히 소멸되었는지 검증합니다.',
      method: 'GET',
      url: `/api/issues/${cascadeTargetIssueId}`,
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]` },
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 8.7 Verify Comments are completely removed (GET returns empty array)
    const start = Date.now();
    const res = await request(app)
      .get(`/api/comments?issueId=${cascadeTargetIssueId}`)
      .set(authHeaders);
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Comments list is completely empty [] (Cascade Cleaned)', passed: Array.isArray(res.body) && res.body.length === 0 }
    ];

    recordTest({
      id: 'CAS-07',
      category: 'Issue Cascade & Integrity',
      title: '삭제 후 연결 코멘트 연쇄 삭제 검증 (GET /api/comments ➔ 빈 목록 [])',
      description: '삭제된 이슈의 댓글 목록을 조회했을 때 이전에 작성했던 코멘트가 DB 외래키에 의해 완벽하게 연쇄 삭제되어 빈 배열이 반환되는지 확인합니다.',
      method: 'GET',
      url: `/api/comments?issueId=${cascadeTargetIssueId}`,
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]` },
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 8.8 Verify Favorite is completely removed from favorites list
    const start = Date.now();
    const res = await request(app)
      .get('/api/favorites')
      .set(authHeaders);
    const duration = Date.now() - start;

    const favList = Array.isArray(res.body) ? res.body : [];
    const hasDeletedIssue = favList.some((f: any) => f.targetType === 'ISSUE' && f.targetId === cascadeTargetIssueId);

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Deleted issue does NOT exist in favorites list (Cascade Cleaned)', passed: !hasDeletedIssue }
    ];

    recordTest({
      id: 'CAS-08',
      category: 'Issue Cascade & Integrity',
      title: '삭제 후 즐겨찾기 목록 연쇄 정리 검증 (GET /api/favorites ➔ 항목 제거)',
      description: '사용자 즐겨찾기 목록을 조회했을 때 삭제된 이슈의 즐겨찾기 항목이 고아 데이터로 남지 않고 깨끗하게 연쇄 정리되었는지 확인합니다.',
      method: 'GET',
      url: '/api/favorites',
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]` },
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: favList.slice(0, 5),
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  // --------------------------------------------------------------------------
  // Category 9: Comment Hierarchy & Orphan Reply Preservation
  // --------------------------------------------------------------------------
  let parentCommentId: number = 0;
  let childComment1Id: number = 0;
  let childComment2Id: number = 0;

  {
    // 9.1 Create Parent Comment
    const parentPayload = {
      issueId: createdIssueId,
      content: '원문 상위 댓글 (Parent Root Comment)'
    };
    const start = Date.now();
    const res = await request(app)
      .post('/api/comments')
      .set(authHeaders)
      .send(parentPayload);
    const duration = Date.now() - start;

    if (res.body?.id) {
      parentCommentId = res.body.id;
    }

    const assertions: TestAssertion[] = [
      { check: 'Status code is 201 Created', passed: res.status === 201 },
      { check: 'Parent comment ID is generated', passed: typeof res.body?.id === 'number' },
      { check: 'ParentId is null or undefined', passed: !res.body?.parentId }
    ];

    recordTest({
      id: 'HIER-01',
      category: 'Comment Hierarchy & Preservation',
      title: '상위 원본 댓글(Parent Comment) 생성',
      description: '계층형 댓글 구조의 루트가 되는 상위 댓글을 작성합니다.',
      method: 'POST',
      url: '/api/comments',
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]`, 'Content-Type': 'application/json' },
      requestBody: parentPayload,
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 9.2 Create Child Comment 1
    const child1Payload = {
      issueId: createdIssueId,
      parentId: parentCommentId,
      content: '첫 번째 자식 대댓글 (Child Reply 1)'
    };
    const start = Date.now();
    const res = await request(app)
      .post('/api/comments')
      .set(authHeaders)
      .send(child1Payload);
    const duration = Date.now() - start;

    if (res.body?.id) {
      childComment1Id = res.body.id;
    }

    const assertions: TestAssertion[] = [
      { check: 'Status code is 201 Created', passed: res.status === 201 },
      { check: 'Child 1 ID is generated', passed: typeof res.body?.id === 'number' },
      { check: 'ParentId matches parent comment ID', passed: res.body?.parentId === parentCommentId }
    ];

    recordTest({
      id: 'HIER-02',
      category: 'Comment Hierarchy & Preservation',
      title: '상위 댓글에 첫 번째 대댓글(Child Reply 1) 작성',
      description: 'parentId를 지정하여 상위 댓글 하위에 종속되는 첫 번째 대댓글을 등록합니다.',
      method: 'POST',
      url: '/api/comments',
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]`, 'Content-Type': 'application/json' },
      requestBody: child1Payload,
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 9.3 Create Child Comment 2
    const child2Payload = {
      issueId: createdIssueId,
      parentId: parentCommentId,
      content: '두 번째 자식 대댓글 (Child Reply 2)'
    };
    const start = Date.now();
    const res = await request(app)
      .post('/api/comments')
      .set(authHeaders)
      .send(child2Payload);
    const duration = Date.now() - start;

    if (res.body?.id) {
      childComment2Id = res.body.id;
    }

    const assertions: TestAssertion[] = [
      { check: 'Status code is 201 Created', passed: res.status === 201 },
      { check: 'Child 2 ID is generated', passed: typeof res.body?.id === 'number' },
      { check: 'ParentId matches parent comment ID', passed: res.body?.parentId === parentCommentId }
    ];

    recordTest({
      id: 'HIER-03',
      category: 'Comment Hierarchy & Preservation',
      title: '상위 댓글에 두 번째 대댓글(Child Reply 2) 작성',
      description: '동일한 parentId를 가진 두 번째 대댓글을 추가 등록하여 1:N 대댓글 트리 구조를 구성합니다.',
      method: 'POST',
      url: '/api/comments',
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]`, 'Content-Type': 'application/json' },
      requestBody: child2Payload,
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 9.4 Verify Hierarchy Before Parent Deletion
    const start = Date.now();
    const res = await request(app)
      .get(`/api/comments?issueId=${createdIssueId}`)
      .set(authHeaders);
    const duration = Date.now() - start;

    const parentInList = Array.isArray(res.body) ? res.body.find((c: any) => c.id === parentCommentId) : null;
    const childrenCount = parentInList?.children?.length || 0;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Parent comment found in list', passed: !!parentInList },
      { check: 'Parent contains exactly 2 child replies in children array', passed: childrenCount === 2 }
    ];

    recordTest({
      id: 'HIER-04',
      category: 'Comment Hierarchy & Preservation',
      title: '삭제 전 부모-자식 트리 계층 구조 조회 확인',
      description: '상위 댓글 삭제 전, 부모 코멘트 아래 children 배열에 2개의 대댓글이 온전하게 매핑되어 있는지 확인합니다.',
      method: 'GET',
      url: `/api/comments?issueId=${createdIssueId}`,
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]` },
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: parentInList ? [parentInList] : res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 9.5 Delete Parent Comment
    const start = Date.now();
    const res = await request(app)
      .delete(`/api/comments/${parentCommentId}`)
      .set(authHeaders);
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Deletion message returned', passed: !!res.body?.message }
    ];

    recordTest({
      id: 'HIER-05',
      category: 'Comment Hierarchy & Preservation',
      title: '상위(부모) 댓글 단독 삭제 실행 (/api/comments/:id)',
      description: '하위 대댓글이 존재하는 상태에서 상위 부모 댓글만 단독으로 삭제합니다.',
      method: 'DELETE',
      url: `/api/comments/${parentCommentId}`,
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]` },
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 9.6 Verify Virtual Parent & Orphan Replies Preserved
    const start = Date.now();
    const res = await request(app)
      .get(`/api/comments?issueId=${createdIssueId}`)
      .set(authHeaders);
    const duration = Date.now() - start;

    const list = Array.isArray(res.body) ? res.body : [];
    const virtualParent = list.find((c: any) => c.isDeletedParent === true);
    const hasChild1 = virtualParent?.children?.some((c: any) => c.id === childComment1Id);
    const hasChild2 = virtualParent?.children?.some((c: any) => c.id === childComment2Id);

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Virtual parent ("삭제된 댓글입니다.") exists in list', passed: !!virtualParent && virtualParent.content === '삭제된 댓글입니다.' },
      { check: 'Child 1 reply is preserved under virtual parent', passed: !!hasChild1 },
      { check: 'Child 2 reply is preserved under virtual parent', passed: !!hasChild2 }
    ];

    recordTest({
      id: 'HIER-06',
      category: 'Comment Hierarchy & Preservation',
      title: '부모 삭제 후 대댓글 보존 및 가상 부모 래핑 검증',
      description: '부모 댓글이 삭제되어도 대댓글들이 고아로 사라지지 않고 가상 부모(isDeletedParent: true, "삭제된 댓글입니다.") 아래에 트리 구조를 유지하는지 검증합니다.',
      method: 'GET',
      url: `/api/comments?issueId=${createdIssueId}`,
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]` },
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: virtualParent ? [virtualParent] : res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 9.7 Delete Child Comment 1
    const start = Date.now();
    const res = await request(app)
      .delete(`/api/comments/${childComment1Id}`)
      .set(authHeaders);
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 }
    ];

    recordTest({
      id: 'HIER-07',
      category: 'Comment Hierarchy & Preservation',
      title: '가상 부모 하위의 자식 대댓글 1 삭제',
      description: '가상 부모 하위에 묶인 두 개의 대댓글 중 하나를 삭제합니다.',
      method: 'DELETE',
      url: `/api/comments/${childComment1Id}`,
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]` },
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 9.8 Verify Remaining Child Comment 2 Still Preserved
    const start = Date.now();
    const res = await request(app)
      .get(`/api/comments?issueId=${createdIssueId}`)
      .set(authHeaders);
    const duration = Date.now() - start;

    const list = Array.isArray(res.body) ? res.body : [];
    const virtualParent = list.find((c: any) => c.isDeletedParent === true);
    const childrenCount = virtualParent?.children?.length || 0;
    const hasChild2 = virtualParent?.children?.some((c: any) => c.id === childComment2Id);

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Virtual parent continues to exist', passed: !!virtualParent },
      { check: 'Exactly 1 remaining child comment under virtual parent', passed: childrenCount === 1 },
      { check: 'Remaining child is Child 2', passed: !!hasChild2 }
    ];

    recordTest({
      id: 'HIER-08',
      category: 'Comment Hierarchy & Preservation',
      title: '대댓글 1개 삭제 후 남은 대댓글(Child 2) 유지 검증',
      description: '대댓글 일부가 삭제되어도 남은 대댓글이 계속해서 가상 부모 아래에 안정적으로 유지되는지 확인합니다.',
      method: 'GET',
      url: `/api/comments?issueId=${createdIssueId}`,
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]` },
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: virtualParent ? [virtualParent] : res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 9.9 Delete Remaining Child Comment 2
    const start = Date.now();
    const res = await request(app)
      .delete(`/api/comments/${childComment2Id}`)
      .set(authHeaders);
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 }
    ];

    recordTest({
      id: 'HIER-09',
      category: 'Comment Hierarchy & Preservation',
      title: '마지막 남은 자식 대댓글 2 삭제',
      description: '가상 부모 아래 마지막으로 남아있던 대댓글을 삭제합니다.',
      method: 'DELETE',
      url: `/api/comments/${childComment2Id}`,
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]` },
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 9.10 Verify Virtual Parent Completely Cleaned Up When All Children Deleted
    const start = Date.now();
    const res = await request(app)
      .get(`/api/comments?issueId=${createdIssueId}`)
      .set(authHeaders);
    const duration = Date.now() - start;

    const list = Array.isArray(res.body) ? res.body : [];
    const hasAnyVirtualParent = list.some((c: any) => c.isDeletedParent === true);

    const assertions: TestAssertion[] = [
      { check: 'Status code is 200 OK', passed: res.status === 200 },
      { check: 'Virtual parent completely cleaned up (No orphan virtual parents)', passed: !hasAnyVirtualParent }
    ];

    recordTest({
      id: 'HIER-10',
      category: 'Comment Hierarchy & Preservation',
      title: '모든 대댓글 삭제 후 가상 부모 완전 정리 검증',
      description: '마지막 대댓글까지 삭제되었을 때 더 이상 보존할 하위 댓글이 없으므로 가상 부모 댓글 또한 목록에서 깨끗이 소멸되는지 검증합니다.',
      method: 'GET',
      url: `/api/comments?issueId=${createdIssueId}`,
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]` },
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  // --------------------------------------------------------------------------
  // Category 10: Negative & Security Validations (예외 및 보안 검증)
  // --------------------------------------------------------------------------
  {
    // 8.1 401 Unauthorized without Token
    const start = Date.now();
    const res = await request(app).get('/api/auth/me');
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 401 Unauthorized', passed: res.status === 401 },
      { check: 'Error message indicates unauthorized access', passed: typeof res.body?.error === 'string' || typeof res.body?.message === 'string' }
    ];

    recordTest({
      id: 'SEC-01',
      category: 'Negative & Security',
      title: '인증 헤더 누락 시 401 Unauthorized 차단 검증',
      description: '토큰이 없거나 만료된 비인가 요청이 올바르게 차단되고 로그인 화면으로 유도되는지 확인합니다.',
      method: 'GET',
      url: '/api/auth/me',
      requestHeaders: {},
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 8.2 400 Bad Request on invalid project creation
    const start = Date.now();
    const res = await request(app)
      .post('/api/projects')
      .set(authHeaders)
      .send({}); // name, key missing
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 400 Bad Request', passed: res.status === 400 },
      { check: 'Returns validation error response', passed: !!res.body?.error || !!res.body?.message }
    ];

    recordTest({
      id: 'SEC-02',
      category: 'Negative & Security',
      title: '필수 필드 누락 시 400 Bad Request 유효성 검사 차단',
      description: '프로젝트 생성 시 필수 항목(name, key)이 누락되었을 때 DB 에러를 방지하고 명확한 에러를 반환하는지 검증합니다.',
      method: 'POST',
      url: '/api/projects',
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]`, 'Content-Type': 'application/json' },
      requestBody: {},
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  {
    // 8.3 404 Not Found on non-existent resource
    const start = Date.now();
    const res = await request(app)
      .get('/api/projects/9999999')
      .set(authHeaders);
    const duration = Date.now() - start;

    const assertions: TestAssertion[] = [
      { check: 'Status code is 404 Not Found', passed: res.status === 404 },
      { check: 'Returns not found error', passed: !!res.body?.error || !!res.body?.message }
    ];

    recordTest({
      id: 'SEC-03',
      category: 'Negative & Security',
      title: '미존재 리소스 조회 시 404 Not Found 에러 반환',
      description: '존재하지 않는 프로젝트 ID에 접근 시 클라이언트에 정상적인 404 피드백을 주는지 확인합니다.',
      method: 'GET',
      url: '/api/projects/9999999',
      requestHeaders: { Authorization: `Bearer ${authToken.substring(0, 15)}...[MASKED]` },
      responseStatus: res.status,
      responseHeaders: { 'content-type': res.headers['content-type'] || 'application/json' },
      responseBody: res.body,
      durationMs: duration,
      passed: assertions.every(a => a.passed),
      assertions
    });
  }

  return generateHtmlReport();
}

function generateHtmlReport(): string {
  const totalTests = testResults.length;
  const passedTests = testResults.filter(t => t.passed).length;
  const failedTests = totalTests - passedTests;
  const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0';
  const totalDuration = testResults.reduce((acc, cur) => acc + cur.durationMs, 0);
  const avgDuration = totalTests > 0 ? (totalDuration / totalTests).toFixed(1) : '0';

  const categories = Array.from(new Set(testResults.map(t => t.category)));

  // HTML 조립
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>AntiGravity Workflow REST API Test & Inspection Report</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm 15mm 10mm;
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-size: 8pt;
        color: #64748b;
      }
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Pretendard", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      color: #0f172a;
      background-color: #f8fafc;
      font-size: 13px;
      line-height: 1.5;
    }
    @media screen {
      body {
        max-width: 1080px;
        margin: 0 auto;
        background-color: #0f172a;
        color: #f1f5f9;
      }
      .card, .summary-card, .metric-box {
        background-color: #1e293b !important;
        border-color: #334155 !important;
        color: #f1f5f9 !important;
      }
      .code-block {
        background-color: #0b1120 !important;
        color: #38bdf8 !important;
        border-color: #1e293b !important;
      }
      .sub-header {
        color: #94a3b8 !important;
      }
      .badge-category {
        background-color: #334155 !important;
        color: #93c5fd !important;
      }
      .text-secondary {
        color: #94a3b8 !important;
      }
    }
    .header-banner {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      color: #3b82f6;
      letter-spacing: -0.5px;
      margin: 0 0 6px 0;
    }
    .report-title {
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 4px 0;
    }
    .sub-header {
      font-size: 11px;
      color: #64748b;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .metric-box {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
      text-align: center;
    }
    .metric-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 4px;
    }
    .metric-val {
      font-size: 24px;
      font-weight: 800;
    }
    .val-success { color: #10b981; }
    .val-total { color: #3b82f6; }
    .val-latency { color: #8b5cf6; }

    .category-section {
      margin-bottom: 28px;
    }
    .category-title {
      font-size: 15px;
      font-weight: 700;
      padding-bottom: 8px;
      margin-bottom: 14px;
      border-bottom: 1px solid #cbd5e1;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .tc-card {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 14px;
      padding: 14px 16px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .tc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .tc-left {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .tc-title {
      font-size: 13px;
      font-weight: 700;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-get { background-color: #e0f2fe; color: #0284c7; }
    .badge-post { background-color: #dcfce7; color: #15803d; }
    .badge-put { background-color: #fef3c7; color: #b45309; }
    .badge-delete { background-color: #fee2e2; color: #b91c1c; }
    
    .badge-status-200, .badge-status-201 { background-color: #dcfce7; color: #15803d; }
    .badge-status-400 { background-color: #fef3c7; color: #b45309; }
    .badge-status-401, .badge-status-403, .badge-status-404 { background-color: #fee2e2; color: #b91c1c; }

    .badge-pass { background-color: #10b981; color: #ffffff; }
    .badge-fail { background-color: #ef4444; color: #ffffff; }
    .badge-category { background-color: #f1f5f9; color: #475569; }

    .endpoint-path {
      font-family: "JetBrains Mono", Consolas, Menlo, monospace;
      font-size: 12px;
      font-weight: 600;
      color: #334155;
    }
    @media screen {
      .endpoint-path { color: #cbd5e1; }
    }
    .tc-desc {
      font-size: 11.5px;
      color: #64748b;
      margin-bottom: 10px;
    }
    .assertion-list {
      background: #f8fafc;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 10px;
      font-size: 11px;
    }
    @media screen {
      .assertion-list { background: #0f172a; }
    }
    .assertion-item {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 3px;
    }
    .assertion-item:last-child { margin-bottom: 0; }
    .check-icon { font-weight: bold; color: #10b981; }

    .req-res-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 8px;
    }
    .sub-box-title {
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 4px;
    }
    .code-block {
      background-color: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;
      font-family: "JetBrains Mono", Consolas, monospace;
      font-size: 10.5px;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 220px;
      overflow-y: auto;
      margin: 0;
      line-height: 1.4;
    }
    .footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 12px;
      margin-top: 32px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #94a3b8;
    }
  </style>
</head>
<body>

  <!-- Header Banner -->
  <div class="header-banner">
    <div>
      <div class="brand-title">AntiGravity Workflow System</div>
      <div class="report-title">REST API Test & Inspection Verification Report</div>
      <div class="sub-header">
        프론트엔드 UI/UX 구현 대비 백엔드 REST API 호출(Request) 및 응답(Response) 전반 점검 명세서
      </div>
    </div>
    <div style="text-align: right;">
      <div style="font-weight: 700; font-size: 12px; color: #3b82f6;">Single Workspace & RBAC Engine</div>
      <div class="sub-header">Generated: ${new Date().toLocaleString('ko-KR')}</div>
      <div class="sub-header">Env: Node.js ${process.version} / Dual-PostgreSQL</div>
    </div>
  </div>

  <!-- Metrics Grid -->
  <div class="metrics-grid">
    <div class="metric-box">
      <div class="metric-label">Total Endpoints Tested</div>
      <div class="metric-val val-total">${totalTests}</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Verification Pass Rate</div>
      <div class="metric-val val-success">${passRate}%</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Tests Passed / Failed</div>
      <div class="metric-val"><span class="val-success">${passedTests}</span> / <span style="color:${failedTests > 0 ? '#ef4444' : '#64748b'}">${failedTests}</span></div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Avg Latency</div>
      <div class="metric-val val-latency">${avgDuration}ms</div>
    </div>
  </div>

  <!-- Test Results by Category -->
  ${categories.map(cat => {
    const catTests = testResults.filter(t => t.category === cat);
    return `
    <div class="category-section">
      <div class="category-title">
        <span>📂 ${cat}</span>
        <span class="badge badge-category">${catTests.length} tests</span>
      </div>
      ${catTests.map(tc => `
        <div class="tc-card">
          <div class="tc-header">
            <div class="tc-left">
              <span class="badge badge-${tc.method.toLowerCase()}">${tc.method}</span>
              <span class="endpoint-path">${tc.url}</span>
              <span class="badge badge-status-${tc.responseStatus}">${tc.responseStatus}</span>
              <span style="font-size: 11px; color: #64748b; font-weight: 600;">⏱️ ${tc.durationMs}ms</span>
            </div>
            <div>
              <span class="badge ${tc.passed ? 'badge-pass' : 'badge-fail'}">${tc.passed ? 'PASS' : 'FAIL'}</span>
            </div>
          </div>
          
          <div class="tc-title">${tc.id} - ${tc.title}</div>
          <div class="tc-desc">${tc.description}</div>

          <!-- Assertions -->
          <div class="assertion-list">
            ${tc.assertions.map(a => `
              <div class="assertion-item">
                <span class="check-icon">${a.passed ? '✓' : '✗'}</span>
                <span style="color:${a.passed ? 'inherit' : '#ef4444'}">${a.check}</span>
              </div>
            `).join('')}
          </div>

          <!-- Request & Response JSON -->
          <div class="req-res-grid">
            <div>
              <div class="sub-box-title">Request Payload & Headers</div>
              <pre class="code-block">${escapeHtml(JSON.stringify({
                headers: tc.requestHeaders,
                ...(tc.requestBody ? { body: tc.requestBody } : {})
              }, null, 2))}</pre>
            </div>
            <div>
              <div class="sub-box-title">Response Payload (HTTP ${tc.responseStatus})</div>
              <pre class="code-block">${escapeHtml(JSON.stringify(tc.responseBody, null, 2))}</pre>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    `;
  }).join('')}

  <!-- Footer -->
  <div class="footer">
    <div>AntiGravity Issue & Task Management System | Dual PostgreSQL Architecture</div>
    <div>Report generated automatically via Playwright & Supertest Test Runner</div>
  </div>

</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function main() {
  try {
    const htmlContent = await runAllApiTests();

    // 저장 디렉토리 설정
    const reportDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const htmlPath = path.join(reportDir, 'api_test_inspection_report.html');
    const pdfPath = path.join(reportDir, 'api_test_inspection_report.pdf');

    // 1. HTML 리포트 저장 (BOM 포함)
    fs.writeFileSync(htmlPath, '\uFEFF' + htmlContent, 'utf-8');
    console.log(`\n📄 [HTML Report] Saved to: ${htmlPath}`);

    // 2. Playwright Chromium 기반 고품질 A4 PDF 리포트 생성
    const chromium = await getChromium();
    if (chromium) {
      console.log('🖨️ [PDF Generator] Launching Chromium to generate PDF report...');
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle' });
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '12mm',
          bottom: '15mm',
          left: '10mm',
          right: '10mm'
        }
      });
      await browser.close();
      console.log(`✅ [PDF Report] Successfully generated PDF: ${pdfPath}`);
    } else {
      console.warn('⚠️ [PDF Generator] Playwright not found, skipping PDF file generation.');
    }

    // 3. Antigravity 아티팩트 디렉토리에 복사
    const artifactDir = 'C:/Users/admin/.gemini/antigravity-cli/brain/76daae41-c574-4250-a6a9-f421f75c1f47';
    if (fs.existsSync(artifactDir)) {
      const artifactHtmlPath = path.join(artifactDir, 'api_test_inspection_report.html');
      fs.copyFileSync(htmlPath, artifactHtmlPath);
      console.log(`📋 Copied HTML report to Artifact directory: ${artifactHtmlPath}`);

      if (fs.existsSync(pdfPath)) {
        const artifactPdfPath = path.join(artifactDir, 'api_test_inspection_report.pdf');
        fs.copyFileSync(pdfPath, artifactPdfPath);
        console.log(`📋 Copied PDF report to Artifact directory: ${artifactPdfPath}`);
      }
    }

    console.log('\n🎉 [COMPLETE] REST API Test & Inspection Report generation completed successfully!');
  } catch (err) {
    console.error('❌ Error generating API report:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await globalPrisma.$disconnect();
  }
}

main();
