// -*- coding: utf-8 -*-
import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, CornerDownRight, RefreshCw, ExternalLink } from 'lucide-react';
import type { SprintDiscussionItem, User } from '@/types';
import { getSprintDiscussions, createComment } from '@/services/api';
import { Avatar, Button, Spinner, StatusBadge, PriorityBadge } from '@/components/common';
import { formatTimeAgo, formatDateTime } from '@/utils/dateUtils';

interface SprintDiscussionsTabProps {
  sprintId: number;
  sprintIssuesCount: number;
  currentUser: User | null;
  isAuthenticated: boolean;
  onOpenIssueDetail?: (issueId: number) => void;
  onOpenAuth?: () => void;
}

export const SprintDiscussionsTab: React.FC<SprintDiscussionsTabProps> = ({
  sprintId,
  sprintIssuesCount,
  isAuthenticated,
  onOpenIssueDetail,
  onOpenAuth,
}) => {
  const [discussions, setDiscussions] = useState<SprintDiscussionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [replyingToIssueId, setReplyingToIssueId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchDiscussions = async () => {
    setLoading(true);
    try {
      const data = await getSprintDiscussions(sprintId);
      setDiscussions(data);
    } catch (err) {
      console.error('Failed to fetch sprint discussions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussions();
  }, [sprintId]);

  const handleSendComment = async (issueId: number) => {
    if (!replyContent.trim()) return;
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setIsSubmitting(true);
    try {
      await createComment(issueId, replyContent.trim());
      setReplyContent('');
      setReplyingToIssueId(null);
      await fetchDiscussions();
    } catch (err: any) {
      console.error('Failed to post comment in sprint discussion:', err);
      alert(err.response?.data?.error || '댓글 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
        <Spinner centered label="스프린트 논의 피드를 불러오는 중..." />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Header & Refresh */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={16} color="var(--primary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
            스프린트 이슈 실시간 논의 스트림 ({discussions.length}건)
          </span>
        </div>
        <Button size="sm" variant="ghost" icon={<RefreshCw size={13} />} onClick={fetchDiscussions}>
          새로고침
        </Button>
      </div>

      {/* Discussion List */}
      {discussions.length === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-xs)',
            border: '1px dashed var(--border-light)',
            color: 'var(--text-muted)',
          }}
        >
          <MessageSquare size={32} style={{ opacity: 0.3, marginBottom: '10px' }} />
          <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '4px' }}>
            아직 스프린트 이슈에 등록된 논의 및 피드백이 없습니다.
          </div>
          <div style={{ fontSize: '0.75rem' }}>
            {sprintIssuesCount > 0
              ? '팀원들과 이슈 진행 상황이나 변경 사항에 대한 의견을 자유롭게 나눠보세요.'
              : '먼저 스프린트에 이슈를 할당해 주세요.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {discussions.map((item) => {
            const author = item.user || item.author;
            const issue = item.issue;
            const isReplyingThis = replyingToIssueId === issue?.id;

            return (
              <div
                key={item.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Related Issue Header */}
                {issue && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(0, 0, 0, 0.2)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: onOpenIssueDetail ? 'pointer' : 'default',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      onClick={() => onOpenIssueDetail && onOpenIssueDetail(issue.id)}
                      title="이슈 상세 보기"
                    >
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        #{issue.issueNumber || issue.id}
                      </span>
                      <span style={{ fontWeight: 500, color: 'var(--text-bright)' }}>
                        {issue.title}
                      </span>
                      {onOpenIssueDetail && <ExternalLink size={11} color="var(--text-muted)" />}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      {issue.priority && <PriorityBadge priority={issue.priority as any} size="sm" />}
                      {issue.status && <StatusBadge status={issue.status as any} size="sm" />}
                    </div>
                  </div>
                )}

                {/* Comment Body */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Avatar user={author || undefined} name={author?.name} size={28} shape="circle" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                        {author?.name || author?.email || '익명 사용자'}
                      </span>
                      <span
                        style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}
                        title={formatDateTime(item.createdAt)}
                      >
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-main)',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {item.content}
                    </div>

                    {/* Action Bar */}
                    {issue && (
                      <div style={{ marginTop: '6px', display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (isReplyingThis) {
                              setReplyingToIssueId(null);
                              setReplyContent('');
                            } else {
                              setReplyingToIssueId(issue.id);
                              setReplyContent('');
                            }
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            fontSize: '0.7rem',
                            color: 'var(--primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <CornerDownRight size={11} />
                          {isReplyingThis ? '답글 취소' : '이 이슈에 답글 달기'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reply Form */}
                {isReplyingThis && issue && (
                  <div
                    style={{
                      marginTop: '4px',
                      paddingLeft: '38px',
                      display: 'flex',
                      gap: '6px',
                    }}
                  >
                    <input
                      type="text"
                      placeholder={`#${issue.id} 이슈에 바로 의견 남기기...`}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendComment(issue.id);
                        }
                      }}
                      style={{
                        flex: 1,
                        background: 'var(--bg-input, #1e1f22)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-xs)',
                        padding: '6px 10px',
                        fontSize: '0.76rem',
                        color: '#fff',
                      }}
                    />
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<Send size={12} />}
                      onClick={() => handleSendComment(issue.id)}
                      disabled={isSubmitting || !replyContent.trim()}
                    >
                      등록
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};