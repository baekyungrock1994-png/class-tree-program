import React, { useState } from 'react';
import { 
  GitFork, 
  X, 
  Lock, 
  User, 
  KeyRound, 
  GraduationCap, 
  School, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export default function LoginModal({
  isOpen,
  onClose,
  users = [],
  onLoginSuccess,
  currentRole
}) {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [selectedRole, setSelectedRole] = useState(currentRole || 'teacher');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // 일반 로그인 폼 제출
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const uName = usernameInput.trim();
    const pw = passwordInput.trim();

    if (!uName || !pw) {
      setErrorMessage('아이디와 비밀번호를 모두 입력해 주세요.');
      return;
    }

    // 관리자 특별 계정 확인
    if (uName === 'admin' && (pw === 'admin' || pw === '1234' || pw === 'password123!')) {
      const adminUser = {
        id: 'usr-admin',
        name: '시스템 관리자',
        username: 'admin',
        role: 'admin',
        detail: '최고 관리자 마스터 계정',
        status: 'active'
      };
      onLoginSuccess(adminUser, 'admin');
      onClose();
      return;
    }

    // users 목록에서 검색
    const matched = users.find(
      (u) => (u.username.toLowerCase() === uName.toLowerCase() || u.name === uName)
    );

    if (!matched) {
      setErrorMessage('등록되지 않은 아이디입니다. 아이디를 다시 확인해 주세요.');
      return;
    }

    if (matched.status === 'pending') {
      setErrorMessage('현재 가입 승인 대기 중인 계정입니다. 관리자의 승인 후 접속 가능합니다.');
      return;
    }

    if (matched.status === 'rejected') {
      setErrorMessage(`가입 신청이 반려된 계정입니다. (사유: ${matched.rejectedReason || '확인 불가'})`);
      return;
    }

    // 비밀번호 검증 (기본 1234, password123!, 또는 저장된 비밀번호)
    const isPwValid = (pw === matched.password || pw === '1234' || pw === 'password123!');
    if (!isPwValid) {
      setErrorMessage('비밀번호가 올바르지 않습니다. (초기 비밀번호: 1234)');
      return;
    }

    onLoginSuccess(matched, matched.role);
    onClose();
  };

  // 원클릭 빠른 체험 로그인
  const handleQuickLogin = (roleType) => {
    setErrorMessage('');
    if (roleType === 'admin') {
      const adminUser = {
        id: 'usr-admin',
        name: '최고 관리자',
        username: 'admin',
        role: 'admin',
        detail: '시스템 총괄 관리자',
        status: 'active'
      };
      onLoginSuccess(adminUser, 'admin');
      onClose();
    } else if (roleType === 'teacher') {
      const teacherUser = users.find((u) => u.role === 'teacher' && u.status === 'active') || {
        id: 'usr-tch-1',
        name: '김길동T',
        username: 'teacher_kim',
        role: 'teacher',
        detail: '5학년 1반 담임 / 과학과 부장',
        status: 'active'
      };
      onLoginSuccess(teacherUser, 'teacher');
      onClose();
    } else {
      const studentUser = users.find((u) => u.role === 'student' && u.status === 'active') || {
        id: 'usr-std-1',
        name: '배경록',
        username: 'std_50101',
        role: 'student',
        detail: '5학년 1반 1번 (1조)',
        status: 'active'
      };
      onLoginSuccess(studentUser, 'student');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content login-modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', width: '92vw', borderRadius: '20px' }}
      >
        {/* 헤더 */}
        <div className="login-modal-header">
          <div className="login-brand-icon">
            <GitFork size={28} />
          </div>
          <h2 className="login-modal-title">ClassTree 로그인</h2>
          <p className="login-modal-desc">
            학급 수업 및 지식 흐름도 플랫폼에 접속합니다.
          </p>
          <button 
            type="button" 
            className="btn-close-modal login-close-btn" 
            onClick={onClose}
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* 에러 메시지 알림 */}
        {errorMessage && (
          <div className="login-error-alert">
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className="login-form-body">
          <div className="form-group">
            <label className="login-field-label">아이디 (Username)</label>
            <div className="login-input-wrap">
              <User size={16} className="login-input-icon" />
              <input
                type="text"
                className="login-input"
                placeholder="아이디를 입력하세요 (예: teacher_kim)"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="form-group mt-3">
            <label className="login-field-label">비밀번호 (Password)</label>
            <div className="login-input-wrap">
              <Lock size={16} className="login-input-icon" />
              <input
                type="password"
                className="login-input"
                placeholder="비밀번호 입력 (기본: 1234)"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
            </div>
            <span className="login-pw-hint">* 초기 비밀번호는 <code>1234</code> 입니다.</span>
          </div>

          <button type="submit" className="btn-login-submit mt-4">
            <span>로그인하여 프로그램 접속</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* 빠른 간편 체험 로그인 버튼들 */}
        <div className="login-quick-section">
          <div className="login-divider">
            <span>또는 빠른 계정 접속</span>
          </div>

          <div className="quick-login-btn-grid">
            <button
              type="button"
              className="quick-login-tile teacher"
              onClick={() => handleQuickLogin('teacher')}
              title="김길동 선생님 계정으로 즉시 접속"
            >
              <div className="tile-icon-wrap teacher">
                <GraduationCap size={16} />
              </div>
              <div className="tile-text-wrap">
                <strong className="tile-name">김길동 선생님</strong>
                <span className="tile-role">교사 모드</span>
              </div>
            </button>

            <button
              type="button"
              className="quick-login-tile student"
              onClick={() => handleQuickLogin('student')}
              title="배경록 학생 계정으로 즉시 접속"
            >
              <div className="tile-icon-wrap student">
                <School size={16} />
              </div>
              <div className="tile-text-wrap">
                <strong className="tile-name">배경록 학생</strong>
                <span className="tile-role">학생 모드</span>
              </div>
            </button>

            <button
              type="button"
              className="quick-login-tile admin"
              onClick={() => handleQuickLogin('admin')}
              title="최고 관리자 계정으로 즉시 접속"
            >
              <div className="tile-icon-wrap admin">
                <ShieldCheck size={16} />
              </div>
              <div className="tile-text-wrap">
                <strong className="tile-name">최고 관리자</strong>
                <span className="tile-role">관리자 콘솔</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
