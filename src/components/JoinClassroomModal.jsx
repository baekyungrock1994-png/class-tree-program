import React, { useState } from 'react';
import { 
  KeyRound, 
  X, 
  School, 
  CheckCircle2, 
  ArrowRight, 
  Users, 
  Copy, 
  Check, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function JoinClassroomModal({
  isOpen,
  onClose,
  currentRole = 'teacher',
  currentTeacher,
  currentStudent,
  onJoinByCode,
  activeClassroom
}) {
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // 교사 모드일 때 탭: 'join' (다른 교실에 공동교사로 참여) vs 'invite' (내 교실 코드 확인/공유)
  const [teacherTab, setTeacherTab] = useState('invite');

  if (!isOpen) return null;

  const isTeacher = currentRole === 'teacher' || currentRole === 'admin';

  const handleCopyMyCode = () => {
    if (!activeClassroom?.code) return;
    navigator.clipboard.writeText(activeClassroom.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!code.trim()) {
      setErrorMsg('초대 코드를 입력해 주세요.');
      return;
    }

    const userObj = isTeacher ? currentTeacher : currentStudent;
    const result = onJoinByCode(code.trim(), currentRole, userObj);

    if (result && result.success) {
      if (currentRole === 'teacher') {
        setSuccessMsg(`"${result.classroom.name}" 학급에 공동 수업 교사로 성공적으로 등록되었습니다!`);
      } else {
        setSuccessMsg(`"${result.classroom.name}" 교실에 성공적으로 참여하였습니다!`);
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setErrorMsg(result?.message || '초대 코드를 다시 확인해 주세요.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content join-classroom-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-with-icon">
            <div className="join-modal-icon-badge">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="modal-title">
                {isTeacher ? '협동 교사 초대 및 교실 참여' : '새 교실 참여하기'}
              </h3>
              <p className="modal-subtitle-text">
                {isTeacher 
                  ? '내 교실의 고유 코드를 동료 교사에게 공유하거나, 다른 교실에 공동 교사로 참여합니다.' 
                  : '선생님이 안내해주신 학급 고유 코드를 입력하여 수업 공간에 입장합니다.'}
              </p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* 교사 모드 전용 탭 전환 */}
          {isTeacher && (
            <div className="join-teacher-tabs">
              <button 
                type="button" 
                className={`join-tab-btn ${teacherTab === 'invite' ? 'active' : ''}`}
                onClick={() => { setTeacherTab('invite'); setErrorMsg(''); setSuccessMsg(''); }}
              >
                <Users size={15} />
                <span>내 학급 코드 공유 (동료 교사 초대)</span>
              </button>
              <button 
                type="button" 
                className={`join-tab-btn ${teacherTab === 'join' ? 'active' : ''}`}
                onClick={() => { setTeacherTab('join'); setErrorMsg(''); setSuccessMsg(''); }}
              >
                <ShieldCheck size={15} />
                <span>다른 학급에 공동교사로 참여</span>
              </button>
            </div>
          )}

          {/* 성공 메시지 */}
          {successMsg && (
            <div className="join-alert-box success">
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 오류 메시지 */}
          {errorMsg && (
            <div className="join-alert-box error">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. 교사 모드 - 내 교실 초대 코드 복사 탭 */}
          {isTeacher && teacherTab === 'invite' && (
            <div className="invite-share-section">
              <div className="invite-classroom-preview">
                <span className="room-label">현재 선택된 학급</span>
                <strong className="room-name">{activeClassroom?.name || '학급을 선택해 주세요'}</strong>
              </div>

              <div className="classroom-code-card highlight">
                <div className="code-card-info">
                  <div className="code-card-label">
                    <KeyRound size={14} />
                    <span>초대용 고유 코드</span>
                  </div>
                  <div className="code-card-display">
                    <span className="code-text large">{activeClassroom?.code || 'SCI-501'}</span>
                  </div>
                </div>
                <button 
                  type="button" 
                  className={`btn-copy-code ${copied ? 'copied' : ''}`}
                  onClick={handleCopyMyCode}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copied ? '복사 완료!' : '코드 복사'}</span>
                </button>
              </div>

              <div className="share-guide-list">
                <div className="guide-item">
                  <span className="guide-bullet">1</span>
                  <span>동료 교사에게 이 코드를 알려주시면 <strong>공동 수업 교사</strong>로 함께 수업을 운영할 수 있습니다.</span>
                </div>
                <div className="guide-item">
                  <span className="guide-bullet">2</span>
                  <span>학생들에게 이 코드를 공유하면 <strong>학생</strong> 신분으로 교실에 자동 입장됩니다.</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. 코드 입력 폼 (학생 모드이거나, 교사의 공동교사 참여 탭인 경우) */}
          {(!isTeacher || teacherTab === 'join') && (
            <form onSubmit={handleSubmit} className="join-code-form">
              <div className="form-group">
                <label className="join-input-label">
                  학급 고유 초대 코드 입력
                </label>
                <div className="join-input-wrapper">
                  <KeyRound size={18} className="input-key-icon" />
                  <input
                    type="text"
                    className="join-code-input"
                    placeholder="예: SCI-501, SCI-502, EXP-301"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    autoFocus
                  />
                  <button type="submit" className="btn btn-primary btn-join-submit">
                    <span>{isTeacher ? '공동 교사로 참여' : '교실 참여하기'}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>

              <div className="code-examples-box">
                <span className="examples-title">💡 테스트용 샘플 학급 코드:</span>
                <div className="example-chips">
                  <button type="button" onClick={() => setCode('SCI-501')}>SCI-501 (5-1 과학)</button>
                  <button type="button" onClick={() => setCode('SCI-502')}>SCI-502 (5-2 과학)</button>
                  <button type="button" onClick={() => setCode('EXP-301')}>EXP-301 (융합 발명교실)</button>
                  <button type="button" onClick={() => setCode('ENV-702')}>ENV-702 (기후 동아리)</button>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
