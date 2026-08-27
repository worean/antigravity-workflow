// -*- coding: utf-8 -*-
import React from 'react';
import type { CustomFieldDefinition } from '../../types';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Spinner } from '../common';

interface SettingsCustomFieldsTabProps {
  isAuthenticated: boolean;
  customFields: CustomFieldDefinition[];
  loadingFields: boolean;
  showFieldForm: boolean;
  setShowFieldForm: (show: boolean) => void;
  fieldKey: string;
  setFieldKey: (key: string) => void;
  fieldName: string;
  setFieldName: (name: string) => void;
  fieldType: string;
  setFieldType: (type: string) => void;
  fieldDesc: string;
  setFieldDesc: (desc: string) => void;
  fieldRequired: boolean;
  setFieldRequired: (required: boolean) => void;
  isPending: boolean;
  handleCreateCustomField: (e: React.FormEvent) => void;
  handleDeleteCustomField: (fieldId: number) => void;
}

export const SettingsCustomFieldsTab: React.FC<SettingsCustomFieldsTabProps> = ({
  isAuthenticated,
  customFields,
  loadingFields,
  showFieldForm,
  setShowFieldForm,
  fieldKey,
  setFieldKey,
  fieldName,
  setFieldName,
  fieldType,
  setFieldType,
  fieldDesc,
  setFieldDesc,
  fieldRequired,
  setFieldRequired,
  isPending,
  handleCreateCustomField,
  handleDeleteCustomField,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-bright)' }}>
            이슈 사용자 정의 필드 (Custom Fields)
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            이슈 등록 및 상세 화면에서 사용할 커스텀 데이터 필드를 정의하고 관리합니다.
          </p>
        </div>
        {isAuthenticated && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={13} />}
            onClick={() => setShowFieldForm(!showFieldForm)}
          >
            {showFieldForm ? '닫기' : '새 필드 추가'}
          </Button>
        )}
      </div>

      {/* Add Custom Field Form */}
      {showFieldForm && (
        <form
          onSubmit={handleCreateCustomField}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '12px',
            background: '#2d2d2d',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xs)',
          }}
        >
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)' }}>
            신규 커스텀 필드 생성
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div className="form-group">
              <label className="form-label">필드 키 (Key, 영문)</label>
              <input
                type="text"
                className="input-field"
                value={fieldKey}
                onChange={(e) => setFieldKey(e.target.value)}
                placeholder="e.g. env_type, severity"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">표시 이름 (Name)</label>
              <input
                type="text"
                className="input-field"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="e.g. 발생 환경, 심각도"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">데이터 유형 (Type)</label>
              <select
                className="input-field"
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value)}
              >
                <option value="STRING">문자열 (STRING)</option>
                <option value="NUMBER">숫자 (NUMBER)</option>
                <option value="DATE">날짜 (DATE)</option>
                <option value="SELECT">선택형 (SELECT)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">설명 (Description)</label>
            <input
              type="text"
              className="input-field"
              value={fieldDesc}
              onChange={(e) => setFieldDesc(e.target.value)}
              placeholder="필드 용도에 대한 간단한 설명을 입력하세요"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-main)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={fieldRequired}
                onChange={(e) => setFieldRequired(e.target.checked)}
              />
              필수 입력 항목으로 지정
            </label>

            <div style={{ display: 'flex', gap: '6px' }}>
              <Button variant="secondary" size="sm" onClick={() => setShowFieldForm(false)}>
                취소
              </Button>
              <Button type="submit" variant="primary" size="sm" icon={<Plus size={13} />} isLoading={isPending}>
                생성
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Custom Fields List */}
      {loadingFields ? (
        <Spinner centered label="커스텀 필드 목록 불러오는 중..." />
      ) : customFields.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
          등록된 사용자 정의 필드가 없습니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {customFields.map((field) => (
            <div
              key={field.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: '#2d2d2d',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: '0.82rem' }}>
                  {field.name}
                </span>
                <code style={{ fontSize: '0.7rem', color: 'var(--primary)', background: '#1e1e1e', padding: '1px 5px', borderRadius: '2px' }}>
                  {field.key}
                </code>
                <span style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)', background: 'rgba(0,122,204,0.15)', padding: '1px 5px', borderRadius: '2px' }}>
                  {field.fieldType}
                </span>
                {field.isRequired && (
                  <span style={{ fontSize: '0.65rem', color: '#f14c4c', fontWeight: 700 }}>
                    (필수)
                  </span>
                )}
                {field.description && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                    - {field.description}
                  </span>
                )}
              </div>

              {isAuthenticated && (
                <button
                  onClick={() => handleDeleteCustomField(field.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                  title="삭제"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};