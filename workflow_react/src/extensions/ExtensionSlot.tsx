import React, { useSyncExternalStore } from 'react';
import { extensionRegistry } from './ExtensionRegistry';
import type { ExtensionPoint } from './types';

interface ExtensionSlotProps<TContext = any> {
  point: ExtensionPoint;
  context: TContext;
  className?: string;
  style?: React.CSSProperties;
}

export function ExtensionSlot<TContext = any>({
  point,
  context,
  className,
  style,
}: ExtensionSlotProps<TContext>): React.ReactElement | null {
  // 레지스트리 상태 구독
  useSyncExternalStore(
    (onStoreChange) => extensionRegistry.subscribe(onStoreChange),
    () => extensionRegistry.getExtensions(point, context).length
  );

  const extensions = extensionRegistry.getExtensions<TContext>(point, context);

  if (!extensions || extensions.length === 0) {
    return null;
  }

  return (
    <div className={className} style={{ display: 'contents', ...style }}>
      {extensions.map((ext) => (
        <React.Fragment key={ext.id}>
          {ext.render(context)}
        </React.Fragment>
      ))}
    </div>
  );
}
