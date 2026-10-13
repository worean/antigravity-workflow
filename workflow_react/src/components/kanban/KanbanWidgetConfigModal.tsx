import React, { useState, useEffect } from 'react';
import { ModalWrapper, Button } from '@/components/common';
import { useProjects } from '@/api/projects';
import { STATUS_LIST } from '@/utils/statusUtils';
import type { KanbanWidgetFilterConfig, WidgetConfigModalProps } from '@/types/widget';
import { Filter, Check } from 'lucide-react';

const DEFAULT_STATUS_CATEGORIES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

const ISSUE_TYPES = [
  { id: 1, label: 'Task', icon: '📋' },
  { id: 2, label: 'Bug', icon: '🐛' },
  { id: 3, label: 'Feature', icon: '✨' },
  { id: 4, label: 'Improvement', icon: '🚀' },
];

export const KanbanWidgetConfigModal: React.FC<WidgetConfigModalProps<KanbanWidgetFilterConfig>> = ({
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
        {/* 1. Status Filter Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-bright)' }}>
              표시할 상태 (Status)
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <Button size="sm" variant="secondary" onClick={handleSelectAllCategories}>
                전체 선택
              </Button>
              <Button size="sm" variant="secondary" onClick={handleClearCategories}>
                전체 해제
              </Button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
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
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '3px',
                      border: `1px solid ${isChecked ? 'var(--primary)' : 'var(--border-subtle)'}`,
                      background: isChecked ? 'var(--primary)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isChecked && <Check size={10} color="#ffffff" />}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: isChecked ? 'var(--text-bright)' : 'var(--text-muted)' }}>
                    {st.koreanLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Issue Type Filter Section */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-bright)', marginBottom: '8px' }}>
            일감 유형 (Type) 필터
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
            {ISSUE_TYPES.map((type) => {
              const isChecked = selectedTypeIds.includes(type.id);
              return (
                <div
                  key={type.id}
                  onClick={() => toggleTypeId(type.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-xs)',
                    background: isChecked ? 'rgba(78, 201, 176, 0.12)' : 'var(--bg-subtle)',
                    border: `1px solid ${isChecked ? '#4ec9b0' : 'var(--border-light)'}`,
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '3px',
                      border: `1px solid ${isChecked ? '#4ec9b0' : 'var(--border-subtle)'}`,
                      background: isChecked ? '#4ec9b0' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isChecked && <Check size={10} color="#ffffff" />}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: isChecked ? 'var(--text-bright)' : 'var(--text-muted)' }}>
                    {type.icon} {type.label}
                  </span>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-sub)', marginTop: '4px', margin: 0 }}>
            * 아무것도 선택하지 않으면 모든 일감 유형이 표시됩니다.
          </p>
        </div>

        {/* 3. Project Filter Section */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-bright)', marginBottom: '6px' }}>
            대상 프로젝트
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-main)',
              fontSize: '0.78rem',
            }}
          >
            <option value="ALL">전체 프로젝트</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Assignee Filter Section */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-bright)', marginBottom: '6px' }}>
            담당자 범위
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.78rem',
                color: 'var(--text-sub)',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="assigneeFilter"
                checked={assigneeFilter === 'ALL'}
                onChange={() => setAssigneeFilter('ALL')}
              />
              모든 담당자
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.78rem',
                color: 'var(--text-sub)',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="assigneeFilter"
                checked={assigneeFilter === 'MY'}
                onChange={() => setAssigneeFilter('MY')}
              />
              내게 할당된 일감만
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
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
