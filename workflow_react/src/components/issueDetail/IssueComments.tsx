// -*- coding: utf-8 -*-
import React from 'react';
import {
  MessageSquare,
  CornerDownRight,
  Trash2,
  Lock,
} from 'lucide-react';
import type { Comment, User } from '../../types';
import {
  UserBadge,
  Avatar,
  MarkdownViewer,
  MarkdownEditor,
} from '../common';

interface IssueCommentsProps {
  comments: Comment[];
  user: User | null;
  isAuthenticated: boolean;
  newComment: string;
  setNewComment: (comment: string) => void;
  replyTargetId: number | null;
  setReplyTargetId: (id: number | null) => void;
  replyContent: string;
  setReplyContent: (content: string) => void;
  isPending: boolean;
  handleAddComment: (e: React.FormEvent) => Promise<void>;
  handleReplySubmit: (parentId: number) => Promise<void>;
  handleDeleteComment: (commentId: number) => Promise<void>;
  onOpenAuth?: () => void;
}

export const IssueComments: React.FC<IssueCommentsProps> = ({
  comments,
  user,
  isAuthenticated,
  newComment,
  setNewComment,
  replyTargetId,
  setReplyTargetId,
  replyContent,
  setReplyContent,
  isPending,
  handleAddComment,
  handleReplySubmit,
  handleDeleteComment,
  onOpenAuth,
}) => {
  const renderCommentItem = (c: Comment, isReply = false) => {
    const isOwner = user && (user.id === c.authorId || user.id === c.author?.id);
    const isReplying = replyTargetId === c.id;

    return (
      <div
        key={c.id}
        style={{
          marginLeft: isReply ? '24px' : '0',
          marginTop: '6px',
          borderLeft: isReply ? '2px solid var(--accent-cyan)' : 'none',
          paddingLeft: isReply ? '8px' : '0',
        }}
      >
        <div
          style={{
            background: '#252526',
            border: '1px solid #333',
            borderRadius: 'var(--radius-xs)',
            padding: '8px 10px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserBadge user={c.author} currentUserId={user?.id} size="sm" />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {new Date(c.createdAt).toLocaleDateString('ko-KR', {
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isAuthenticated && !isReply && (
                <button
                  type="button"
                  onClick={() => {
                    if (isReplying) {
                      setReplyTargetId(null);
                      setReplyContent('');
                    } else {
                      setReplyTargetId(c.id);
                      setReplyContent('');
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isReplying ? 'var(--primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  <CornerDownRight size={11} /> {isReplying ? '답글 닫기' : '답글'}
                </button>
              )}

              {isAuthenticated && isOwner && (
                <button
                  type="button"
                  onClick={() => handleDeleteComment(c.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="댓글 삭제"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>
            <MarkdownViewer content={c.content} placeholder="" />
          </div>
        </div>

        {/* Inline Reply Editor */}
        {isReplying && (
          <div style={{ marginTop: '4px', marginLeft: '12px' }}>
            <MarkdownEditor
              value={replyContent}
              onChange={setReplyContent}
              placeholder="대댓글을 작성하세요..."
              minHeight="60px"
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', marginTop: '4px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setReplyTargetId(null)}
                style={{ fontSize: '0.7rem', height: '22px', padding: '0 8px' }}
              >
                취소
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleReplySubmit(c.id)}
                disabled={isPending || !replyContent.trim()}
                style={{ fontSize: '0.7rem', height: '22px', padding: '0 8px' }}
              >
                답글 등록
              </button>
            </div>
          </div>
        )}

        {/* Render Child Replies */}
        {c.children && c.children.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {c.children.map((reply: Comment) => renderCommentItem(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="glass-panel" style={{ padding: '12px 14px', marginTop: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <MessageSquare size={15} color="var(--primary)" />
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
          댓글 및 피드백 ({comments.length})
        </span>
      </div>

      {/* Add New Comment */}
      {isAuthenticated ? (
        <form onSubmit={handleAddComment} style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <Avatar user={user} size={28} shape="circle" />
            <div style={{ flex: 1 }}>
              <MarkdownEditor
                value={newComment}
                onChange={setNewComment}
                placeholder="댓글을 작성하세요 (마크다운 지원)"
                minHeight="70px"
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isPending || !newComment.trim()}
                  style={{ fontSize: '0.72rem', height: '24px', padding: '0 10px' }}
                >
                  {isPending ? '등록 중...' : '댓글 등록'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div style={{ background: '#252526', border: '1px dashed #3e3e42', padding: '10px', borderRadius: 'var(--radius-xs)', textAlign: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            댓글을 작성하려면 로그인이 필요합니다.
          </span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onOpenAuth}
            style={{ marginLeft: '8px', fontSize: '0.72rem', height: '22px', padding: '0 8px' }}
          >
            <Lock size={11} /> 로그인
          </button>
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
          작성된 댓글이 없습니다. 첫 번째 의견을 남겨보세요.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {comments.map((c) => renderCommentItem(c, false))}
        </div>
      )}
    </div>
  );
};