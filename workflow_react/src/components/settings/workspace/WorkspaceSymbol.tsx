﻿import React from 'react';

interface WorkspaceSymbolProps {
  iconVal?: string | null;
  size?: number;
}

export const WorkspaceSymbol: React.FC<WorkspaceSymbolProps> = ({ iconVal, size = 32 }) => {
  if (iconVal && (iconVal.startsWith('data:image/') || iconVal.startsWith('http'))) {
    return (
      <img
        src={iconVal}
        alt="Workspace Symbol"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: 'var(--radius-xs)',
          objectFit: 'cover',
          border: '1px solid var(--border-light)',
          display: 'inline-block',
          verticalAlign: 'middle',
        }}
      />
    );
  }
  return (
    <span
      style={{
        fontSize: `${size * 0.62}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        background: 'var(--bg-dark)',
        borderRadius: 'var(--radius-xs)',
        border: '1px solid var(--border-light)',
        lineHeight: 1,
      }}
    >
      {iconVal || '🏢'}
    </span>
  );
};
