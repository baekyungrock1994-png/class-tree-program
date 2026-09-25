import React, { useState, useEffect } from 'react';
import { 
  School, 
  X, 
  KeyRound, 
  RefreshCw, 
  Check, 
  Sparkles, 
  Pencil,
  BookOpen
} from 'lucide-react';

const GRADE_PRESETS = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년', '동아리', '방과후', '공통'];
const SUBJECT_PRESETS = ['과학', '사회', '수학', '국어', '도덕', '실과', '미술', '음악', '창체/자율', '기타'];

function generateRandomCode() {
  const prefixes = ['CLS', 'SCI', 'SOC', 'EDU', 'LAB', 'TEAM'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${num}`;
}

export default function EditClassroomModal({
  isOpen,
  onClose,
  classroom,
  onSaveClassroom
}) {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('5학년');
  const [subject, setSubject] = useState('과학');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (classroom && isOpen) {
      setName(classroom.name || '');
      setGrade(classroom.grade || '5학년');
      setSubject(classroom.subject || '과학');
      setCode(classroom.code || generateRandomCode());
      setDescription(classroom.description || '');
    }
  }, [classroom, isOpen]);

  if (!isOpen || !classroom) return null;

  const handleRegenerateCode = (e) => {
    e.preventDefault();
    setCode(generateRandomCode());
  };

  const handlePresetSelect = (presetGrade) => {
    setGrade(presetGrade);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('학급(교실) 명칭을 입력해 주세요.');
      return;
    }

    const finalCode = (code.trim() || classroom.code || generateRandomCode()).toUpperCase();

    onSaveClassroom(classroom.id, {
      name: name.trim(),
      grade: grade.trim() || '일반',
      subject: subject.trim(),
      code: finalCode,
      description: description.trim()
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content create-classroom-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px' }}
      >
        {/* 모달 헤더 */}
        <div className="modal-header">
          <div className="modal-header-with-icon">
            <div className="create-classroom-icon-badge" style={{ background: '#eef2ff', color: '#4f46e5' }}>
              <Pencil size={20} />
            </div>
            <div>
              <h3 className="modal-title">학급(교실) 정보 수정</h3>
              <p className="modal-subtitle">
                <strong>{classroom.name}</strong>의 기본 설정과 초대 코드를 수정합니다.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* 폼 본문 */}
        <form onSubmit={handleSubmit} className="modal-body-form">
          {/* 1. 학급 명칭 */}
          <div className="form-group">
            <label className="form-label required">학급(교실) 명칭</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="예: 5학년 1반 과학, 환경 기후 동아리"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* 2. 학년 및 교과 선택 */}
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">학년 구분</label>
              <select 
                className="form-select" 
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
              >
                {GRADE_PRESETS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">교과목 / 영역</label>
              <select 
                className="form-select" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                {SUBJECT_PRESETS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. 빠른 학년 선택 칩 */}
          <div className="form-group">
            <label className="form-label sub-label">빠른 학년 선택</label>
            <div className="grade-preset-chips">
              {GRADE_PRESETS.map((pGrade) => (
                <button
                  key={pGrade}
                  type="button"
                  className={`preset-chip ${grade === pGrade ? 'active' : ''}`}
                  onClick={() => handlePresetSelect(pGrade)}
                >
                  {pGrade}
                </button>
              ))}
            </div>
          </div>

          {/* 4. 학생/협동교사 참여 초대 코드 */}
          <div className="form-group">
            <div className="label-with-action">
              <label className="form-label">학생·협동교사 초대 코드</label>
              <button 
                type="button" 
                className="btn-code-refresh"
                onClick={handleRegenerateCode}
                title="새로운 무작위 코드로 생성"
              >
                <RefreshCw size={12} />
                <span>새 코드 생성</span>
              </button>
            </div>

            <div className="code-input-wrapper">
              <KeyRound size={16} className="code-prefix-icon" />
              <input 
                type="text" 
                className="form-input code-input" 
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="예: SCI-501"
                maxLength={10}
              />
            </div>
            <p className="form-hint">
              학생들이 이 코드를 입력하여 학급에 참여할 수 있습니다.
            </p>
          </div>

          {/* 5. 학급 소개 및 안내 */}
          <div className="form-group">
            <label className="form-label">학급 소개 및 학생 안내사항 (선택)</label>
            <textarea 
              className="form-textarea" 
              rows={2}
              placeholder="예: 2학기 과학 탐구 및 실험 산출물 공유 교실입니다."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* 모달 푸터 버튼 */}
          <div className="modal-footer-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              취소
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ minWidth: '110px' }}
            >
              <Check size={15} />
              <span>변경사항 저장</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
