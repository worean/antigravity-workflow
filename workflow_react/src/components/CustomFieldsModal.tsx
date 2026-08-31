import React, { useState, useEffect } from 'react';
import type { CustomFieldDefinition, Project } from '@/types';
import { getCustomFields, createCustomField, deleteCustomField, getProjects } from '@/services/api';
import { X, Plus, Trash2, Sliders } from 'lucide-react';
import { useOverlayClickClose } from '@/hooks/useOverlayClickClose';

interface CustomFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomFieldsModal: React.FC<CustomFieldsModalProps> = ({ isOpen, onClose }) => {
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [fieldType, setFieldType] = useState('STRING');
  const [projectId, setProjectId] = useState<number | ''>('');
  const [isRequired, setIsRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const overlayProps = useOverlayClickClose(onClose);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cfList, pList] = await Promise.all([getCustomFields(), getProjects()]);
      setCustomFields(cfList);
      setProjects(pList);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const autoKey = key.trim() || name.trim().toLowerCase().replace(/\s+/g, '_');
      await createCustomField({
        name,
        key: autoKey,
        fieldType,
        isRequired,
        projectId: projectId ? Number(projectId) : undefined,
      });
      setName('');
      setKey('');
      setFieldType('STRING');
      setProjectId('');
      setIsRequired(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || '커스텀 필드 생성 실패');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 커스텀 필드를 삭제하시겠습니까?')) return;
    try {
      await deleteCustomField(id);
      setCustomFields((prev) => prev.filter((cf) => cf.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || '커스텀 필드 삭제 실패');
    }
  };

  return (
    <div className="modal-overlay" {...overlayProps}>
      <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={20} color="var(--primary)" /> 커스텀 필드 관리 (Custom Fields)
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: '#f43f5e',
              fontSize: '0.85rem',
              marginBottom: '16px',
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCreate} style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">필드 명칭 (Name)</label>
              <input
                type="text"
                className="input-field"
                placeholder="예: 고객사 이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">필드 키 (Key)</label>
              <input
                type="text"
                className="input-field"
                placeholder="예: customer_name"
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">데이터 타입 (Type)</label>
              <select className="input-field" value={fieldType} onChange={(e) => setFieldType(e.target.value)}>
                <option value="STRING">텍스트 (STRING)</option>
                <option value="NUMBER">숫자 (NUMBER)</option>
                <option value="DATE">날짜 (DATE)</option>
                <option value="SELECT">선택형 (SELECT)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">적용 프로젝트 (Target)</label>
              <select className="input-field" value={projectId} onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">글로벌 (모든 프로젝트)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.key})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0, justifyContent: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', height: '38px' }}>
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                />
                필수 입력 항목
              </label>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-end', marginTop: '4px' }}>
            <Plus size={14} /> 필드 정의 추가
          </button>
        </form>

        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>등록된 커스텀 필드 목록</h3>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>불러오는 중...</p>
        ) : customFields.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>생성된 커스텀 필드가 없습니다.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
            {customFields.map((cf) => (
              <div
                key={cf.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', marginRight: '8px' }}>{cf.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', fontFamily: 'monospace' }}>({cf.key})</span>
                  <span
                    style={{
                      marginLeft: '10px',
                      fontSize: '0.7rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: 'var(--primary)',
                    }}
                  >
                    {cf.fieldType}
                  </span>
                  {cf.projectId ? (
                    <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Project #{cf.projectId}
                    </span>
                  ) : (
                    <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#10b981' }}>글로벌</span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(cf.id)}
                  style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '4px' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
