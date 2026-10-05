import React, { useState, useMemo, useRef } from 'react';
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
  
  // 드래그 중 창 바깥에서 마우스를 뗐을 때 팝업이 닫히는 문제 방지 ref
  const isBackdropMouseDownRef = useRef(false);

  // 학생용 필드: 학교 급별 선택 ('초등학교', '중학교', '고등학교')
  const [schoolType, setSchoolType] = useState('초등학교'); // '초등학교' | '중학교' | '고등학교'
  const [studentGrade, setStudentGrade] = useState('1');
  const [studentClass, setStudentClass] = useState('1');

  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredUserInfo, setRegisteredUserInfo] = useState(null);

  // 학교 구분에 따른 선택 가능한 학년 목록 계산
  const availableGrades = useMemo(() => {
    if (schoolType === '초등학교') {
      return ['1', '2', '3', '4', '5', '6'];
    }
    return ['1', '2', '3']; // 중학교, 고등학교는 1~3학년
  }, [schoolType]);

  // 학교 구분 변경 시 현재 학년이 유효하지 않으면 1학년으로 자동 조정
  const handleSchoolTypeChange = (newType) => {
    setSchoolType(newType);
    const maxGrade = newType === '초등학교' ? 6 : 3;
    if (Number(studentGrade) > maxGrade) {
      setStudentGrade('1');
    }
  };

  if (!isOpen) return null;

  const handleClose = () => {
    setIsSuccess(false);
    setErrorMessage('');
    onClose();
  };

  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) {
      isBackdropMouseDownRef.current = true;
    } else {
      isBackdropMouseDownRef.current = false;
    }
  };

  const handleOverlayMouseUp = (e) => {
    if (e.target === e.currentTarget && isBackdropMouseDownRef.current) {
      handleClose();
    }
    isBackdropMouseDownRef.current = false;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPw = password.trim();
    const cleanPwConfirm = passwordConfirm.trim();

    // 1. 공통 유효성 검사 (이름, 아이디, 비밀번호)
    if (!cleanName || !cleanUsername || !cleanPw || !cleanPwConfirm) {
      setErrorMessage('필수 항목(이름, 아이디, 비밀번호)을 모두 입력해 주세요.');
      return;
    }

    if (cleanUsername.length < 3) {
      setErrorMessage('아이디는 최소 3자 이상 입력해 주세요.');
      return;
    }

    // 아이디 중복 검사
    const isDuplicate = (users || []).some(
      (u) => u && u.username && u.username.toLowerCase() === cleanUsername
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
      schoolLevel: role === 'student' ? schoolType : undefined,
      school: role === 'student' ? schoolType : undefined,
      grade: role === 'student' ? Number(studentGrade) : undefined,
      classNum: role === 'student' ? (Number(studentClass) || 1) : undefined,
      studentNo: role === 'student' 
        ? `${studentGrade}0${studentClass || 1}99`
        : undefined,
      detail: role === 'teacher'
        ? '교사'
        : `${schoolType} ${studentGrade}학년 ${studentClass || 1}반`,
      email: `${cleanUsername}@school.edu`,
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'pending' // 승인 대기
    };

    onRegisterSubmit(newUserObj);
    setRegisteredUserInfo(newUserObj);
    setIsSuccess(true);
  };

  return (
    <div 
      className="modal-overlay" 
      onMouseDown={handleOverlayMouseDown}
      onMouseUp={handleOverlayMouseUp}
    >
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

              {/* 학생 추가 필드: 학교 급(초/중/고) & 학년 & 반 */}
              {role === 'student' && (
                <div className="student-register-fields mt-3">
                  {/* 학교 급 설정: 초등학교 / 중학교 / 고등학교 */}
                  <div className="form-group">
                    <label className="login-field-label">학교 구분</label>
                    <div className="school-type-toggle-group">
                      {['초등학교', '중학교', '고등학교'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          className={`school-type-pill-btn ${schoolType === type ? 'active' : ''}`}
                          onClick={() => handleSchoolTypeChange(type)}
                        >
                          <School size={14} />
                          <span>{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-row-grid mt-2">
                    {/* 선택된 학교 구분에 따른 동적 학년 선택 */}
                    <div className="form-group">
                      <label className="login-field-label">학년 선택 ({schoolType})</label>
                      <select 
                        className="register-select"
                        value={studentGrade}
                        onChange={(e) => setStudentGrade(e.target.value)}
                      >
                        {availableGrades.map((g) => (
                          <option key={g} value={g}>
                            {g}학년
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 반 선택 */}
                    <div className="form-group">
                      <label className="login-field-label">반</label>
                      <div className="login-input-wrap">
                        <input
                          type="number"
                          min="1"
                          max="20"
                          className="login-input"
                          placeholder="반 입력 (예: 1)"
                          value={studentClass}
                          onChange={(e) => setStudentClass(e.target.value)}
                        />
                        <span style={{ fontSize: '13px', color: '#64748b', marginRight: '8px' }}>반</span>
                      </div>
                    </div>
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
