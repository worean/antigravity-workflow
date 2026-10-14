import React from 'react';
import { GitBranch } from 'lucide-react';
import { useGitConfig, useRepoMappings } from '@/api/gitPlugin';
import type { IExtension, ProjectExtensionContext } from '@/extensions/types';

export const GitProjectBadge: React.FC<{ project: ProjectExtensionContext['project'] }> = ({ project }) => {
  const { data: config } = useGitConfig();
  const { data: mappings = [] } = useRepoMappings(project.id);

  if (!config?.isEnabled || mappings.length === 0) {
    return null;
  }

  const primaryMapping = mappings[0];

  return (
    <span
      title={`연결된 원격 저장소: ${mappings.map((m) => m.repoIdentifier).join(', ')}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        fontSize: '0.64rem',
        padding: '1px 5px',
        borderRadius: '2px',
        background: 'rgba(59, 130, 246, 0.12)',
        color: 'var(--accent-cyan)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        fontFamily: 'monospace',
      }}
    >
      <GitBranch size={10} />
      <span>{mappings.length === 1 ? primaryMapping.repoIdentifier.split('/')[1] || primaryMapping.repoIdentifier : `Git (${mappings.length})`}</span>
    </span>
  );
};

export class GitProjectBadgeExtension implements IExtension<ProjectExtensionContext> {
  readonly id = 'plugin.git.project.badge';
  readonly point = 'project.card.badge' as const;
  readonly name = 'Git Repository Mapping Badge';
  readonly order = 30;

  render(context: ProjectExtensionContext): React.ReactNode {
    return <GitProjectBadge project={context.project} />;
  }
}
