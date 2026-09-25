import React from 'react';
import { 
  GitFork, 
  LogIn, 
  LogOut, 
  User, 
  GraduationCap, 
  School, 
  ShieldCheck,
  UserPlus
} from 'lucide-react';

export default function Navbar({ 
  currentRole, 
  setCurrentRole, 
  lessonMode, 
  setLessonMode, 
  viewLevel = 'classrooms',
  isLoggedIn = false,
  currentUser = null,
  onOpenLogin,
  onOpenRegister,
  onLogout,
  onGoHome
}) {
  return (
    <header className="navbar">
      {/* Brand Logo - 클릭 시 맨 처음 홈으로 이동 */}
      <div 
        className="brand-section brand-clickable"
        onClick={onGoHome}
        role="button"
        tabIndex={0}
        title="ClassTree 홈으로 돌아가기"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (onGoHome) onGoHome();
          }
        }}
      >
        <div className="brand-logo" title="ClassTree">
          <GitFork size={22} />
        </div>
        <div>
          <span className="brand-title">ClassTree</span>
        </div>
      </div>

      {/* 우측 영역: 역할 전환 탭 + 로그인/로그아웃 버튼 */}
      <div className="nav-actions">
        {/* 모드 전환 세그먼트 (오직 관리자로 로그인한 경우에만 노출) */}
        {isLoggedIn && currentUser?.role === 'admin' && (
          <div className="role-pills" title="관리자 전용 모드 전환">
            <button 
              type="button"
              className={`role-pill ${currentRole === 'teacher' ? 'active teacher' : ''}`}
              onClick={() => setCurrentRole('teacher')}
            >
              교사 모드
            </button>
            <button 
              type="button"
              className={`role-pill ${currentRole === 'student' ? 'active student' : ''}`}
              onClick={() => setCurrentRole('student')}
            >
              학생 모드
            </button>
            <button 
              type="button"
              className={`role-pill ${currentRole === 'admin' ? 'active admin' : ''}`}
              onClick={() => setCurrentRole('admin')}
            >
              관리자 콘솔
            </button>
          </div>
        )}

        {/* 로그인 / 회원가입 / 사용자 프로필 및 로그아웃 버튼 */}
        <div className="nav-auth-section">
          {!isLoggedIn ? (
            <div className="nav-auth-guest-group">
              <button 
                type="button" 
                className="btn-nav-register"
                onClick={onOpenRegister}
                title="ClassTree 교사 또는 학생 회원가입 신청"
              >
                <UserPlus size={14} />
                <span>회원가입</span>
              </button>
              <button 
                type="button" 
                className="btn-nav-login"
                onClick={onOpenLogin}
                title="ClassTree 로그인하여 프로그램 접속하기"
              >
                <LogIn size={14} />
                <span>로그인</span>
              </button>
            </div>
          ) : (
            <div className="nav-user-profile-wrap">
              <div className="nav-user-chip" title={`${currentUser?.detail || ''}`}>
                <div className={`nav-avatar-circle ${currentRole}`}>
                  {currentRole === 'admin' ? (
                    <ShieldCheck size={14} />
                  ) : currentRole === 'teacher' ? (
                    <GraduationCap size={14} />
                  ) : (
                    <School size={14} />
                  )}
                </div>
                <div className="nav-user-text">
                  <span className="nav-user-name">{currentUser?.name || '사용자'}</span>
                  <span className="nav-user-role-label">
                    {currentRole === 'admin' ? '관리자' : currentRole === 'teacher' ? '교사' : '학생'}
                  </span>
                </div>
              </div>

              <button 
                type="button" 
                className="btn-nav-logout"
                onClick={onLogout}
                title="로그아웃"
              >
                <LogOut size={14} />
                <span>로그아웃</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
