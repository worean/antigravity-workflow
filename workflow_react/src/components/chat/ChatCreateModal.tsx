// -*- coding: utf-8 -*-
import React from 'react';
import type { ChannelType, User, Project, Group } from '@/types';
import { Button } from '@/components/common';

interface ChatCreateModalProps {
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  createType: ChannelType;
  setCreateType: (type: ChannelType) => void;
  createName: string;
  setCreateName: (name: string) => void;
  createTopic: string;
  setCreateTopic: (topic: string) => void;
  createTargetUserId: number | null;
  setCreateTargetUserId: (id: number | null) => void;
  createProjectId: number | null;
  setCreateProjectId: (id: number | null) => void;
  createGroupId: number | null;
  setCreateGroupId: (id: number | null) => void;
  allWorkspaceUsers: User[];
  allWorkspaceProjects: Project[];
  allWorkspaceGroups: Group[];
  currentUserId: number;
  handleCreateChannel: (e: React.FormEvent) => Promise<void>;
}

export const ChatCreateModal: React.FC<ChatCreateModalProps> = ({
  showCreateModal,
  setShowCreateModal,
  createType,
  setCreateType,
  createName,
  setCreateName,
  createTopic,
  setCreateTopic,
  createTargetUserId,
  setCreateTargetUserId,
  createProjectId,
  setCreateProjectId,
  createGroupId,
  setCreateGroupId,
  allWorkspaceUsers,
  allWorkspaceProjects,
  allWorkspaceGroups,
  currentUserId,
  handleCreateChannel,
}) => {
  if (!showCreateModal) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ width: '400px' }}>
        <div className="modal-header">
          <h3 className="modal-title">새 채팅 채널 생성</h3>
        </div>

        <form onSubmit={handleCreateChannel} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">채널 유형</label>
            <select
              className="input-field"
              value={createType}
              onChange={(e) => setCreateType(e.target.value as ChannelType)}
            >
              <option value="GLOBAL">📢 공용 채널 (전체 공개)</option>
              <option value="PROJECT">📁 프로젝트 전용 채널</option>
              <option value="GROUP">👥 그룹/부서 전용 채널</option>
              <option value="DM">💬 1:1 다이렉트 메시지 (DM)</option>
            </select>
          </div>

          {createType === 'DM' ? (
            <div className="form-group">
              <label className="form-label">대화 상대 선택 *</label>
              <select
                className="input-field"
                value={createTargetUserId || ''}
                onChange={(e) => setCreateTargetUserId(Number(e.target.value))}
                required
              >
                <option value="">-- 사용자를 선택하세요 --</option>
                {allWorkspaceUsers
                  .filter((u) => u.id !== currentUserId)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name ? `${u.name} (${u.email})` : u.email}
                    </option>
                  ))}
              </select>
            </div>
          ) : createType === 'PROJECT' ? (
            <>
              <div className="form-group">
                <label className="form-label">연결할 프로젝트 *</label>
                <select
                  className="input-field"
                  value={createProjectId || ''}
                  onChange={(e) => {
                    const pId = Number(e.target.value);
                    setCreateProjectId(pId);
                    const p = allWorkspaceProjects.find((x) => x.id === pId);
                    if (p) setCreateName(p.name);
                  }}
                  required
                >
                  {allWorkspaceProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.key})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">채널명 *</label>
                <input
                  type="text"
                  className="input-field"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="예: 신규 웹사이트 구축"
                  required
                />
              </div>
            </>
          ) : createType === 'GROUP' ? (
            <>
              <div className="form-group">
                <label className="form-label">연결할 그룹/부서 *</label>
                <select
                  className="input-field"
                  value={createGroupId || ''}
                  onChange={(e) => {
                    const gId = Number(e.target.value);
                    setCreateGroupId(gId);
                    const g = allWorkspaceGroups.find((x) => x.id === gId);
                    if (g) setCreateName(g.name);
                  }}
                  required
                >
                  {allWorkspaceGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">채널명 *</label>
                <input
                  type="text"
                  className="input-field"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="예: 플랫폼개발본부"
                  required
                />
              </div>
            </>
          ) : (
            <div className="form-group">
              <label className="form-label">채널명 *</label>
              <input
                type="text"
                className="input-field"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="예: 공지사항, 잡담, 기술공유"
                required
              />
            </div>
          )}

          {createType !== 'DM' && (
            <div className="form-group">
              <label className="form-label">토픽 / 설명 (선택)</label>
              <input
                type="text"
                className="input-field"
                value={createTopic}
                onChange={(e) => setCreateTopic(e.target.value)}
                placeholder="채널의 주요 목적 및 대화 주제"
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowCreateModal(false)}>
              취소
            </Button>
            <Button type="submit" variant="primary" size="sm">
              생성 완료
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};