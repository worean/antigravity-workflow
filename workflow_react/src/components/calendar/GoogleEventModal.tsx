import React from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, AlignLeft, ExternalLink } from 'lucide-react';
import { ModalWrapper } from '@/components/common/ModalWrapper';
import type { CalendarEvent } from '@/types';

export interface GoogleEventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
}

export const GoogleEventModal: React.FC<GoogleEventModalProps> = ({ event, onClose }) => {
  if (!event) return null;

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <ModalWrapper
      isOpen={!!event}
      onClose={onClose}
      maxWidth="500px"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="google-tag">Google Calendar</span>
          <span style={{ fontSize: '1rem', color: 'var(--text-bright)' }}>일정 상세</span>
        </div>
      }
      icon={<CalendarIcon size={18} color="#4285F4" />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '4px' }}>
        {/* 1. 일정 제목 */}
        <div>
          <h3
            style={{
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--text-bright)',
              lineHeight: 1.4,
              wordBreak: 'break-word',
            }}
          >
            {event.title}
          </h3>
        </div>

        {/* 2. 일정 시간 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontSize: '0.85rem',
            color: 'var(--text-main)',
            background: 'var(--bg-input)',
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)',
          }}
        >
          <Clock size={16} color="#8ab4f8" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div>
              <span style={{ color: 'var(--text-sub)', marginRight: '6px' }}>시작:</span>
              <strong style={{ color: 'var(--text-bright)' }}>{formatDate(event.startDate)}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-sub)', marginRight: '6px' }}>종료:</span>
              <strong style={{ color: 'var(--text-bright)' }}>{formatDate(event.endDate)}</strong>
            </div>
          </div>
        </div>

        {/* 3. 장소 정보 (있는 경우) */}
        {event.location && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.85rem',
              color: 'var(--text-main)',
            }}
          >
            <MapPin size={16} color="#ea4335" style={{ flexShrink: 0 }} />
            <span>{event.location}</span>
          </div>
        )}

        {/* 4. 상세 설명 (있는 경우) */}
        {event.description && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '0.85rem',
              color: 'var(--text-sub)',
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px dashed var(--border-light)',
              whiteSpace: 'pre-wrap',
            }}
          >
            <AlignLeft size={16} color="var(--text-sub)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div style={{ flex: 1, color: 'var(--text-main)' }}>{event.description}</div>
          </div>
        )}

        {/* 5. 안내 메시지 및 구글 캘린더 바로가기 버튼 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-light)',
            marginTop: '8px',
          }}
        >
          {event.htmlLink ? (
            <a
              href={event.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#8ab4f8',
                borderColor: 'rgba(66, 133, 244, 0.4)',
              }}
            >
              <ExternalLink size={14} />
              Google Calendar에서 보기
            </a>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>
              Google Calendar 동기화 일정
            </span>
          )}

          <button type="button" className="btn btn-primary" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};
