import React, { useState } from 'react';
import { GitFork } from 'lucide-react';
import { useGitConfig } from '@/api/gitPlugin';
import type { IExtension, ProjectExtensionContext } from '@/extensions/types';
import { GitProjectMappingDialog } from './GitProjectMappingDialog';

export const GitProjectActionButton: React.FC<{ project: ProjectExtensionContext['project'] }> = ({ project }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: config } = useGitConfig();

  if (!config?.isEnabled) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title="Git 원격 저장소 연동 관리"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '2px',
          display: 'inline-flex',
          alignItems: 'center',
          transition: 'color 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        <GitFork size={13} />
      </button>

      {isOpen && (
        <div onClick={(e) => e.stopPropagation()}>
          <GitProjectMappingDialog
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            projectId={project.id}
            projectKey={project.key}
            projectName={project.name}
          />
        </div>
      )}
    </>
  );
};

export class GitProjectActionExtension implements IExtension<ProjectExtensionContext> {
  readonly id = 'plugin.git.project.action';
  readonly point = 'project.card.action' as const;
  readonly name = 'Git Repository Mapping Action';
  readonly order = 20;

  render(context: ProjectExtensionContext): React.ReactNode {
    return <GitProjectActionButton project={context.project} />;
  }
}
