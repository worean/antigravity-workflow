import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  ChevronDown,
  ChevronRight,
  Search,
  ChevronsUpDown,
} from 'lucide-react';
import type { GitCommitFileDiff } from '@/api/gitPlugin';

export interface FileTreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: FileTreeNode[];
  file?: GitCommitFileDiff;
  fileIndex?: number;
}

interface GitCommitFileTreeProps {
  files: GitCommitFileDiff[];
  selectedFile: string | null;
  onSelectFile: (filename: string) => void;
}

/** 파일 경로 목록을 계층형 트리 노드로 변환 */
function buildFileTree(files: GitCommitFileDiff[]): FileTreeNode {
  const root: FileTreeNode = {
    name: 'root',
    path: '',
    isFolder: true,
    children: [],
  };

  files.forEach((file, fileIndex) => {
    const parts = file.filename.split('/').filter(Boolean);
    let current = root;

    parts.forEach((part, partIndex) => {
      const isFile = partIndex === parts.length - 1;
      const currentPath = parts.slice(0, partIndex + 1).join('/');

      let existing = current.children.find((c) => c.name === part);
      if (!existing) {
        existing = {
          name: part,
          path: currentPath,
          isFolder: !isFile,
          children: [],
          file: isFile ? file : undefined,
          fileIndex: isFile ? fileIndex : undefined,
        };
        current.children.push(existing);
      }
      current = existing;
    });
  });

  // 폴더 우선, 그 후 이름 순 정렬
  const sortNodes = (node: FileTreeNode) => {
    node.children.sort((a, b) => {
      if (a.isFolder !== b.isFolder) {
        return a.isFolder ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    node.children.forEach(sortNodes);
  };

  sortNodes(root);
  return root;
}

export const GitCommitFileTree: React.FC<GitCommitFileTreeProps> = ({
  files,
  selectedFile,
  onSelectFile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedDirs, setCollapsedDirs] = useState<Record<string, boolean>>({});

  const filteredFiles = useMemo(() => {
    if (!searchTerm.trim()) return files;
    const term = searchTerm.toLowerCase();
    return files.filter((f) => f.filename.toLowerCase().includes(term));
  }, [files, searchTerm]);

  const tree = useMemo(() => buildFileTree(filteredFiles), [filteredFiles]);

  const toggleDir = (dirPath: string) => {
    setCollapsedDirs((prev) => ({
      ...prev,
      [dirPath]: !prev[dirPath],
    }));
  };

  const toggleAllDirs = () => {
    const hasCollapsed = Object.values(collapsedDirs).some(Boolean);
    if (hasCollapsed) {
      setCollapsedDirs({});
    } else {
      const all: Record<string, boolean> = {};
      const markAll = (n: FileTreeNode) => {
        if (n.isFolder && n.path) all[n.path] = true;
        n.children.forEach(markAll);
      };
      markAll(tree);
      setCollapsedDirs(all);
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'added':
        return <span style={{ color: 'var(--secondary)', fontWeight: 700, fontSize: '12px' }}>A</span>;
      case 'deleted':
        return <span style={{ color: 'var(--accent-rose)', fontWeight: 700, fontSize: '12px' }}>D</span>;
      case 'renamed':
        return <span style={{ color: 'var(--accent-amber)', fontWeight: 700, fontSize: '12px' }}>R</span>;
      default:
        return <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '12px' }}>M</span>;
    }
  };

  const renderNode = (node: FileTreeNode, depth = 0) => {
    if (node.isFolder) {
      const isCollapsed = Boolean(collapsedDirs[node.path]);
      return (
        <div key={node.path || 'root'} style={{ display: 'flex', flexDirection: 'column' }}>
          {node.path && (
            <div
              onClick={() => toggleDir(node.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 6px',
                paddingLeft: `${depth * 14 + 6}px`,
                cursor: 'pointer',
                borderRadius: 'var(--radius-xs)',
                fontSize: '11.5px',
                color: 'var(--text-sub)',
                userSelect: 'none',
                transition: 'background-color 0.1s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
              {isCollapsed ? (
                <Folder size={13} style={{ color: 'var(--accent-amber)' }} />
              ) : (
                <FolderOpen size={13} style={{ color: 'var(--accent-amber)' }} />
              )}
              <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{node.name}</span>
            </div>
          )}

          {!isCollapsed && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {node.children.map((child) => renderNode(child, node.path ? depth + 1 : depth))}
            </div>
          )}
        </div>
      );
    }

    const isSelected = selectedFile === node.path;
    const file = node.file;

    return (
      <div
        key={node.path}
        onClick={() => onSelectFile(node.path)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          padding: '3px 8px',
          paddingLeft: `${depth * 14 + 6}px`,
          cursor: 'pointer',
          borderRadius: 'var(--radius-xs)',
          backgroundColor: isSelected ? 'var(--bg-card-hover)' : 'transparent',
          borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
          fontSize: '11.5px',
          fontFamily: 'monospace',
          color: isSelected ? 'var(--text-bright)' : 'var(--text-main)',
          transition: 'all 0.1s ease',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', minWidth: 0 }}>
          <FileCode size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: isSelected ? 600 : 400,
            }}
            title={node.path}
          >
            {node.name}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {file && (
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              <span style={{ color: 'var(--secondary)' }}>+{file.additions}</span>{' '}
              <span style={{ color: 'var(--accent-rose)' }}>-{file.deletions}</span>
            </span>
          )}
          {file && getStatusDot(file.status)}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
      }}
    >
      {/* 헤더 & 검색바 */}
      <div
        style={{
          padding: '8px 10px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          backgroundColor: 'var(--bg-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-bright)' }}>
            Files ({files.length})
          </span>
          <button
            type="button"
            onClick={toggleAllDirs}
            title="모든 디렉토리 접기/펼치기"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-sub)',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
            }}
          >
            <ChevronsUpDown size={13} />
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 8px',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xs)',
          }}
        >
          <Search size={12} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="파일 필터..."
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-bright)',
              fontSize: '11px',
              outline: 'none',
              width: '100%',
            }}
          />
        </div>
      </div>

      {/* 트리 목록 스크롤 영역 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 4px' }}>
        {tree.children.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
            일치하는 파일이 없습니다.
          </div>
        ) : (
          tree.children.map((child) => renderNode(child, 0))
        )}
      </div>
    </div>
  );
};
