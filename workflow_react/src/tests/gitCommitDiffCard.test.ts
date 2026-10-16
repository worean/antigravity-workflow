import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { GitCommitDiffCard } from '../components/plugins/git/GitCommitDiffCard';
import type { GitCommitFileDiff } from '../api/gitPlugin.types';

describe('🧪 GitCommitDiffCard Unit Tests', () => {
  it('TC-DIFF-01: CRLF가 포함된 patch 텍스트를 정상적으로 분할 및 렌더링해야 한다', () => {
    const file: GitCommitFileDiff = {
      filename: 'src/main.ts',
      status: 'modified',
      additions: 2,
      deletions: 1,
      patch: '@@ -1,3 +1,4 @@\r\n const a = 1;\r\n-const b = 2;\r\n+const b = 3;\r\n+const c = 4;\r\n',
    };

    const html = renderToStaticMarkup(React.createElement(GitCommitDiffCard, { file }));
    expect(html).toContain('src/main.ts');
    expect(html).toContain('const a = 1;');
    expect(html).toContain('const b = 3;');
    expect(html).toContain('+2');
    expect(html).toContain('-1');
  });

  it('TC-DIFF-02: patch가 없는 파일(바이너리 또는 내용 없음)의 경우 안내 메시지를 표시해야 한다', () => {
    const file: GitCommitFileDiff = {
      filename: 'assets/logo.png',
      status: 'added',
      additions: 0,
      deletions: 0,
      patch: undefined,
    };

    const html = renderToStaticMarkup(React.createElement(GitCommitDiffCard, { file }));
    expect(html).toContain('assets/logo.png');
    expect(html).toContain('바이너리 파일이거나 변경 diff 상세 내용이 제공되지 않습니다.');
  });

  it('TC-DIFF-03: fillContainer=true 일 때 flex 및 100% 높이/세로 스크롤 스타일이 정상 적용되어야 한다', () => {
    const file: GitCommitFileDiff = {
      filename: 'src/App.tsx',
      status: 'modified',
      additions: 1,
      deletions: 0,
      patch: '@@ -1,1 +1,2 @@\r\n import React from "react";\r\n+console.log("hello");\r\n',
    };

    const html = renderToStaticMarkup(
      React.createElement(GitCommitDiffCard, { file, fillContainer: true })
    );
    expect(html).toContain('src/App.tsx');
    expect(html).toContain('custom-scrollbar');
    expect(html).toContain('overflow-y:auto');
  });
});
