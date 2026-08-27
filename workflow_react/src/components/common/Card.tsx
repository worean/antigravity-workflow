import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'glass-hover' | 'solid' | 'gradient';
  padding?: string;
  clickable?: boolean;
  bordered?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'glass',
  padding = '12px',
  clickable = false,

  bordered = true,
  className = '',
  style,
  onClick,
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'glass-hover':
        return 'glass-panel glass-panel-hover';
      case 'solid':
        return 'card-solid';
      case 'gradient':
        return 'card-gradient';
      case 'glass':
      default:
        return 'glass-panel';
    }
  };

  const combinedStyle: React.CSSProperties = {
    padding,
    ...(clickable || onClick ? { cursor: 'pointer' } : {}),
    ...(!bordered ? { border: 'none' } : {}),
    ...style,
  };

  return (
    <div
      className={`${getVariantClass()} ${className}`.trim()}
      style={combinedStyle}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};
