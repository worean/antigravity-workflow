import React, { useState, useEffect } from 'react';
import type { CustomFieldDefinition, Project } from '../types';
import { getCustomFields, createCustomField, deleteCustomField, getProjects } from '../services/api';
import { X, Plus, Trash2, Sliders } from 'lucide-react';

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
    <div className="modal-overlay" onClick={onClose}>
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

        {/* 신규 커스텀 필드 추가 Form */}
        <form onSubmit={handleCreate} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: 'var(--primary)' }}>
            + 새 커스텀 필드 정의 추가
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label className="form-label">필드 명칭 (Name)</label>
              <input
                type="text"
                className="input-field"
                placeholder="예: 고객사, 출시 예정일"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!key) setKey(e.target.value.trim().toLowerCase().replace(/\s+/g, '_'));
                }}
                required
              />
            </div>
            <div>
              <label className="form-label">필드 키 (Key Identifier)</label>
              <input
                type="text"
                className="input-field"
                placeholder="예: customer_name"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label className="form-label">데이터 타입 (Type)</label>
              <select className="input-field" value={fieldType} onChange={(e) => setFieldType(e.target.value)}>
                <option value="STRING">텍스트 (STRING)</option>
                <option value="NUMBER">숫자 (NUMBER)</option>
                <option value="DATE">날짜 (DATE)</option>
                <option value="JSON">JSON / 복합 데이터</option>
              </select>
            </div>

            <div>
              <label className="form-label">적용 프로젝트</label>
              <select className="input-field" value={projectId} onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">전체 글로벌 적용</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.key})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px', gap: '6px' }}>
              <input
                type="checkbox"
                id="isRequiredCheck"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
              />
              <label htmlFor="isRequiredCheck" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>필수 입력 여부</label>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
            <Plus size={14} /> 커스텀 필드 생성
          </button>
        </form>

        {/* 커스텀 필드 목록 */}
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px' }}>등록된 커스텀 필드 목록 ({customFields.length})</h4>
        <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>로딩 중...</div>
          ) : customFields.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>등록된 커스텀 필드가 없습니다.</div>
          ) : (
            customFields.map((cf) => (
              <div
                key={cf.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)', marginRight: '8px' }}>{cf.name}</span>
                  <span style={{ color: 'var(--primary)', fontSize: '0.75rem', background: 'rgba(99,102,241,0.15)', padding: '2px 6px', borderRadius: '4px', marginRight: '6px' }}>
                    {cf.key}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>[{cf.fieldType}]</span>
                  {cf.projectId && (
                    <span style={{ color: '#f59e0b', fontSize: '0.75rem', marginLeft: '6px' }}>
                      (Project #{cf.projectId})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(cf.id)}
                  style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }}
                  title="삭제"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
