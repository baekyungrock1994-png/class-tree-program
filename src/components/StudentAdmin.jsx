import React, { useState, useMemo } from 'react';
import { 
  UserCheck, 
  KeyRound, 
  UserX, 
  Check, 
  X, 
  AlertCircle, 
  ShieldCheck, 
  RefreshCw,
  Search,
  Plus,
  Edit3,
  GraduationCap,
  School,
  UserPlus,
  Lock,
  ArrowRightLeft,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Users,
  Layers,
  LayoutGrid,
  List,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function StudentAdmin({
  isOpen,
  onClose,
  users = [],
  setUsers,
  teachers = [],
  setTeachers,
  students = [],
  setStudents,
  changeRequests = [],
  setChangeRequests
}) {
  // 모달 상단 탭: 'users' (전체 계정), 'pending' (가입 승인/반려 대기), 'classes' (학생 학년·반별 보기), 'requests' (프로필 변경)
  const [activeTab, setActiveTab] = useState('users');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'teacher', 'student'
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // 아이디(Username) 인라인 수정 상태
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUsernameInput, setEditUsernameInput] = useState('');

  // 비밀번호 직접 변경 모달/상태
  const [pwTargetUser, setPwTargetUser] = useState(null);
  const [customPasswordInput, setCustomPasswordInput] = useState('');

  // 신규 사용자 직접 등록 모달
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('1234');
  const [newUserRole, setNewUserRole] = useState('student');
  const [newUserGrade, setNewUserGrade] = useState(5);
  const [newUserClassNum, setNewUserClassNum] = useState(1);
  const [newUserDetail, setNewUserDetail] = useState('');

  // 가입 신청 반려 입력 모달 상태
  const [rejectingUser, setRejectingUser] = useState(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  // 학년·반별 보기 필터 및 모드 상태
  const [classGradeFilter, setClassGradeFilter] = useState('all'); // 'all', '4', '5', '6'
  const [classNumFilter, setClassNumFilter] = useState('all'); // 'all', '1', '2'
  const [classViewMode, setClassViewMode] = useState('grid'); // 'grid' | 'table'
  const [classSearchQuery, setClassSearchQuery] = useState('');

  // 학생 학년/반 변경 모달 상태
  const [changingGradeStudent, setChangingGradeStudent] = useState(null);
  const [targetNewGrade, setTargetNewGrade] = useState(5);
  const [targetNewClassNum, setTargetNewClassNum] = useState(1);

  const showToast = (msg) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(''), 4500);
  };

  // 대기 중인 가입 신청 목록 계산
  const pendingUsers = users.filter((u) => u.status === 'pending');
  const rejectedUsers = users.filter((u) => u.status === 'rejected');

  // =========================================================================
  // 1. 회원가입 승인 & 반려 기능
  // =========================================================================
  // 1-1. 개별 가입 승인
  const handleApproveUser = (user) => {
    // 1) users 상태를 active로 갱신
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: 'active', joinedDate: '오늘 승인됨' } : u))
    );

    // 2) 교사면 teachers 목록에 등록
    if (user.role === 'teacher') {
      const exists = teachers.some((t) => t.name === user.name || t.id === user.refId);
      if (!exists) {
        const teacherId = user.refId || `tch-${Date.now().toString().slice(-4)}`;
        const newTeacherObj = {
          id: teacherId,
          name: user.name.endsWith('T') ? user.name : `${user.name}T`,
          role: '교사',
          color: '#3b82f6',
          classrooms: [
            {
              id: `cls-${Date.now()}`,
              name: `${user.name} 선생님의 첫 번째 교실`,
              grade: '일반',
              code: `CLS-${Math.floor(100 + Math.random() * 900)}`,
              members: [{ id: teacherId, name: user.name, role: 'owner', email: user.email || 'user@school.edu' }],
              boards: []
            }
          ]
        };
        setTeachers((prev) => [...prev, newTeacherObj]);
      }
    } else {
      // 3) 학생이면 students 목록에 등록
      const exists = students.some((s) => s.name === user.name || s.id === user.refId);
      if (!exists) {
        const stdId = user.refId || `std-${Date.now().toString().slice(-4)}`;
        const g = user.grade || 5;
        const c = user.classNum || 1;
        const newStudentObj = {
          id: stdId,
          studentNo: user.studentNo || `${g}0${c}99`,
          name: user.name,
          grade: g,
          classNum: c,
          className: `${g}학년 ${c}반`,
          group: '1조',
          status: 'active',
          isOnline: true
        };
        setStudents((prev) => [...prev, newStudentObj]);
      }
    }

    showToast(`[${user.name} (${user.role === 'teacher' ? '교사' : '학생'})] 님의 가입 신청이 승인되어 정식 계정으로 등록되었습니다.`);
  };

  // 1-2. 가입 반려 처리
  const handleConfirmReject = (e) => {
    e.preventDefault();
    if (!rejectingUser) return;

    const reason = rejectReasonInput.trim() || '학적 및 신원 확인 불가';
    setUsers((prev) =>
      prev.map((u) =>
        u.id === rejectingUser.id
          ? { ...u, status: 'rejected', rejectedReason: reason }
          : u
      )
    );

    showToast(`[${rejectingUser.name}] 님의 가입 신청을 반려했습니다. (사유: ${reason})`);
    setRejectingUser(null);
    setRejectReasonInput('');
  };

  // 1-3. 대기 중인 모든 회원 일괄 승인
  const handleApproveAllPending = () => {
    if (pendingUsers.length === 0) return;
    pendingUsers.forEach((u) => handleApproveUser(u));
    showToast(`대기 중이던 ${pendingUsers.length}건의 가입 신청이 모두 일괄 승인되었습니다.`);
  };

  // 1-4. 반려된 사용자 재승인
  const handleReApproveUser = (user) => {
    handleApproveUser(user);
    showToast(`반려되었던 [${user.name}] 님의 계정을 재승인하였습니다.`);
  };

  // 1-5. 가입 신청 테스트 시뮬레이션 생성
  const handleSimulateNewRegistration = (roleType) => {
    const randomId = Date.now().toString().slice(-4);
    const isTch = roleType === 'teacher';
    const fakeUser = isTch
      ? {
          id: `usr-pending-${Date.now()}`,
          name: `박새롬T`,
          username: `teacher_park${randomId}`,
          password: 'password123!',
          role: 'teacher',
          email: `park${randomId}@school.edu`,
          detail: '영어과 전담 교사 (신규 가입 신청)',
          joinedDate: '방금 전',
          status: 'pending',
          requestReason: '스마트 영어 교실 수업 개설 및 학생 협동 학습용'
        }
      : {
          id: `usr-pending-${Date.now()}`,
          name: `송민서`,
          username: `std_501${randomId.slice(-2)}`,
          password: 'password123!',
          role: 'student',
          grade: 5,
          classNum: 1,
          studentNo: `501${randomId.slice(-2)}`,
          email: `std501${randomId.slice(-2)}@school.edu`,
          detail: '5학년 1반 (신규 스마트기기 가입)',
          joinedDate: '방금 전',
          status: 'pending',
          requestReason: '과학 탐구 프로젝트 수업 참가용 가입 신청'
        };

    setUsers((prev) => [fakeUser, ...prev]);
    showToast(`테스트 가입 신청이 접수되었습니다: [${fakeUser.name} (${isTch ? '교사' : '학생'})]`);
  };

  // =========================================================================
  // 2. 비밀번호 및 아이디 제어
  // =========================================================================
  const handleResetPassword = (user) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id ? { ...u, password: 'password123!' } : u
      )
    );
    showToast(`[${user.name} (${user.username})] 계정의 비밀번호가 기본값 '1234'로 즉시 초기화되었습니다.`);
  };

  const handleSaveCustomPassword = (e) => {
    e.preventDefault();
    if (!pwTargetUser || !customPasswordInput.trim()) return;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === pwTargetUser.id ? { ...u, password: customPasswordInput.trim() } : u
      )
    );
    showToast(`[${pwTargetUser.name}] 님의 비밀번호가 성공적으로 변경되었습니다.`);
    setPwTargetUser(null);
    setCustomPasswordInput('');
  };

  const handleStartEditUsername = (user) => {
    setEditingUserId(user.id);
    setEditUsernameInput(user.username);
  };

  const handleSaveUsername = (userId) => {
    if (!editUsernameInput.trim()) return;
    const trimmed = editUsernameInput.trim();

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, username: trimmed } : u))
    );
    setEditingUserId(null);
    showToast(`계정 아이디가 '${trimmed}'(으)로 변경되었습니다.`);
  };

  // 권한(교사 <-> 학생) 변경
  const handleToggleUserRole = (user) => {
    const nextRole = user.role === 'teacher' ? 'student' : 'teacher';

    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u))
    );

    if (nextRole === 'teacher') {
      const exists = teachers.some((t) => t.name === user.name || t.id === user.refId);
      if (!exists) {
        const newTeacherId = `tch-${Date.now().toString().slice(-4)}`;
        setTeachers((prev) => [
          ...prev,
          {
            id: newTeacherId,
            name: user.name.endsWith('T') ? user.name : `${user.name}T`,
            role: '과목 교사',
            color: '#6366f1',
            classrooms: []
          }
        ]);
      }
      showToast(`[${user.name}] 님의 권한이 '교사(Teacher)'로 변경되었습니다.`);
    } else {
      const exists = students.some((s) => s.name === user.name || s.id === user.refId);
      if (!exists) {
        const stdId = `std-${Date.now().toString().slice(-4)}`;
        setStudents((prev) => [
          ...prev,
          {
            id: stdId,
            studentNo: '50199',
            name: user.name.replace(/T$/, ''),
            grade: 5,
            classNum: 1,
            className: '5학년 1반',
            group: '1조',
            status: 'active',
            isOnline: true
          }
        ]);
      }
      showToast(`[${user.name}] 님의 권한이 '학생(Student)'으로 변경되었습니다.`);
    }
  };

  // 사용자 삭제
  const handleDeleteUser = (userId, userName) => {
    if (!window.confirm(`정말 [${userName}] 사용자를 삭제(탈퇴) 처리하시겠습니까?`)) return;
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    showToast(`[${userName}] 계정이 정상적으로 삭제되었습니다.`);
  };

  // 신규 사용자 직접 등록
  const handleAddNewUser = (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserUsername.trim()) {
      alert('이름과 아이디를 입력해 주세요.');
      return;
    }

    const newId = `usr-${Date.now()}`;
    const newUser = {
      id: newId,
      name: newUserName.trim(),
      username: newUserUsername.trim(),
      password: newUserPassword || '1234',
      role: newUserRole,
      grade: newUserRole === 'student' ? Number(newUserGrade) : undefined,
      classNum: newUserRole === 'student' ? Number(newUserClassNum) : undefined,
      studentNo: newUserRole === 'student' ? `${newUserGrade}0${newUserClassNum}99` : undefined,
      email: `${newUserUsername.trim()}@school.edu`,
      detail: newUserDetail.trim() || (newUserRole === 'teacher' ? '신임 교사' : `${newUserGrade}학년 ${newUserClassNum}반 신입생`),
      joinedDate: '오늘 등록',
      status: 'active'
    };

    setUsers((prev) => [newUser, ...prev]);

    if (newUserRole === 'teacher') {
      const teacherId = `tch-${Date.now().toString().slice(-4)}`;
      setTeachers((prev) => [
        ...prev,
        {
          id: teacherId,
          name: newUserName.endsWith('T') ? newUserName : `${newUserName}T`,
          role: '교사',
          color: '#3b82f6',
          classrooms: []
        }
      ]);
    } else {
      const stdId = `std-${Date.now().toString().slice(-4)}`;
      setStudents((prev) => [
        ...prev,
        {
          id: stdId,
          studentNo: newUser.studentNo,
          name: newUserName,
          grade: Number(newUserGrade),
          classNum: Number(newUserClassNum),
          className: `${newUserGrade}학년 ${newUserClassNum}반`,
          group: '1조',
          status: 'active',
          isOnline: true
        }
      ]);
    }

    setIsAddUserOpen(false);
    setNewUserName('');
    setNewUserUsername('');
    setNewUserPassword('1234');
    setNewUserDetail('');
    showToast(`신규 ${newUserRole === 'teacher' ? '교사' : '학생'} [${newUser.name}] 계정이 생성되었습니다.`);
  };

  // =========================================================================
  // 3. 학생 학년·반 관리 및 이동(전반/진급)
  // =========================================================================
  const handleOpenGradeClassModal = (student) => {
    setChangingGradeStudent(student);
    setTargetNewGrade(student.grade || 5);
    setTargetNewClassNum(student.classNum || 1);
  };

  const handleSaveStudentGradeClass = (e) => {
    e.preventDefault();
    if (!changingGradeStudent) return;

    const g = Number(targetNewGrade);
    const c = Number(targetNewClassNum);
    const newClassName = `${g}학년 ${c}반`;

    // 1) students 상태 갱신
    setStudents((prev) =>
      prev.map((s) =>
        s.id === changingGradeStudent.id
          ? { ...s, grade: g, classNum: c, className: newClassName }
          : s
      )
    );

    // 2) users 상태 동기화
    setUsers((prev) =>
      prev.map((u) =>
        u.refId === changingGradeStudent.id || u.name === changingGradeStudent.name
          ? { ...u, grade: g, classNum: c, detail: `${newClassName} 학생` }
          : u
      )
    );

    showToast(`[${changingGradeStudent.name}] 학생이 [${newClassName}]으로 배정/이동되었습니다.`);
    setChangingGradeStudent(null);
  };

  // 학생 목록 필터링
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesGrade = classGradeFilter === 'all' || String(s.grade) === classGradeFilter;
      const matchesClass = classNumFilter === 'all' || String(s.classNum) === classNumFilter;
      const matchesSearch =
        s.name.toLowerCase().includes(classSearchQuery.toLowerCase()) ||
        (s.studentNo && s.studentNo.includes(classSearchQuery)) ||
        (s.className && s.className.toLowerCase().includes(classSearchQuery.toLowerCase()));
      return matchesGrade && matchesClass && matchesSearch;
    });
  }, [students, classGradeFilter, classNumFilter, classSearchQuery]);

  // 학년·반별 그룹핑 데이터 계산
  const classGroups = useMemo(() => {
    const groups = {};
    students.forEach((s) => {
      const g = s.grade || 5;
      const c = s.classNum || 1;
      const key = `${g}-${c}`;
      if (!groups[key]) {
        groups[key] = {
          grade: g,
          classNum: c,
          title: `${g}학년 ${c}반`,
          students: []
        };
      }
      groups[key].students.push(s);
    });

    // 정렬 (학년 오름차순, 반 오름차순)
    return Object.values(groups).sort((a, b) => a.grade - b.grade || a.classNum - b.classNum);
  }, [students]);

  // 필터링된 유저 목록 (전체 계정 탭용)
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.detail && u.detail.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content admin-modal-wide"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '1280px', width: '96vw', maxHeight: '92vh' }}
      >
        {/* 헤더 */}
        <div className="modal-header admin-modal-header">
          <div className="admin-header-title-wrap">
            <div className="admin-modal-icon-badge">
              <ShieldCheck size={24} color="#6366f1" />
            </div>
            <div>
              <div className="admin-title-row">
                <h2>통합 관리자 콘솔</h2>
                <span className="admin-master-badge">최고 관리자 마스터 권한</span>
              </div>
              <p className="modal-subtitle">
                교사 및 학생의 회원가입 승인·반려, 학년/반 분류 조회, 계정 아이디 수정 및 비밀번호 초기화를 통합 관리합니다.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-close-modal" 
            onClick={onClose} 
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* 안내 피드백 토스트 알림바 */}
        {feedbackMessage && (
          <div className="admin-feedback-banner">
            <CheckCircle2 size={16} />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* 탭 네비게이션 */}
        <div className="admin-tab-nav">
          <button
            className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} />
            <span>전체 회원 계정 관리</span>
            <span className="tab-count-pill">{users.length}</span>
          </button>

          <button
            className={`admin-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <Clock size={16} />
            <span>가입 승인 / 반려 대기</span>
            {pendingUsers.length > 0 ? (
              <span className="tab-count-pill alert-badge">{pendingUsers.length}</span>
            ) : (
              <span className="tab-count-pill">0</span>
            )}
          </button>

          <button
            className={`admin-tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
            onClick={() => setActiveTab('classes')}
          >
            <School size={16} />
            <span>학생 학년·반별 보기</span>
            <span className="tab-count-pill">{students.length}명</span>
          </button>

          <button
            className={`admin-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <Edit3 size={16} />
            <span>프로필 변경 승인</span>
            {changeRequests.length > 0 && (
              <span className="tab-count-pill alert-badge">{changeRequests.length}</span>
            )}
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="modal-body admin-modal-body">
          {/* ========================================================================= */}
          {/* TAB 1: 가입 승인 / 반려 대기 탭 */}
          {/* ========================================================================= */}
          {activeTab === 'pending' && (
            <div className="pending-approvals-view">
              <div className="admin-tab-header-row">
                <div>
                  <h3 className="admin-section-title">
                    신규 회원가입 승인 대기 목록
                    <span className="pending-badge-counter">{pendingUsers.length}건 대기 중</span>
                  </h3>
                  <p className="admin-section-desc">
                    교사 및 학생이 새로 가입 신청한 계정입니다. 소속을 확인하고 승인하거나 사유를 적어 반려할 수 있습니다.
                  </p>
                </div>
                <div className="admin-action-btn-group">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleSimulateNewRegistration('teacher')}
                    title="교사 가입 신청 테스트 데이터 생성"
                  >
                    <Plus size={13} /> 교사 신청 테스트
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleSimulateNewRegistration('student')}
                    title="학생 가입 신청 테스트 데이터 생성"
                  >
                    <Plus size={13} /> 학생 신청 테스트
                  </button>
                  {pendingUsers.length > 0 && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleApproveAllPending}
                    >
                      <CheckCircle2 size={14} /> 전체 일괄 승인
                    </button>
                  )}
                </div>
              </div>

              {pendingUsers.length === 0 ? (
                <div className="admin-empty-state-card">
                  <CheckCircle2 size={44} color="#10b981" />
                  <h4>현재 대기 중인 회원가입 신청이 없습니다.</h4>
                  <p>모든 가입 신청이 승인되었거나 처리 완료되었습니다.</p>
                </div>
              ) : (
                <div className="pending-cards-grid">
                  {pendingUsers.map((user) => {
                    const isTch = user.role === 'teacher';
                    return (
                      <div key={user.id} className="pending-approval-card">
                        <div className="pending-card-top">
                          <span className={`role-badge ${isTch ? 'teacher' : 'student'}`}>
                            {isTch ? <GraduationCap size={13} /> : <School size={13} />}
                            {isTch ? '교사 가입 신청' : '학생 가입 신청'}
                          </span>
                          <span className="pending-date-pill">
                            <Clock size={12} /> {user.joinedDate || '오늘'}
                          </span>
                        </div>

                        <div className="pending-card-user-info">
                          <div className="pending-avatar-placeholder">
                            {user.name.slice(0, 1)}
                          </div>
                          <div>
                            <strong className="pending-user-name">{user.name}</strong>
                            <div className="pending-user-sub">
                              <span className="pending-username-text">아이디: <code>{user.username}</code></span>
                              {user.email && <span className="pending-email-text">• {user.email}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="pending-meta-box">
                          {isTch ? (
                            <div className="pending-meta-item">
                              <span className="meta-label">담당 정보:</span>
                              <span className="meta-value">{user.detail || '과목 교사 신청'}</span>
                            </div>
                          ) : (
                            <div className="pending-meta-item">
                              <span className="meta-label">희망 학년/반:</span>
                              <span className="meta-value">
                                <strong>{user.grade || 5}학년 {user.classNum || 1}반</strong> (학번: {user.studentNo || '배정대기'})
                              </span>
                            </div>
                          )}
                          <div className="pending-meta-item">
                            <span className="meta-label">가입 사유:</span>
                            <span className="meta-value highlight-reason">
                              {user.requestReason || '수업 및 학급 활동 참여를 위한 신규 가입'}
                            </span>
                          </div>
                        </div>

                        <div className="pending-card-actions">
                          <button
                            type="button"
                            className="btn btn-success btn-sm btn-approve"
                            onClick={() => handleApproveUser(user)}
                          >
                            <Check size={14} />
                            <span>가입 승인</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm btn-reject"
                            onClick={() => {
                              setRejectingUser(user);
                              setRejectReasonInput('소속 학교 학적부 명단 불일치');
                            }}
                          >
                            <X size={14} />
                            <span>반려</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 반려된 신청 내역 접이식 */}
              {rejectedUsers.length > 0 && (
                <div className="rejected-history-section mt-4">
                  <h4 className="rejected-section-title">
                    <XCircle size={15} color="#ef4444" />
                    <span>최근 반려된 가입 신청 목록 ({rejectedUsers.length}건)</span>
                  </h4>
                  <div className="rejected-items-list">
                    {rejectedUsers.map((rej) => (
                      <div key={rej.id} className="rejected-item-row">
                        <div className="rejected-item-info">
                          <span className="rejected-name">{rej.name}</span>
                          <span className="rejected-username">({rej.username})</span>
                          <span className="rejected-reason-pill">사유: {rej.rejectedReason || '확인 불가'}</span>
                        </div>
                        <div className="rejected-actions">
                          <button
                            className="btn btn-secondary btn-xs"
                            onClick={() => handleReApproveUser(rej)}
                          >
                            재승인
                          </button>
                          <button
                            className="btn btn-outline-danger btn-xs"
                            onClick={() => handleDeleteUser(rej.id, rej.name)}
                          >
                            완전 삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: 학생 학년·반별 보기 시스템 */}
          {/* ========================================================================= */}
          {activeTab === 'classes' && (
            <div className="classes-management-view">
              <div className="admin-tab-header-row">
                <div>
                  <h3 className="admin-section-title">
                    학생 학년·반별 보기 및 학급 관리
                    <span className="pending-badge-counter student-total">{filteredStudents.length}명 조회됨</span>
                  </h3>
                  <p className="admin-section-desc">
                    학생들을 학년과 반별로 정돈하여 조회하고, 학년·반 이동(전반/진급)을 손쉽게 설정할 수 있습니다.
                  </p>
                </div>

                {/* 뷰 모드 전환 토글 (학급 카드 모아보기 vs 명단 테이블) */}
                <div className="view-mode-toggle-group">
                  <button
                    className={`btn btn-xs ${classViewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setClassViewMode('grid')}
                    title="학급별 카드 모아보기"
                  >
                    <LayoutGrid size={13} />
                    <span>학급 카드 모아보기</span>
                  </button>
                  <button
                    className={`btn btn-xs ${classViewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setClassViewMode('table')}
                    title="전체 명단 테이블 보기"
                  >
                    <List size={13} />
                    <span>명단 테이블</span>
                  </button>
                </div>
              </div>

              {/* 학년 & 반 퀵 필터 바 */}
              <div className="class-filter-toolbar">
                <div className="filter-segment-group">
                  <span className="filter-label">학년 선택:</span>
                  <div className="pill-segment">
                    {['all', '4', '5', '6'].map((g) => (
                      <button
                        key={g}
                        className={`pill-btn ${classGradeFilter === g ? 'active' : ''}`}
                        onClick={() => setClassGradeFilter(g)}
                      >
                        {g === 'all' ? '전체 학년' : `${g}학년`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-segment-group">
                  <span className="filter-label">반 선택:</span>
                  <div className="pill-segment">
                    {['all', '1', '2'].map((c) => (
                      <button
                        key={c}
                        className={`pill-btn ${classNumFilter === c ? 'active' : ''}`}
                        onClick={() => setClassNumFilter(c)}
                      >
                        {c === 'all' ? '전체 반' : `${c}반`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="class-search-box">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="학생 이름 / 학번 검색..."
                    value={classSearchQuery}
                    onChange={(e) => setClassSearchQuery(e.target.value)}
                  />
                  {classSearchQuery && (
                    <button className="btn-clear-search" onClick={() => setClassSearchQuery('')}>
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* [모드 1] 학급별 카드 모아보기 */}
              {classViewMode === 'grid' && (
                <div className="class-groups-grid">
                  {classGroups
                    .filter((grp) => {
                      const matchesG = classGradeFilter === 'all' || String(grp.grade) === classGradeFilter;
                      const matchesC = classNumFilter === 'all' || String(grp.classNum) === classNumFilter;
                      return matchesG && matchesC;
                    })
                    .map((group) => {
                      const groupStudents = group.students.filter((s) => {
                        if (!classSearchQuery) return true;
                        return (
                          s.name.toLowerCase().includes(classSearchQuery.toLowerCase()) ||
                          (s.studentNo && s.studentNo.includes(classSearchQuery))
                        );
                      });

                      return (
                        <div key={`${group.grade}-${group.classNum}`} className="classroom-group-card">
                          <div className="classroom-group-header">
                            <div className="classroom-group-title-wrap">
                              <School size={18} color="#6366f1" />
                              <strong className="classroom-group-title">{group.title}</strong>
                            </div>
                            <span className="classroom-group-count">
                              학생 {groupStudents.length}명
                            </span>
                          </div>

                          <div className="classroom-students-chip-container">
                            {groupStudents.length === 0 ? (
                              <div className="empty-group-text">해당하는 학생이 없습니다.</div>
                            ) : (
                              groupStudents.map((std) => (
                                <div key={std.id} className="student-grid-chip">
                                  <div className="student-chip-info">
                                    <span className={`status-dot ${std.isOnline ? 'online' : 'offline'}`} />
                                    <span className="chip-name">{std.name}</span>
                                    <span className="chip-no">({std.studentNo || '번호없음'})</span>
                                    {std.group && <span className="chip-group-tag">{std.group}</span>}
                                  </div>
                                  <button
                                    className="btn-move-class-chip"
                                    onClick={() => handleOpenGradeClassModal(std)}
                                    title="반 변경 / 진급"
                                  >
                                    <ArrowRightLeft size={11} />
                                    <span>이동</span>
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* [모드 2] 명단 테이블 보기 */}
              {classViewMode === 'table' && (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>학번</th>
                        <th>이름</th>
                        <th>학년 / 반</th>
                        <th>소속 분반(조)</th>
                        <th>접속 상태</th>
                        <th style={{ textAlign: 'right' }}>학급 이동(반 변경)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4">
                            해당 조건의 학생이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((std) => (
                          <tr key={std.id}>
                            <td>
                              <code>{std.studentNo || '-'}</code>
                            </td>
                            <td>
                              <strong className="user-name-text">{std.name}</strong>
                            </td>
                            <td>
                              <span className="grade-class-tag">
                                {std.grade || 5}학년 {std.classNum || 1}반
                              </span>
                            </td>
                            <td>
                              <span className="group-badge">{std.group || '배정대기'}</span>
                            </td>
                            <td>
                              {std.isOnline ? (
                                <span className="status-badge active">
                                  <span className="status-dot online" /> 온라인
                                </span>
                              ) : (
                                <span className="status-badge offline">
                                  <span className="status-dot offline" /> 오프라인
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="btn btn-secondary btn-xs"
                                onClick={() => handleOpenGradeClassModal(std)}
                              >
                                <ArrowRightLeft size={12} />
                                <span>학년·반 변경</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: 전체 회원 계정 관리 탭 (기존 기능 + 상태 배지 연동) */}
          {/* ========================================================================= */}
          {activeTab === 'users' && (
            <div className="users-management-view">
              {/* 필터 및 검색 바 */}
              <div className="admin-filter-bar">
                <div className="admin-filter-roles">
                  <button
                    className={`role-filter-btn ${roleFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setRoleFilter('all')}
                  >
                    전체 ({users.length})
                  </button>
                  <button
                    className={`role-filter-btn ${roleFilter === 'teacher' ? 'active' : ''}`}
                    onClick={() => setRoleFilter('teacher')}
                  >
                    <GraduationCap size={14} /> 교사 ({users.filter((u) => u.role === 'teacher').length})
                  </button>
                  <button
                    className={`role-filter-btn ${roleFilter === 'student' ? 'active' : ''}`}
                    onClick={() => setRoleFilter('student')}
                  >
                    <School size={14} /> 학생 ({users.filter((u) => u.role === 'student').length})
                  </button>
                </div>

                <div className="admin-search-wrap">
                  <Search size={15} />
                  <input
                    type="text"
                    placeholder="이름, 아이디, 이메일 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                      <X size={13} />
                    </button>
                  )}
                </div>

                <button
                  className="btn btn-primary btn-sm btn-add-user"
                  onClick={() => setIsAddUserOpen(true)}
                >
                  <UserPlus size={14} /> 신규 회원 직접 등록
                </button>
              </div>

              {/* 회원 목록 테이블 */}
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: '110px' }}>이름</th>
                      <th style={{ minWidth: '160px' }}>계정 아이디 (Username)</th>
                      <th style={{ minWidth: '95px' }}>상태</th>
                      <th style={{ minWidth: '95px' }}>현재 역할(권한)</th>
                      <th style={{ minWidth: '140px' }}>소속 / 비고</th>
                      <th style={{ textAlign: 'center', minWidth: '190px' }}>비밀번호 관리</th>
                      <th style={{ textAlign: 'right', minWidth: '170px' }}>권한 변경 및 삭제</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4">
                          조건에 부합하는 가입 회원이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const isTeacher = user.role === 'teacher';
                        const isPending = user.status === 'pending';
                        const isRejected = user.status === 'rejected';

                        return (
                          <tr key={user.id} className={isPending ? 'pending-row' : ''}>
                            {/* 이름 */}
                            <td>
                              <div className="user-name-col">
                                <strong className="user-name-text">{user.name}</strong>
                                <span className="user-email-text">{user.email || '-'}</span>
                              </div>
                            </td>

                            {/* 아이디 (인라인 수정 지원) */}
                            <td>
                              {editingUserId === user.id ? (
                                <div className="inline-edit-username-wrap">
                                  <input
                                    type="text"
                                    className="inline-username-input"
                                    value={editUsernameInput}
                                    onChange={(e) => setEditUsernameInput(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveUsername(user.id);
                                      if (e.key === 'Escape') setEditingUserId(null);
                                    }}
                                  />
                                  <button
                                    className="btn-icon-save"
                                    onClick={() => handleSaveUsername(user.id)}
                                    title="저장"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button
                                    className="btn-icon-cancel"
                                    onClick={() => setEditingUserId(null)}
                                    title="취소"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <div className="username-display-wrap">
                                  <code className="user-id-code">{user.username}</code>
                                  <button
                                    className="btn-edit-inline"
                                    onClick={() => handleStartEditUsername(user)}
                                    title="아이디 수정"
                                  >
                                    <Edit3 size={12} />
                                    <span>수정</span>
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* 상태 배지 */}
                            <td>
                              {isPending ? (
                                <span className="status-badge pending">
                                  <Clock size={11} /> 가입 대기
                                </span>
                              ) : isRejected ? (
                                <span className="status-badge rejected">
                                  <XCircle size={11} /> 반려됨
                                </span>
                              ) : (
                                <span className="status-badge active">
                                  <Check size={11} /> 승인 완료
                                </span>
                              )}
                            </td>

                            {/* 역할(권한) 배지 */}
                            <td>
                              <span className={`role-badge ${isTeacher ? 'teacher' : 'student'}`}>
                                {isTeacher ? <GraduationCap size={12} /> : <School size={12} />}
                                {isTeacher ? '교사' : '학생'}
                              </span>
                            </td>

                            {/* 비고/세부정보 */}
                            <td>
                              <span className="user-detail-text">
                                {user.detail || (user.grade ? `${user.grade}학년 ${user.classNum}반` : '-')}
                              </span>
                            </td>

                            {/* 비밀번호 관리 */}
                            <td style={{ textAlign: 'center' }}>
                              <div className="pw-actions-group">
                                <button
                                  className="btn-reset-quick"
                                  onClick={() => handleResetPassword(user)}
                                  title="비밀번호를 기본값 '1234'로 1초 초기화"
                                >
                                  <RefreshCw size={12} />
                                  <span>1234로 초기화</span>
                                </button>
                                <button
                                  className="btn-change-pw"
                                  onClick={() => {
                                    setPwTargetUser(user);
                                    setCustomPasswordInput('');
                                  }}
                                  title="관리자가 새 비밀번호를 직접 입력하여 지정"
                                >
                                  <KeyRound size={12} />
                                  <span>비번 변경</span>
                                </button>
                              </div>
                            </td>

                            {/* 권한 변경(교사<->학생) & 삭제 */}
                            <td style={{ textAlign: 'right' }}>
                              <div className="table-actions-right">
                                {isPending ? (
                                  <button
                                    className="btn btn-success btn-xs"
                                    onClick={() => handleApproveUser(user)}
                                    title="가입 신청 승인"
                                  >
                                    <Check size={12} />
                                    <span>승인</span>
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-secondary btn-xs btn-toggle-role"
                                    onClick={() => handleToggleUserRole(user)}
                                    title={`현재 ${isTeacher ? '교사' : '학생'} 권한을 ${isTeacher ? '학생' : '교사'}으로 전환`}
                                  >
                                    <ArrowRightLeft size={12} />
                                    <span>{isTeacher ? '학생으로 변경' : '교사로 변경'}</span>
                                  </button>
                                )}
                                <button
                                  className="btn-icon-trash"
                                  onClick={() => handleDeleteUser(user.id, user.name)}
                                  title="계정 삭제"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: 학생 프로필 변경 요청 승인 탭 */}
          {/* ========================================================================= */}
          {activeTab === 'requests' && (
            <div className="requests-view">
              <div className="admin-section-info">
                <h3>학생 프로필 변경 요청 내역</h3>
                <p>학생들이 이름, 학번, 닉네임 수정을 요청한 건을 검토하고 승인하거나 반려합니다.</p>
              </div>

              {changeRequests.length === 0 ? (
                <div className="admin-empty-state-card">
                  <CheckCircle2 size={40} color="#10b981" />
                  <h4>현재 대기 중인 프로필 변경 신청이 없습니다.</h4>
                </div>
              ) : (
                <div className="requests-cards-list">
                  {changeRequests.map((req) => (
                    <div key={req.id} className="request-approval-card">
                      <div className="request-card-header">
                        <span className="req-type-pill">{req.requestType}</span>
                        <span className="req-date-text">{req.requestDate}</span>
                      </div>
                      <div className="request-card-body">
                        <h4>{req.studentName} 학생 ({req.studentNo})</h4>
                        <div className="req-comparison">
                          <span className="req-target-label">변경 요청값:</span>
                          <strong className="req-new-val">{req.requestedValue}</strong>
                        </div>
                        <div className="req-reason">
                          <span className="req-target-label">사유:</span>
                          <span>{req.reason}</span>
                        </div>
                      </div>
                      <div className="request-card-actions">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => {
                            setStudents(
                              students.map((s) => (s.id === req.studentId ? { ...s, name: '도윤이대장' } : s))
                            );
                            setChangeRequests(changeRequests.filter((r) => r.id !== req.id));
                            showToast(`[${req.studentName}] 학생의 정보 변경 신청을 승인했습니다.`);
                          }}
                        >
                          <Check size={14} /> 승인
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => {
                            setChangeRequests(changeRequests.filter((r) => r.id !== req.id));
                            showToast(`[${req.studentName}] 학생의 정보 변경 요청을 반려했습니다.`);
                          }}
                        >
                          <X size={14} /> 반려
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 모달 1: 비밀번호 직접 변경 다이얼로그 */}
        {/* ========================================================================= */}
        {pwTargetUser && (
          <div className="submodal-overlay" onClick={() => setPwTargetUser(null)}>
            <div className="submodal-card" onClick={(e) => e.stopPropagation()}>
              <div className="submodal-header">
                <div className="submodal-title-with-icon">
                  <KeyRound size={20} color="#6366f1" />
                  <h4>비밀번호 직접 변경</h4>
                </div>
                <button className="btn-close-submodal" onClick={() => setPwTargetUser(null)}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveCustomPassword}>
                <div className="submodal-body">
                  <div className="target-user-info-box">
                    <strong>{pwTargetUser.name}</strong> 님 ({pwTargetUser.username})
                    <span className="user-role-text">
                      {pwTargetUser.role === 'teacher' ? '교사' : '학생'}
                    </span>
                  </div>

                  <div className="form-group mt-3">
                    <label>새로 지정할 비밀번호</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="예: pass1234!"
                      value={customPasswordInput}
                      onChange={(e) => setCustomPasswordInput(e.target.value)}
                      autoFocus
                      required
                    />
                    <small className="form-hint">
                      * 입력 즉시 해당 계정의 비밀번호로 적용됩니다.
                    </small>
                  </div>
                </div>

                <div className="submodal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPwTargetUser(null)}
                  >
                    취소
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    비밀번호 저장
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 모달 2: 가입 반려 사유 입력 다이얼로그 */}
        {/* ========================================================================= */}
        {rejectingUser && (
          <div className="submodal-overlay" onClick={() => setRejectingUser(null)}>
            <div className="submodal-card" onClick={(e) => e.stopPropagation()}>
              <div className="submodal-header">
                <div className="submodal-title-with-icon">
                  <XCircle size={20} color="#ef4444" />
                  <h4>가입 신청 반려</h4>
                </div>
                <button className="btn-close-submodal" onClick={() => setRejectingUser(null)}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleConfirmReject}>
                <div className="submodal-body">
                  <div className="target-user-info-box">
                    <strong>{rejectingUser.name}</strong> ({rejectingUser.username}) 님의 가입 신청을 반려하시겠습니까?
                  </div>

                  <div className="form-group mt-3">
                    <label>반려 사유 입력</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="예: 소속 학교 명단 불일치, 외부 신청자 등"
                      value={rejectReasonInput}
                      onChange={(e) => setRejectReasonInput(e.target.value)}
                      autoFocus
                      required
                    />
                    <div className="quick-reason-pills mt-2">
                      <button
                        type="button"
                        className="quick-pill-btn"
                        onClick={() => setRejectReasonInput('소속 학교 학적부 명단 불일치')}
                      >
                        학적부 불일치
                      </button>
                      <button
                        type="button"
                        className="quick-pill-btn"
                        onClick={() => setRejectReasonInput('학교 외부 비인가 신청자')}
                      >
                        외부 비인가자
                      </button>
                      <button
                        type="button"
                        className="quick-pill-btn"
                        onClick={() => setRejectReasonInput('신청 정보(이름/학번) 오기재')}
                      >
                        정보 오기재
                      </button>
                    </div>
                  </div>
                </div>

                <div className="submodal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setRejectingUser(null)}
                  >
                    취소
                  </button>
                  <button type="submit" className="btn btn-danger btn-sm">
                    반려 확정
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 모달 3: 학생 학년 / 반 변경 다이얼로그 */}
        {/* ========================================================================= */}
        {changingGradeStudent && (
          <div className="submodal-overlay" onClick={() => setChangingGradeStudent(null)}>
            <div className="submodal-card" onClick={(e) => e.stopPropagation()}>
              <div className="submodal-header">
                <div className="submodal-title-with-icon">
                  <School size={20} color="#6366f1" />
                  <h4>학생 학년·반 배정 / 변경</h4>
                </div>
                <button className="btn-close-submodal" onClick={() => setChangingGradeStudent(null)}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveStudentGradeClass}>
                <div className="submodal-body">
                  <div className="target-user-info-box">
                    <strong>{changingGradeStudent.name}</strong> 학생
                    <span className="user-role-text">
                      현재: {changingGradeStudent.grade || 5}학년 {changingGradeStudent.classNum || 1}반
                    </span>
                  </div>

                  <div className="grade-class-select-row mt-3">
                    <div className="form-group flex-1">
                      <label>배정 학년</label>
                      <select
                        className="form-control"
                        value={targetNewGrade}
                        onChange={(e) => setTargetNewGrade(Number(e.target.value))}
                      >
                        <option value={4}>4학년</option>
                        <option value={5}>5학년</option>
                        <option value={6}>6학년</option>
                      </select>
                    </div>

                    <div className="form-group flex-1">
                      <label>배정 반</label>
                      <select
                        className="form-control"
                        value={targetNewClassNum}
                        onChange={(e) => setTargetNewClassNum(Number(e.target.value))}
                      >
                        <option value={1}>1반</option>
                        <option value={2}>2반</option>
                        <option value={3}>3반</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="submodal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setChangingGradeStudent(null)}
                  >
                    취소
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    학급 이동 저장
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 모달 4: 신규 회원 직접 추가 다이얼로그 */}
        {/* ========================================================================= */}
        {isAddUserOpen && (
          <div className="submodal-overlay" onClick={() => setIsAddUserOpen(false)}>
            <div className="submodal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
              <div className="submodal-header">
                <div className="submodal-title-with-icon">
                  <UserPlus size={20} color="#6366f1" />
                  <h4>신규 회원 계정 직접 등록</h4>
                </div>
                <button className="btn-close-submodal" onClick={() => setIsAddUserOpen(false)}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddNewUser}>
                <div className="submodal-body">
                  <div className="form-group">
                    <label>역할 선택</label>
                    <div className="role-radio-group">
                      <label className={`role-radio-label ${newUserRole === 'student' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="role"
                          value="student"
                          checked={newUserRole === 'student'}
                          onChange={() => setNewUserRole('student')}
                        />
                        <School size={15} />
                        <span>학생 (Student)</span>
                      </label>
                      <label className={`role-radio-label ${newUserRole === 'teacher' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="role"
                          value="teacher"
                          checked={newUserRole === 'teacher'}
                          onChange={() => setNewUserRole('teacher')}
                        />
                        <GraduationCap size={15} />
                        <span>교사 (Teacher)</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-row mt-2">
                    <div className="form-group flex-1">
                      <label>이름</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={newUserRole === 'teacher' ? '예: 박보영T' : '예: 송민서'}
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group flex-1">
                      <label>아이디 (Username)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="예: user1234"
                        value={newUserUsername}
                        onChange={(e) => setNewUserUsername(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {newUserRole === 'student' && (
                    <div className="form-row mt-2">
                      <div className="form-group flex-1">
                        <label>학년</label>
                        <select
                          className="form-control"
                          value={newUserGrade}
                          onChange={(e) => setNewUserGrade(Number(e.target.value))}
                        >
                          <option value={4}>4학년</option>
                          <option value={5}>5학년</option>
                          <option value={6}>6학년</option>
                        </select>
                      </div>
                      <div className="form-group flex-1">
                        <label>반</label>
                        <select
                          className="form-control"
                          value={newUserClassNum}
                          onChange={(e) => setNewUserClassNum(Number(e.target.value))}
                        >
                          <option value={1}>1반</option>
                          <option value={2}>2반</option>
                          <option value={3}>3반</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="form-group mt-2">
                    <label>초기 비밀번호</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="기본값: 1234"
                    />
                  </div>

                  <div className="form-group mt-2">
                    <label>소속 / 세부 비고</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={newUserRole === 'teacher' ? '예: 5학년 2반 담임' : '예: 1조 조장'}
                      value={newUserDetail}
                      onChange={(e) => setNewUserDetail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="submodal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsAddUserOpen(false)}
                  >
                    취소
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    계정 등록 완료
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
