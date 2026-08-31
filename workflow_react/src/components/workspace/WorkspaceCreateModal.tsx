// -*- coding: utf-8 -*-
import React, { useState } from 'react';
import { Layers, X, Sparkles } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';

interface WorkspaceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_ICONS = ['🚀', '🏢', '⚡', '🌟', '💻', '🎯', '🔥', '🛡️'];

export const WorkspaceCreateModal: React.FC<WorkspaceCreateModalProps> = ({ isOpen, onClose }) => {
  const { createWorkspace } = useWorkspace();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🚀');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('워크스페이스 이름을 입력해 주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await createWorkspace({
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
      });
      setName('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '워크스페이스 생성에 실패했습니다.');
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
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">새 워크스페이스 생성</h3>
              <p className="text-xs text-slate-400">독립된 데이터베이스와 프로젝트 공간을 생성합니다.</p>
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

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">워크스페이스 아이콘</label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center border transition-all ${
                    icon === emoji
                      ? 'bg-indigo-600/20 border-indigo-500 text-white scale-105 shadow-md shadow-indigo-500/10'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              워크스페이스 이름 <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="예: 알파 개발팀, 본부 일감 관리"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-slate-700/70 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-500"
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">설명 (선택)</label>
            <textarea
              rows={2}
              placeholder="워크스페이스 목적이나 소개를 입력하세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-slate-700/70 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-500 resize-none"
            />
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
              disabled={isSubmitting || !name.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isSubmitting ? '생성 중...' : '워크스페이스 생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
