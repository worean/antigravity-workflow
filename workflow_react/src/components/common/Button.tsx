import React from 'react';
import { Loader2 } from 'lucide-react';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'emerald' | 'danger' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  delayMs?: number; // ⏳ 스피너 표시 지연 시간 (기본: 1000ms = 1초)
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  delayMs = 1000,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  className = '',
  style,
  ...props
}) => {
  // 1초 이상 지연될 때만 버튼 내부 스피너 표시 (깜빡임 완전 방지)
  const showSpinner = useDelayedLoading(isLoading, { delayMs, minDisplayMs: 400 });

  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'btn-primary';
      case 'secondary':
        return 'btn-secondary';
      case 'emerald':
        return 'btn-emerald';
      case 'danger':
        return 'btn-danger';
      case 'ghost':
        return 'btn-ghost';
      case 'icon':
        return 'btn-icon';
      default:
        return 'btn-primary';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'btn-sm';
      case 'lg':
        return 'btn-lg';
      case 'md':
      default:
        return '';
    }
  };

  const combinedStyle: React.CSSProperties = {
    ...(fullWidth ? { width: '100%' } : {}),
    ...style,
  };

  return (
    <button
      className={`btn ${getVariantClass()} ${getSizeClass()} ${className}`.trim()}
      disabled={disabled || isLoading}
      style={combinedStyle}
      {...props}
    >
      {showSpinner ? (
        <>
          <Loader2 size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="animate-spin" />
          {children}
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="btn-icon-wrapper">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="btn-icon-wrapper">{icon}</span>}
        </>
      )}
    </button>
  );
};
