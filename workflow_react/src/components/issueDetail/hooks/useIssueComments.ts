﻿import { useState } from 'react';
import type { Issue, Comment } from '@/types';
import { getComments, createComment, deleteComment } from '@/services/api';
import { organizeComments } from '@/utils/commentTree';

interface UseIssueCommentsProps {
  issue: Issue | null;
  isAuthenticated: boolean;
  onOpenAuth?: () => void;
  onIssueUpdated?: () => void;
  executeAction: (action: () => Promise<any>, options?: any) => Promise<any>;
}

export const useIssueComments = ({
  issue,
  isAuthenticated,
  onOpenAuth,
  onIssueUpdated,
  executeAction,
}: UseIssueCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState<string>('');

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue || !newComment.trim()) return;

    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    await executeAction(async () => {
      await createComment(issue.id, newComment.trim());
      setNewComment('');
      const refreshed = await getComments(issue.id);
      setComments(organizeComments(refreshed));
      if (onIssueUpdated) onIssueUpdated();
    });
  };

  const handleReplySubmit = async (parentCommentId: number) => {
    if (!issue || !replyContent.trim()) return;

    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    await executeAction(async () => {
      await createComment(issue.id, replyContent.trim(), parentCommentId);
      setReplyTargetId(null);
      setReplyContent('');
      const refreshed = await getComments(issue.id);
      setComments(organizeComments(refreshed));
      if (onIssueUpdated) onIssueUpdated();
    });
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!issue) return;
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    await executeAction(async () => {
      await deleteComment(commentId);
      const refreshed = await getComments(issue.id);
      setComments(organizeComments(refreshed));
      if (onIssueUpdated) onIssueUpdated();
    });
  };

  return {
    comments,
    setComments,
    newComment,
    setNewComment,
    replyTargetId,
    setReplyTargetId,
    replyContent,
    setReplyContent,
    handleAddComment,
    handleReplySubmit,
    handleDeleteComment,
  };
};
