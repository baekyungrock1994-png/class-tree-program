import React, { useState } from 'react';
import { 
  School, 
  X, 
  KeyRound, 
  RefreshCw, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Plus,
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

export default function CreateClassroomModal({
  isOpen,
  onClose,
  teacher,
  onCreateClassroom
}) {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('5학년');
  const [subject, setSubject] = useState('과학');
  const [code, setCode] = useState(() => generateRandomCode());
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleRegenerateCode = (e) => {
    e.preventDefault();
    setCode(generateRandomCode());
  };

  const handlePresetSelect = (presetGrade) => {
    setGrade(presetGrade);
    // 이름이 비어있거나 기존 형식일 때 힌트 자동 보정
    if (!name.trim()) {
      setName(`${presetGrade} ${subject}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('학급(교실) 명칭을 입력해 주세요.');
      return;
    }

    const finalCode = (code.trim() || generateRandomCode()).toUpperCase();

    onCreateClassroom({
      name: name.trim(),
      grade: grade.trim() || '일반',
      subject: subject.trim(),
      code: finalCode,
      description: description.trim()
    });

    // 초기화 및 닫기
    setName('');
    setDescription('');
    setCode(generateRandomCode());
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
            <div className="create-classroom-icon-badge">
              <School size={22} />
            </div>
            <div>
              <h3 className="modal-title">새 학급(교실) 개설</h3>
              <p className="modal-subtitle">
                <strong>{teacher?.name || '선생님'}</strong>의 새로운 수업 공간 또는 동아리 교실을 생성합니다.
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

        {/* 모달 폼 */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            
            {/* 1. 학급 명칭 */}
            <div className="form-group mb-4">
              <label className="form-label font-bold">
                학급(교실) 명칭 <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="예: 5학년 3반 과학, 인공지능 탐구 동아리, 환경 생태 교실"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
              <p className="form-help-text">
                학생들과 동료 선생님이 쉽게 알아볼 수 있는 반 또는 활동명을 적어주세요.
              </p>
            </div>

            {/* 2. 학년 및 과목 빠른 선택 */}
            <div className="form-group mb-4">
              <label className="form-label font-bold">학년 / 학급 구분</label>
              <div className="preset-chip-list">
                {GRADE_PRESETS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`preset-chip-btn ${grade === g ? 'active' : ''}`}
                    onClick={() => handlePresetSelect(g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="form-label font-bold">교과목 / 활동 영역</label>
              <div className="preset-chip-list">
                {SUBJECT_PRESETS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`preset-chip-btn ${subject === s ? 'active' : ''}`}
                    onClick={() => setSubject(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. 학급 고유 초대 코드 */}
            <div className="form-group mb-4">
              <label className="form-label font-bold">
                학급 고유 초대 코드
                <span className="text-subtle font-normal ml-2" style={{ fontSize: '0.78rem' }}>
                  (학생 및 공동 교사 초대용)
                </span>
              </label>
              <div className="code-input-group">
                <div className="code-input-wrapper">
                  <KeyRound size={16} className="code-input-icon" />
                  <input
                    type="text"
                    className="form-input code-input font-mono"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="예: SCI-501"
                    maxLength={12}
                    required
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-secondary code-regen-btn"
                  onClick={handleRegenerateCode}
                  title="새로운 랜덤 코드로 재생성"
                >
                  <RefreshCw size={14} />
                  <span>랜덤 생성</span>
                </button>
              </div>
              <p className="form-help-text" style={{ color: '#4f46e5' }}>
                💡 개설 후 학생들에게 이 코드를 공유하면 <strong>[새 교실 참여하기]</strong>를 통해 즉시 참여할 수 있습니다.
              </p>
            </div>

            {/* 4. 학급 소개 및 수업 안내 */}
            <div className="form-group mb-4">
              <label className="form-label font-bold">
                학급 소개 및 수업 안내 <span className="text-subtle font-normal" style={{ fontSize: '0.78rem' }}>(선택)</span>
              </label>
              <textarea
                className="form-input form-textarea"
                rows={2}
                placeholder="학급 구성원들에게 안내할 학습 목표나 학급 규칙을 적어주세요."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* 5. 개설 교사 정보 배너 */}
            <div className="creator-info-banner">
              <div className="creator-banner-left">
                <ShieldCheck size={18} className="creator-shield-icon" />
                <div>
                  <strong className="creator-title">개설 교사 권한 안내</strong>
                  <p className="creator-desc">
                    <strong>{teacher?.name || '선생님'}</strong>이 이 학급의 <strong>대표 교사(Owner)</strong>로 등록됩니다. 개설 후 [참여 인원 관리]에서 다른 선생님을 공동 수업 교사로 초대하실 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* 모달 푸터 */}
          <div className="modal-footer">
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
            >
              <Plus size={16} />
              <span>학급 개설 완료</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
