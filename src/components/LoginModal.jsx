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
import { signInWithGoogle } from '../services/firebaseAuthService';

export default function LoginModal({
  isOpen,
  onClose,
  users = [],
  onLoginSuccess,
  currentRole,
  onOpenRegister
}) {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [selectedRole, setSelectedRole] = useState(currentRole || 'teacher');
  const [errorMessage, setErrorMessage] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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

  // 구글 계정으로 관리자 로그인
  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      setErrorMessage('');
      const googleAdminUser = await signInWithGoogle();
      if (googleAdminUser) {
        onLoginSuccess(googleAdminUser, 'admin');
        onClose();
      }
    } catch (err) {
      console.error('구글 로그인 실패:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('로그인 팝업창이 닫혔습니다.');
      } else if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
        setErrorMessage('Firebase 콘솔의 Authentication > Sign-in method에서 Google을 활성화해 주세요.');
      } else {
        setErrorMessage(`구글 로그인 실패: ${err.message || '인증에 실패했습니다.'}`);
      }
    } finally {
      setIsGoogleLoading(false);
    }
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
        detail: '시스템 총괄 관리자 (체험용)',
        status: 'active'
      };
      onLoginSuccess(adminUser, 'admin');
      onClose();
    } else if (roleType === 'student') {
      const studentUser = {
        id: 'usr-std-sample',
        name: '학생',
        studentNo: '50101',
        username: 'sample_student',
        role: 'student',
        detail: '5학년 1반 1번 (체험용 학생)',
        status: 'active'
      };
      onLoginSuccess(studentUser, 'student');
      onClose();
    } else {
      const teacherUser = users.find((u) => u.role === 'teacher' && u.status === 'active') || {
        id: 'usr-tch-1',
        name: '김선생님',
        username: 'teacher',
        role: 'teacher',
        detail: '담당 교사 (체험용 샘플)',
        status: 'active'
      };
      onLoginSuccess(teacherUser, 'teacher');
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

        {/* 구글 계정 관리자 로그인 */}
        <div className="login-google-section">
          <button
            type="button"
            className="btn-google-login"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <span className="google-spinner"></span>
            ) : (
              <svg className="google-svg-icon" width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span className="google-btn-text">
              {isGoogleLoading ? '구글 계정 연결 중...' : 'Google 계정으로 관리자 로그인'}
            </span>
          </button>
          <p className="google-login-notice">
            * 내 구글 계정으로 로그인 시 즉시 <strong>최고 관리자</strong> 권한이 부여됩니다.
          </p>
        </div>

        <div className="login-divider">
          <span>또는 아이디/비밀번호 로그인</span>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className="login-form-body">
          <div className="form-group">
            <label className="login-field-label">아이디 (Username)</label>
            <div className="login-input-wrap">
              <User size={16} className="login-input-icon" />
              <input
                type="text"
                className="login-input"
                placeholder="아이디를 입력하세요 (예: teacher 또는 admin)"
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
            <span className="login-pw-hint">* 기본 비밀번호는 <code>1234</code> 또는 <code>password123!</code> 입니다.</span>
          </div>

          <button type="submit" className="btn-login-submit mt-4">
            <span>아이디로 접속</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* 빠른 간편 체험 로그인 버튼들 */}
        <div className="login-quick-section">
          <div className="login-divider">
            <span>빠른 테스트 접속 (체험용 샘플)</span>
          </div>

          <div className="quick-login-btn-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <button
              type="button"
              className="quick-login-tile teacher"
              onClick={() => handleQuickLogin('teacher')}
              title="김선생님 샘플 계정으로 즉시 접속"
            >
              <div className="tile-icon-wrap teacher">
                <GraduationCap size={15} />
              </div>
              <div className="tile-text-wrap">
                <strong className="tile-name">김선생님</strong>
                <span className="tile-role">샘플 교사</span>
              </div>
            </button>

            <button
              type="button"
              className="quick-login-tile student"
              onClick={() => handleQuickLogin('student')}
              title="체험용 학생 계정으로 즉시 접속"
            >
              <div className="tile-icon-wrap student">
                <School size={15} />
              </div>
              <div className="tile-text-wrap">
                <strong className="tile-name">학생</strong>
                <span className="tile-role">체험 학생</span>
              </div>
            </button>

            <button
              type="button"
              className="quick-login-tile admin"
              onClick={() => handleQuickLogin('admin')}
              title="최고 관리자 계정으로 즉시 접속"
            >
              <div className="tile-icon-wrap admin">
                <ShieldCheck size={15} />
              </div>
              <div className="tile-text-wrap">
                <strong className="tile-name">관리자</strong>
                <span className="tile-role">관리자 콘솔</span>
              </div>
            </button>
          </div>
        </div>

        {/* 회원가입 링크 */}
        <div className="login-register-footer">
          <span>아직 계정이 없으신가요?</span>
          <button
            type="button"
            className="btn-switch-register"
            onClick={() => {
              onClose();
              if (onOpenRegister) onOpenRegister();
            }}
          >
            회원가입 신청하기
          </button>
        </div>
      </div>
    </div>
  );
}
