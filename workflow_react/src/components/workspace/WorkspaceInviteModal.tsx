// -*- coding: utf-8 -*-
import React, { useState } from 'react';
import { UserPlus, X, Send } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';

interface WorkspaceInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkspaceInviteModal: React.FC<WorkspaceInviteModalProps> = ({ isOpen, onClose }) => {
  const { currentWorkspace, inviteMember } = useWorkspace();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MEMBER' | 'GUEST'>('MEMBER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !currentWorkspace) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('초대할 사용자의 이메일을 입력해 주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMsg(null);
      await inviteMember({
        email: email.trim(),
        role,
      });
      setSuccessMsg(`'${email}' 님이 '${currentWorkspace.name}' 워크스페이스에 참여되었습니다.`);
      setEmail('');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '멤버 초대에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">동료 초대</h3>
              <p className="text-xs text-slate-400">
                <span className="text-emerald-400 font-medium">{currentWorkspace.name}</span> 워크스페이스에 멤버를 초대합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              {successMsg}
            </div>
          )}

          {/* Email Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              사용자 이메일 <span className="text-rose-400">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-slate-700/70 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-500"
            />
          </div>

          {/* Role Select */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">권한 역할</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-slate-700/70 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="MEMBER">일반 구성원 (MEMBER) - 프로젝트 및 일감 생성/수정 가능</option>
              <option value="ADMIN">관리자 (ADMIN) - 멤버 초대 및 워크스페이스 관리 가능</option>
              <option value="GUEST">게스트 (GUEST) - 읽기 전용 참여</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-800 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? '초대 중...' : '멤버 초대'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
