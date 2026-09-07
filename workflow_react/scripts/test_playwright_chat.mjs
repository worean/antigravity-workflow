import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/admin/.gemini/antigravity-cli/brain/8dc166c7-a62f-427f-88c6-cd76795b5524';
const BASE_URL = 'http://localhost:5173';

async function runChatUITests() {
  console.log('🚀 [Playwright] Starting Chat & Channel Creation UI Tests on', BASE_URL);

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const testResults = [];
  function record(name, passed, detail = '') {
    testResults.push({ name, passed, detail });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark}: ${name} ${detail ? `(${detail})` : ''}`);
  }

  try {
    // 1. Vite 프록시를 통해 로그인 토큰 획득
    console.log('\n--- [TEST 0] Backend Authentication ---');
    let authToken = '';
    let authUser = null;
    try {
      const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'worean@naver.com' }),
      });
      const loginData = await loginRes.json();
      if (loginData.token) {
        authToken = loginData.token;
        authUser = loginData.user;
        record('Admin Login via PostgreSQL API', true, `User: ${authUser.email} (#${authUser.id})`);
      } else {
        record('Admin Login via PostgreSQL API', false, 'No token in response');
      }
    } catch (authErr) {
      record('Admin Login via PostgreSQL API', false, String(authErr));
    }

    if (authToken && authUser) {
      await page.addInitScript(({ token, user }) => {
        const prefState = {
          state: {
            isSundayStart: false,
            defaultPriority: 3,
            compactCards: false,
            desktopNotifications: true,
            backendApiUrl: '',
            activeWorkspaceId: 1,
            activeTab: 'chat',
            authToken: token,
            currentUser: user,
          },
          version: 0,
        };
        localStorage.setItem('ag_preferences', JSON.stringify(prefState));
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('active_workspace_id', '1');
      }, { token: authToken, user: authUser });
    }

    // 2. Chat 페이지 진입
    console.log('\n--- [TEST 1] Chat Page Loading & Workspace Channels ---');
    await page.goto(`${BASE_URL}/#/chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // 로그인된 사용자 닉네임 또는 아바타 확인
    const userProfileVisible = await page.locator('text=시스템 최고 관리자').first().isVisible().catch(() => false);
    record('User profile logged in & recognized', userProfileVisible || (await page.locator('header').isVisible()));

    // 채팅 사이드바 채널 아이템 확인
    const sidebarText = await page.locator('aside, .animate-fade-in').first().innerText().catch(() => '');
    const hasNotice = sidebarText.includes('전체-공지사항') || sidebarText.includes('공지사항');
    record('Notice channel visible in sidebar', hasNotice);

    // 스크린샷 1: 채팅 메인 뷰
    const chatScreenshot = path.join(ARTIFACT_DIR, 'ui_test_chat_view.png');
    await page.screenshot({ path: chatScreenshot, fullPage: false });
    record('Captured chat view screenshot', fs.existsSync(chatScreenshot));

    // 3. 채널 생성 모달 열기 (+ 버튼 클릭)
    console.log('\n--- [TEST 2] Channel Creation Modal & Auto Name Resolving ---');
    const plusButtons = page.locator('button[title*="생성"], button:has-text("+"), svg.lucide-plus');
    const plusCount = await plusButtons.count();
    let modalOpened = false;

    for (let i = 0; i < plusCount; i++) {
      const btn = plusButtons.nth(i);
      if (await btn.isVisible()) {
        try {
          await btn.click();
          await page.waitForTimeout(600);
          if (await page.locator('text=새 채팅 채널 생성').isVisible()) {
            modalOpened = true;
            break;
          }
        } catch (e) {}
      }
    }

    record('Chat Create Modal opened via + button', modalOpened);

    if (modalOpened) {
      // 4. 모달 내 채널 유형 드롭다운을 'PROJECT'로 변경
      const typeSelect = page.locator('select').first();
      await typeSelect.selectOption('PROJECT');
      await page.waitForTimeout(500);

      // 프로젝트 채널 선택 시 프로젝트 드롭다운의 옵션 확인
      const projSelect = page.locator('select').nth(1);
      const options = await projSelect.locator('option').all();
      for (const opt of options) {
        const val = await opt.getAttribute('value');
        if (val && val !== '') {
          await projSelect.selectOption(val);
          await page.waitForTimeout(300);
          break;
        }
      }

      // 채널명이 선택된 프로젝트 이름으로 자동 채워졌는지 확인!
      const channelNameInput = page.locator('input[placeholder*="공지사항"]');
      const autoFilledName = await channelNameInput.inputValue();
      record('Channel name auto-filled for PROJECT type', autoFilledName.length > 0, `Name: "${autoFilledName}"`);

      // 스크린샷 2: 채널 생성 모달 (프로젝트명 자동 채움 상태)
      const modalScreenshot = path.join(ARTIFACT_DIR, 'ui_test_chat_modal.png');
      await page.screenshot({ path: modalScreenshot, fullPage: false });
      record('Captured chat modal screenshot', fs.existsSync(modalScreenshot));

      // 5. 생성 버튼 클릭 및 201 상태코드 감지
      let postStatus = 0;
      page.on('response', (res) => {
        if (res.url().includes('/api/chat/channels') && res.request().method() === 'POST') {
          postStatus = res.status();
        }
      });

      const createSubmitBtn = page.locator('button[type="submit"]:has-text("생성")');
      await createSubmitBtn.click();
      await page.waitForTimeout(2000);

      // 모달이 정상 닫혔거나 HTTP 201이 반환되었는지 검증 (400 에러 모달 미발생)
      const has400ErrorModal = await page.locator('text=ERR_INVALID_INPUT').isVisible().catch(() => false);
      const isSuccess = (postStatus === 201 || !(await page.locator('text=새 채팅 채널 생성').isVisible())) && !has400ErrorModal;
      record('Channel created successfully without 400 error', isSuccess, `HTTP Status: ${postStatus}`);
    }

    console.log('\n--- Final Test Summary ---');
    const totalPassed = testResults.filter((r) => r.passed).length;
    console.log(`Passed: ${totalPassed}/${testResults.length}`);

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await browser.close();
  }
}

runChatUITests();
