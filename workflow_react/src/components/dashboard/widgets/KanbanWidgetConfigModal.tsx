import React, { useState, useEffect } from 'react';
import { ModalWrapper, Button } from '@/components/common';
import { useProjects } from '@/api/projects';
import { STATUS_LIST } from '@/utils/statusUtils';
import type { DashboardWidgetConfig } from '@/types/dashboard';
import { Filter, Check } from 'lucide-react';

interface KanbanWidgetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: DashboardWidgetConfig;
  onSave: (config: Partial<DashboardWidgetConfig>) => void;
}

const DEFAULT_STATUS_CATEGORIES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

const ISSUE_TYPES = [
  { id: 1, label: 'Task', icon: '📋' },
  { id: 2, label: 'Bug', icon: '🐛' },
  { id: 3, label: 'Feature', icon: '✨' },
  { id: 4, label: 'Improvement', icon: '🚀' },
];

export const KanbanWidgetConfigModal: React.FC<KanbanWidgetConfigModalProps> = ({
  isOpen,
  onClose,
  config = {},
  onSave,
}) => {
  const { data: projects = [] } = useProjects();

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    config.statusCategories && config.statusCategories.length > 0
      ? config.statusCategories
      : DEFAULT_STATUS_CATEGORIES
  );

  const [selectedTypeIds, setSelectedTypeIds] = useState<number[]>(
    config.typeIds || []
  );

  const [selectedProjectId, setSelectedProjectId] = useState<number | 'ALL'>(
    config.projectId !== undefined ? config.projectId : 'ALL'
  );

  const [assigneeFilter, setAssigneeFilter] = useState<'ALL' | 'MY'>(
    config.assigneeFilter || 'ALL'
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedCategories(
        config.statusCategories && config.statusCategories.length > 0
          ? config.statusCategories
          : DEFAULT_STATUS_CATEGORIES
      );
      setSelectedTypeIds(config.typeIds || []);
      setSelectedProjectId(config.projectId !== undefined ? config.projectId : 'ALL');
      setAssigneeFilter(config.assigneeFilter || 'ALL');
    }
  }, [isOpen, config]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleTypeId = (typeId: number) => {
    setSelectedTypeIds((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    );
  };

  const handleSelectAllCategories = () => {
    setSelectedCategories(DEFAULT_STATUS_CATEGORIES);
  };

  const handleClearCategories = () => {
    setSelectedCategories([]);
  };

  const handleSave = () => {
    onSave({
      statusCategories: selectedCategories,
      typeIds: selectedTypeIds,
      projectId: selectedProjectId,
      assigneeFilter,
    });
    onClose();
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="칸반 보드 위젯 필터 설정"
      icon={<Filter size={18} color="var(--primary)" />}
      maxWidth="500px"
      zIndex={1600}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 1. Status Filter */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-bright)' }}>
              표시할 일감 상태 (Status)
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={handleSelectAllCategories}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.72rem' }}
              >
                전체 선택
              </button>
              <span style={{ color: 'var(--border-light)' }}>|</span>
              <button
                type="button"
                onClick={handleClearCategories}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.72rem' }}
              >
                선택 해제
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {STATUS_LIST.map((st) => {
              const isChecked = selectedCategories.includes(st.key);
              return (
                <div
                  key={st.key}
                  onClick={() => toggleCategory(st.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-xs)',
                    background: isChecked ? 'rgba(0, 122, 204, 0.12)' : 'var(--bg-subtle)',
                    border: `1px solid ${isChecked ? 'var(--primary)' : 'var(--border-light)'}`,
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '3px',
                      border: `1px solid ${isChecked ? 'var(--primary)' : 'var(--text-muted)'}`,
                      background: isChecked ? 'var(--primary)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-on-primary)',
                    }}
                  >
                    {isChecked && <Check size={12} strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: isChecked ? 'var(--text-bright)' : 'var(--text-sub)', fontWeight: isChecked ? 600 : 400 }}>
                    {st.koreanLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Type Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '8px' }}>
            표시할 일감 유형 (Type) <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>(선택 안 할 경우 전체)</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {ISSUE_TYPES.map((t) => {
              const isChecked = selectedTypeIds.includes(t.id);
              return (
                <div
                  key={t.id}
                  onClick={() => toggleTypeId(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-xs)',
                    background: isChecked ? 'rgba(0, 122, 204, 0.12)' : 'var(--bg-subtle)',
                    border: `1px solid ${isChecked ? 'var(--primary)' : 'var(--border-light)'}`,
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '3px',
                      border: `1px solid ${isChecked ? 'var(--primary)' : 'var(--text-muted)'}`,
                      background: isChecked ? 'var(--primary)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-on-primary)',
                    }}
                  >
                    {isChecked && <Check size={12} strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: isChecked ? 'var(--text-bright)' : 'var(--text-sub)', fontWeight: isChecked ? 600 : 400 }}>
                    {t.icon} {t.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Project & Assignee Filter */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '6px' }}>
              대상 프로젝트
            </label>
            <select
              className="form-control"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              style={{ fontSize: '0.8rem', padding: '6px 8px' }}
            >
              <option value="ALL">전체 프로젝트</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.key})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '6px' }}>
              담당자 필터
            </label>
            <select
              className="form-control"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value as 'ALL' | 'MY')}
              style={{ fontSize: '0.8rem', padding: '6px 8px' }}
            >
              <option value="ALL">전체 담당자</option>
              <option value="MY">내게 할당된 일감만</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
          <Button variant="secondary" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            필터 적용
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
};
