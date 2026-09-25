import React, { useState } from 'react';
import { 
  GitFork, 
  X, 
  User, 
  Lock, 
  GraduationCap, 
  School, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Building,
  BookOpen
} from 'lucide-react';

export default function RegisterModal({
  isOpen,
  onClose,
  users = [],
  onRegisterSubmit,
  onOpenLogin
}) {
  const [role, setRole] = useState('teacher'); // 'teacher' | 'student'
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [school, setSchool] = useState('');
  
  // 교사용 필드
  const [subject, setSubject] = useState('');
  const [teacherGrade, setTeacherGrade] = useState('5학년');

  // 학생용 필드
  const [studentGrade, setStudentGrade] = useState('5');
  const [studentClass, setStudentClass] = useState('1');
  const [studentNumber, setStudentNumber] = useState('1');

  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredUserInfo, setRegisteredUserInfo] = useState(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsSuccess(false);
    setErrorMessage('');
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPw = password.trim();
    const cleanPwConfirm = passwordConfirm.trim();
    const cleanSchool = school.trim();

    // 1. 유효성 검사
    if (!cleanName || !cleanUsername || !cleanPw || !cleanPwConfirm) {
      setErrorMessage('필수 항목(이름, 아이디, 비밀번호)을 모두 입력해 주세요.');
      return;
    }

    if (cleanUsername.length < 3) {
      setErrorMessage('아이디는 최소 3자 이상 입력해 주세요.');
      return;
    }

    // 아이디 중복 검사
    const isDuplicate = users.some(
      (u) => u.username.toLowerCase() === cleanUsername
    );
    if (isDuplicate) {
      setErrorMessage('이미 사용 중인 아이디입니다. 다른 아이디를 입력해 주세요.');
      return;
    }

    if (cleanPw.length < 4) {
      setErrorMessage('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }

    if (cleanPw !== cleanPwConfirm) {
      setErrorMessage('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    if (role === 'teacher') {
      if (!cleanSchool) {
        setErrorMessage('소속 학교명을 입력해 주세요.');
        return;
      }
    } else {
      if (!cleanSchool) {
        setErrorMessage('소속 학교명을 입력해 주세요.');
        return;
      }
      if (!studentNumber) {
        setErrorMessage('학생 번호를 입력해 주세요.');
        return;
      }
    }

    // 2. 신규 사용자 객체 생성 (승인 대기 상태: pending)
    const newId = `usr-${Date.now()}`;
    const refId = role === 'teacher' 
      ? `tch-${Date.now().toString().slice(-4)}`
      : `std-${Date.now().toString().slice(-4)}`;

    const newUserObj = {
      id: newId,
      refId,
      name: cleanName,
      username: cleanUsername,
      password: cleanPw,
      role,
      school: cleanSchool,
      grade: role === 'teacher' ? teacherGrade : Number(studentGrade),
      classNum: role === 'student' ? Number(studentClass) : undefined,
      studentNo: role === 'student' 
        ? `${studentGrade}0${studentClass}${String(studentNumber).padStart(2, '0')}`
        : undefined,
      subject: role === 'teacher' ? (subject.trim() || '일반 교과') : undefined,
      detail: role === 'teacher'
        ? `${cleanSchool} (${teacherGrade} ${subject.trim() || '담당'})`
        : `${cleanSchool} ${studentGrade}학년 ${studentClass}반 ${studentNumber}번`,
      email: `${cleanUsername}@school.edu`,
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'pending' // 승인 대기
    };

    onRegisterSubmit(newUserObj);
    setRegisteredUserInfo(newUserObj);
    setIsSuccess(true);
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className="modal-content register-modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', width: '92vw', borderRadius: '22px' }}
      >
        {/* 닫기 버튼 */}
        <button 
          type="button" 
          className="btn-close-modal login-close-btn" 
          onClick={handleClose}
          aria-label="닫기"
        >
          <X size={18} />
        </button>

        {isSuccess ? (
          /* =========================================================================
             가입 신청 완료 성공 뷰
             ========================================================================= */
          <div className="register-success-view">
            <div className="success-icon-wrap">
              <CheckCircle2 size={46} color="#10b981" />
            </div>
            <h2 className="success-title">회원가입 신청 완료</h2>
            <p className="success-desc">
              <strong>{registeredUserInfo?.name}</strong> 님의 가입 신청이 성공적으로 접수되었습니다!
            </p>

            <div className="success-info-box">
              <div className="success-info-row">
                <span className="info-label">신청 구분</span>
                <span className="info-value">
                  {registeredUserInfo?.role === 'teacher' ? '👨‍🏫 교사 회원' : '🎒 학생 회원'}
                </span>
              </div>
              <div className="success-info-row">
                <span className="info-label">등록 아이디</span>
                <span className="info-value"><code>{registeredUserInfo?.username}</code></span>
              </div>
              <div className="success-info-row">
                <span className="info-label">소속 정보</span>
                <span className="info-value">{registeredUserInfo?.detail}</span>
              </div>
              <div className="success-info-row">
                <span className="info-label">승인 상태</span>
                <span className="info-status-badge pending">
                  <ShieldCheck size={12} /> 관리자 검토 대기 중
                </span>
              </div>
            </div>

            <div className="success-notice-card">
              <Sparkles size={16} color="#6366f1" />
              <span>
                안전한 학급 플랫폼 운영을 위해 <strong>관리자가 신청 내용을 확인 후 승인</strong>하면 정식 이용이 가능합니다.
              </span>
            </div>

            <button 
              type="button" 
              className="btn-login-submit mt-3"
              onClick={handleClose}
            >
              확인하고 닫기
            </button>
          </div>
        ) : (
          /* =========================================================================
             가입 신청 입력 폼
             ========================================================================= */
          <div>
            {/* 헤더 */}
            <div className="login-modal-header" style={{ marginBottom: '16px' }}>
              <div className="login-brand-icon">
                <GitFork size={26} />
              </div>
              <h2 className="login-modal-title">ClassTree 회원가입</h2>
              <p className="login-modal-desc">
                선생님 및 학생을 위한 신규 계정 가입을 신청합니다.
              </p>
            </div>

            {/* 역할 선택 탭 (교사 vs 학생) */}
            <div className="register-role-toggle">
              <button
                type="button"
                className={`register-role-btn ${role === 'teacher' ? 'active' : ''}`}
                onClick={() => setRole('teacher')}
              >
                <GraduationCap size={16} />
                <span>선생님(교사) 신청</span>
              </button>
              <button
                type="button"
                className={`register-role-btn ${role === 'student' ? 'active' : ''}`}
                onClick={() => setRole('student')}
              >
                <School size={16} />
                <span>학생 신청</span>
              </button>
            </div>

            {/* 에러 알림 */}
            {errorMessage && (
              <div className="login-error-alert" style={{ marginTop: '12px' }}>
                <AlertCircle size={15} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 입력 폼 */}
            <form onSubmit={handleSubmit} className="login-form-body" style={{ marginTop: '14px' }}>
              {/* 기본 정보: 이름 & 아이디 */}
              <div className="form-row-grid">
                <div className="form-group">
                  <label className="login-field-label">이름 (성명)</label>
                  <div className="login-input-wrap">
                    <User size={15} className="login-input-icon" />
                    <input
                      type="text"
                      className="login-input"
                      placeholder="예: 홍길동"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="login-field-label">아이디 (Username)</label>
                  <div className="login-input-wrap">
                    <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 'bold' }}>@</span>
                    <input
                      type="text"
                      className="login-input"
                      placeholder="예: teacher_hong"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 비밀번호 & 비밀번호 확인 */}
              <div className="form-row-grid mt-2">
                <div className="form-group">
                  <label className="login-field-label">비밀번호</label>
                  <div className="login-input-wrap">
                    <Lock size={15} className="login-input-icon" />
                    <input
                      type="password"
                      className="login-input"
                      placeholder="4자 이상 입력"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="login-field-label">비밀번호 확인</label>
                  <div className="login-input-wrap">
                    <Lock size={15} className="login-input-icon" />
                    <input
                      type="password"
                      className="login-input"
                      placeholder="비밀번호 재입력"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 소속 학교 */}
              <div className="form-group mt-2">
                <label className="login-field-label">소속 학교</label>
                <div className="login-input-wrap">
                  <Building size={15} className="login-input-icon" />
                  <input
                    type="text"
                    className="login-input"
                    placeholder="예: 서울초등학교"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* 교사 추가 필드 */}
              {role === 'teacher' && (
                <div className="form-row-grid mt-2">
                  <div className="form-group">
                    <label className="login-field-label">담당 학년</label>
                    <select 
                      className="register-select"
                      value={teacherGrade}
                      onChange={(e) => setTeacherGrade(e.target.value)}
                    >
                      <option value="3학년">3학년</option>
                      <option value="4학년">4학년</option>
                      <option value="5학년">5학년</option>
                      <option value="6학년">6학년</option>
                      <option value="전학년">전학년/전담</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="login-field-label">담당 과목 / 보직</label>
                    <div className="login-input-wrap">
                      <BookOpen size={15} className="login-input-icon" />
                      <input
                        type="text"
                        className="login-input"
                        placeholder="예: 과학, 담임"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 학생 추가 필드: 학년 / 반 / 번호 */}
              {role === 'student' && (
                <div className="form-row-grid-3 mt-2">
                  <div className="form-group">
                    <label className="login-field-label">학년</label>
                    <select 
                      className="register-select"
                      value={studentGrade}
                      onChange={(e) => setStudentGrade(e.target.value)}
                    >
                      <option value="3">3학년</option>
                      <option value="4">4학년</option>
                      <option value="5">5학년</option>
                      <option value="6">6학년</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="login-field-label">반</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      className="register-number-input"
                      value={studentClass}
                      onChange={(e) => setStudentClass(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="login-field-label">번호</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      className="register-number-input"
                      value={studentNumber}
                      onChange={(e) => setStudentNumber(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <p className="register-submit-notice">
                * 가입 신청 후 관리자의 승인을 거쳐 정식 계정으로 등록됩니다.
              </p>

              <button type="submit" className="btn-login-submit mt-3">
                <span>가입 신청 접수하기</span>
                <ArrowRight size={16} />
              </button>
            </form>

            {/* 로그인으로 돌아가기 */}
            <div className="register-footer-link">
              <span>이미 계정이 있으신가요?</span>
              <button 
                type="button" 
                className="btn-switch-login"
                onClick={() => {
                  handleClose();
                  if (onOpenLogin) onOpenLogin();
                }}
              >
                로그인하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
