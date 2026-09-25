import React, { useState } from 'react';
import { 
  Users, 
  X, 
  Copy, 
  Check, 
  ShieldCheck, 
  GraduationCap, 
  UserPlus, 
  Trash2, 
  KeyRound, 
  Sparkles,
  ArrowLeftRight
} from 'lucide-react';

export default function ClassroomMembersModal({
  isOpen,
  onClose,
  classroom,
  onUpdateMembers,
  currentTeacherName = '김길동T'
}) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'teacher' | 'student'
  
  // 직접 추가 폼 상태
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('co_teacher'); // 'co_teacher' | 'student'
  const [showAddForm, setShowAddForm] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen || !classroom) return null;

  const members = classroom.members || [];
  const inviteCode = classroom.code || 'CLS-100';

  // 초대 코드 클립보드 복사
  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    showNotice(`학급 초대 코드 [ ${inviteCode} ] 가 클립보드에 복사되었습니다.`);
    setTimeout(() => setCopied(false), 2500);
  };

  const showNotice = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  // 역할 전환: 'co_teacher' <-> 'student'
  const handleToggleRole = (memberId, targetRole) => {
    const updated = members.map((m) => {
      if (m.id === memberId) {
        if (m.role === 'owner') return m; // 대표 개설 교사는 유지
        return {
          ...m,
          role: targetRole
        };
      }
      return m;
    });

    onUpdateMembers(classroom.id, updated);
    const targetMember = members.find((m) => m.id === memberId);
    const roleLabel = targetRole === 'co_teacher' ? '공동 수업 교사' : '학생';
    showNotice(`'${targetMember?.name}'님의 역할이 [${roleLabel}]로 변경되었습니다.`);
  };

  // 멤버 제외
  const handleRemoveMember = (memberId, memberName) => {
    if (window.confirm(`'${memberName}' 님을 학급에서 제외하시겠습니까?`)) {
      const updated = members.filter((m) => m.id !== memberId);
      onUpdateMembers(classroom.id, updated);
      showNotice(`'${memberName}' 님이 학급에서 제외되었습니다.`);
    }
  };

  // 신규 멤버 직접 등록
  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberUsername.trim()) {
      alert('이름과 사용자 아이디를 모두 입력해주세요.');
      return;
    }

    // 아이디 중복 검사
    if (members.some((m) => m.username === newMemberUsername.trim())) {
      alert('이미 학급에 등록된 아이디입니다.');
      return;
    }

    const newMember = {
      id: newMemberRole === 'co_teacher' ? `tch-ext-${Date.now()}` : `std-ext-${Date.now()}`,
      name: newMemberName.trim(),
      username: newMemberUsername.trim(),
      role: newMemberRole,
      studentNo: newMemberRole === 'student' ? '10199' : undefined,
      email: `${newMemberUsername.trim()}@school.edu`
    };

    const updated = [...members, newMember];
    onUpdateMembers(classroom.id, updated);
    setNewMemberName('');
    setNewMemberUsername('');
    setShowAddForm(false);
    showNotice(`'${newMember.name}'님이 [${newMemberRole === 'co_teacher' ? '공동 수업 교사' : '학생'}]로 등록되었습니다.`);
  };

  // 필터링된 멤버
  const filteredMembers = members.filter((m) => {
    if (activeTab === 'teacher') return m.role === 'owner' || m.role === 'co_teacher';
    if (activeTab === 'student') return m.role === 'student';
    return true;
  });

  const teacherCount = members.filter((m) => m.role === 'owner' || m.role === 'co_teacher').length;
  const studentCount = members.filter((m) => m.role === 'student').length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content classroom-members-modal" onClick={(e) => e.stopPropagation()}>
        {/* 모달 헤더 */}
        <div className="modal-header">
          <div className="classroom-members-modal-title-group">
            <div className="classroom-modal-badge">
              <Users size={18} />
              <span>{classroom.grade || '학급'}</span>
            </div>
            <div>
              <h3 className="modal-title">{classroom.name} · 참여 인원 관리</h3>
              <p className="modal-desc-sub">
                학급 고유 코드로 초대하고, 인원별 권한(공동 수업 교사 / 학생)을 설정합니다.
              </p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* 상태 알림 토스트 메시지 */}
          {statusMessage && (
            <div className="member-status-toast">
              <Sparkles size={16} />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* 1. 학급 고유 초대 코드 공유 카드 */}
          <div className="classroom-code-card">
            <div className="code-card-info">
              <div className="code-card-label">
                <KeyRound size={15} />
                <span>학급 고유 초대 코드</span>
              </div>
              <div className="code-card-display">
                <span className="code-text">{inviteCode}</span>
                <span className="code-hint">
                  (동료 교사에게 공유 시 <strong>공동 수업 교사</strong>, 학생에게 공유 시 <strong>학생</strong>으로 참여 가능)
                </span>
              </div>
            </div>
            <button 
              type="button" 
              className={`btn-copy-code ${copied ? 'copied' : ''}`}
              onClick={handleCopyCode}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? '복사 완료!' : '초대 코드 복사'}</span>
            </button>
          </div>

          {/* 2. 참여 인원 탭 및 상단 툴바 */}
          <div className="members-toolbar">
            <div className="members-tab-group">
              <button 
                type="button"
                className={`member-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                전체 <span className="tab-count">{members.length}</span>
              </button>
              <button 
                type="button"
                className={`member-tab-btn ${activeTab === 'teacher' ? 'active' : ''}`}
                onClick={() => setActiveTab('teacher')}
              >
                교사 <span className="tab-count">{teacherCount}</span>
              </button>
              <button 
                type="button"
                className={`member-tab-btn ${activeTab === 'student' ? 'active' : ''}`}
                onClick={() => setActiveTab('student')}
              >
                학생 <span className="tab-count">{studentCount}</span>
              </button>
            </div>

            <button 
              type="button"
              className="btn-add-member-toggle"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <UserPlus size={15} />
              <span>{showAddForm ? '추가 폼 닫기' : '인원 직접 등록'}</span>
            </button>
          </div>

          {/* 인원 직접 등록 폼 (토글 시 노출) */}
          {showAddForm && (
            <form className="add-member-form" onSubmit={handleAddMember}>
              <div className="form-row">
                <div className="form-group">
                  <label>이름</label>
                  <input 
                    type="text"
                    placeholder="예: 박영희T 또는 이서준"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>아이디 (ID)</label>
                  <input 
                    type="text"
                    placeholder="예: teacher_park 또는 std_10105"
                    value={newMemberUsername}
                    onChange={(e) => setNewMemberUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>부여할 역할</label>
                  <select 
                    value={newMemberRole} 
                    onChange={(e) => setNewMemberRole(e.target.value)}
                  >
                    <option value="co_teacher">공동 수업 교사</option>
                    <option value="student">학생</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary btn-submit-member">
                  등록
                </button>
              </div>
            </form>
          )}

          {/* 3. 인원 목록 리스트 */}
          <div className="members-list-container">
            <div className="members-list-header">
              <span className="col-info">사용자 정보 및 아이디</span>
              <span className="col-role">담당 역할 설정</span>
              <span className="col-action">관리</span>
            </div>

            <div className="members-list">
              {filteredMembers.map((member) => {
                const isOwner = member.role === 'owner';
                const isCoTeacher = member.role === 'co_teacher';
                const isStudent = member.role === 'student';

                return (
                  <div key={member.id} className={`member-row ${isOwner ? 'owner-row' : ''}`}>
                    {/* 사용자 정보 */}
                    <div className="member-info-col">
                      <div className={`member-avatar ${isStudent ? 'avatar-student' : 'avatar-teacher'}`}>
                        {isStudent ? <GraduationCap size={16} /> : <ShieldCheck size={16} />}
                      </div>
                      <div className="member-meta">
                        <div className="member-name-row">
                          <strong className="member-name">{member.name}</strong>
                          {isOwner && <span className="owner-crown-tag">👑 개설 담당</span>}
                        </div>
                        <div className="member-id-row">
                          <span className="member-id-badge">
                            ID: <strong>{member.username || member.id}</strong>
                          </span>
                          {member.studentNo && (
                            <span className="member-no-badge">학번: {member.studentNo}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 역할 설정 토글 버튼 그룹 */}
                    <div className="member-role-col">
                      {isOwner ? (
                        <span className="role-fixed-badge">
                          <ShieldCheck size={14} />
                          대표 개설 교사
                        </span>
                      ) : (
                        <div className="role-switch-container">
                          <button
                            type="button"
                            className={`role-switch-btn ${isCoTeacher ? 'selected-co-teacher' : ''}`}
                            onClick={() => handleToggleRole(member.id, 'co_teacher')}
                            title="공동 수업 교사로 지정"
                          >
                            <ShieldCheck size={13} />
                            공동 수업 교사
                          </button>
                          <button
                            type="button"
                            className={`role-switch-btn ${isStudent ? 'selected-student' : ''}`}
                            onClick={() => handleToggleRole(member.id, 'student')}
                            title="학생으로 지정"
                          >
                            <GraduationCap size={13} />
                            학생
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 관리 액션 */}
                    <div className="member-action-col">
                      {!isOwner ? (
                        <button
                          type="button"
                          className="btn-remove-member"
                          onClick={() => handleRemoveMember(member.id, member.name)}
                          title="학급에서 제외"
                        >
                          <Trash2 size={14} />
                          <span>제외</span>
                        </button>
                      ) : (
                        <span className="action-placeholder">-</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredMembers.length === 0 && (
                <div className="members-empty">
                  해당 역할에 속한 인원이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="modal-footer">
          <div className="modal-footer-tip">
            💡 교실 개설 교사는 언제든 인원의 역할을 '공동 수업 교사' 또는 '학생'으로 변경할 수 있습니다.
          </div>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            완료 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
