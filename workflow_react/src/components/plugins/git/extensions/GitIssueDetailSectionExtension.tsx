import React from 'react';
import { useGitConfig } from '@/api/gitPlugin';
import { IssueGitSection } from '../IssueGitSection';
import type { IExtension, IssueExtensionContext } from '@/extensions/types';

export const GitIssueDetailSectionWrapper: React.FC<{ issue: IssueExtensionContext['issue'] }> = ({ issue }) => {
  const { data: config } = useGitConfig();

  if (!config?.isEnabled) {
    return null;
  }

  return (
    <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-divider)', paddingTop: '16px' }}>
      <IssueGitSection
        issueId={issue.id}
        issueNumber={issue.issueNumber || issue.id}
        issueTitle={issue.title}
      />
    </div>
  );
};

export class GitIssueDetailSectionExtension implements IExtension<IssueExtensionContext> {
  readonly id = 'plugin.git.issue.section';
  readonly point = 'issue.detail.section' as const;
  readonly name = 'Git Integration Issue Section';
  readonly order = 50;

  render(context: IssueExtensionContext): React.ReactNode {
    return <GitIssueDetailSectionWrapper issue={context.issue} />;
  }
}
