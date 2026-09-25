import React, { useState, useEffect } from 'react';
import { 
  School, 
  BookOpen, 
  Users, 
  ArrowRight, 
  Plus, 
  KeyRound, 
  Copy, 
  Check, 
  ShieldCheck,
  UserCheck,
  Pencil,
  Trash2,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';

export default function ClassroomCardView({
  teacher,
  onSelectClassroom,
  currentRole = 'teacher',
  onOpenMembersModal,
  onOpenCreateClassroomModal,
  onEditClassroom,
  onDeleteClassroom,
  loggedInTeacherId = 'tch-1'
}) {
  const classrooms = teacher?.classrooms || [];
  const isTeacher = currentRole === 'teacher';
  const isAdmin = currentRole === 'admin';
  const isMyTeacherBoard = teacher?.id === loggedInTeacherId;
  // 관리자는 모든 교사의 교실 수정 가능 / 교사는 본인 교실만 수정 가능
  const canModify = isAdmin || (isTeacher && isMyTeacherBoard);

  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const [codeModalClassroom, setCodeModalClassroom] = useState(null);
  const [isBigCodeView, setIsBigCodeView] = useState(false);

  // ESC 키로 모달 닫기 지원 (애플스러운 부드러운 인터랙션)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && codeModalClassroom) {
        setCodeModalClassroom(null);
        setIsBigCodeView(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [codeModalClassroom]);

  const handleCopyCode = (e, cls) => {
    if (e) e.stopPropagation();
    if (!cls?.code) return;
    navigator.clipboard.writeText(cls.code);
    setCopiedCodeId(cls.id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="card-browser-view">
      {/* 상단 타이틀 영역 */}
      <div className="browser-header">
        <div>
          <div className="browser-path-tag">
            <span className="teacher-pill">#{teacher?.name}</span>
            <span className="path-label">선생님의 개설 학급</span>
            {isAdmin && (
              <span className="admin-permission-badge" title="시스템 관리자는 모든 선생님의 교실과 수업을 수정하고 관리할 수 있습니다.">
                👑 관리자 마스터 권한 (전체 수정 가능)
              </span>
            )}
            {isTeacher && !isMyTeacherBoard && (
              <span className="readonly-permission-badge" title="다른 선생님의 학급입니다. 수업 참관 및 열람만 가능하며 수정/삭제는 제한됩니다.">
                👁️ 다른 교사 학급 (열람 전용)
              </span>
            )}
          </div>
          <h2 className="browser-main-title">
            {teacher?.name} 선생님의 교실 목록
          </h2>
          <p className="browser-subtitle">
            수업을 진행할 학급을 선택하세요. {canModify ? '학급의 [참여 인원 관리] 버튼을 눌러 공동 수업 교사와 학생의 역할을 지정하거나 초대 코드를 공유할 수 있습니다.' : '다른 선생님의 학급으로, 수업 참관 및 활동 열람이 가능합니다.'}
          </p>
        </div>
      </div>

      {/* 학급 카드 그리드 */}
      <div className="browser-cards-grid">
        {classrooms.map((cls) => {
          const members = cls.members || [];
          const teachersCount = members.filter((m) => m.role === 'owner' || m.role === 'co_teacher').length || 1;
          const studentsCount = members.filter((m) => m.role === 'student').length;

          return (
            <div 
              key={cls.id} 
              className="browser-entity-card classroom-card"
              onClick={(e) => onSelectClassroom(cls, e)}
            >
              <div className="entity-card-top">
                <div className="entity-icon-badge classroom">
                  <School size={22} />
                </div>
                <div className="card-top-tags">
                  <span className="entity-tag">{cls.grade || '일반'}</span>

                  {/* 수업 참여 코드 버튼 (애플 감성의 부드러운 캡슐 버튼) */}
                  {cls.code && (
                    <button
                      type="button"
                      className="apple-code-pill-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCodeModalClassroom(cls);
                        setIsBigCodeView(false);
                      }}
                      title="클릭하여 수업 참여 코드 확인 및 대형 화면 보기"
                    >
                      <KeyRound size={12} className="pill-key-icon" />
                      <span>수업코드</span>
                    </button>
                  )}

                  {/* 교사 본인 또는 관리자만 수정/삭제 가능 */}
                  {canModify && (
                    <div className="card-top-actions">
                      <button
                        type="button"
                        className="card-action-icon-btn edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onEditClassroom) onEditClassroom(cls);
                        }}
                        title="학급 정보 수정 (명칭, 학년, 코드 등)"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        className="card-action-icon-btn delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDeleteClassroom) onDeleteClassroom(cls);
                        }}
                        title="학급 삭제 (수업 차시 및 학생 데이터 정리)"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}

                  {!canModify && currentRole !== 'student' && (
                    <span className="readonly-permission-badge" style={{ fontSize: '0.68rem', padding: '1px 6px' }} title="다른 교사의 교실로 수정할 수 없습니다">
                      열람 전용
                    </span>
                  )}
                </div>
              </div>

              <h3 className="entity-card-title">{cls.name}</h3>

              <div className="entity-card-stats">
                <div className="stat-item" title={`개설된 수업 차시: ${cls.boards?.length || 0}개`}>
                  <BookOpen size={14} />
                  <span>수업 <strong>{cls.boards?.length || 0}개</strong></span>
                </div>
                <div className="stat-item" title={`교사 ${teachersCount}명, 학생 ${studentsCount}명 참여 중`}>
                  <Users size={14} />
                  <span>
                    교사 <strong>{teachersCount}</strong> · 학생 <strong>{studentsCount}</strong>
                  </span>
                </div>
              </div>

              <div className="entity-card-footer classroom-card-footer">
                {/* 1번 요구사항: 참여 인원 관리 버튼 */}
                <button
                  type="button"
                  className="card-manage-members-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenMembersModal) onOpenMembersModal(cls);
                  }}
                  title="공동 수업 교사 및 학생 권한/참여 인원 관리"
                >
                  <Users size={14} />
                  <span>참여 인원 관리</span>
                </button>

                <div className="card-enter-action" title="학급 수업 목록으로 이동">
                  <span className="enter-text">입장</span>
                  <ArrowRight size={16} className="action-arrow" />
                </div>
              </div>
            </div>
          );
        })}

        {/* 새 학급 개설 카드 (교사 본인 또는 관리자만 가능) */}
        {canModify && (
          <div 
            className="browser-entity-card add-card"
            onClick={onOpenCreateClassroomModal}
          >
            <div className="add-icon-circle">
              <Plus size={24} />
            </div>
            <h3 className="add-card-title">새 학급 개설하기</h3>
            <p className="add-card-desc">새로운 반이나 동아리 수업 공간을 추가합니다.</p>
          </div>
        )}
      </div>

      {/* 애플(Apple) 감성의 프리미엄 수업 코드 모달 */}
      {codeModalClassroom && (
        <div 
          className="apple-modal-overlay" 
          onClick={() => {
            setCodeModalClassroom(null);
            setIsBigCodeView(false);
          }}
        >
          <div 
            className={`apple-modal-card ${isBigCodeView ? 'big-view' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 우측 상단 애플 스타일 닫기 버튼 */}
            <button
              type="button"
              className="apple-modal-close-btn"
              onClick={() => {
                setCodeModalClassroom(null);
                setIsBigCodeView(false);
              }}
              title="닫기 (ESC)"
            >
              <X size={18} />
            </button>

            {/* 모달 헤더 */}
            <div className="apple-modal-header">
              <div className="apple-icon-circle">
                <KeyRound size={24} />
              </div>
              <span className="apple-modal-badge">{codeModalClassroom.grade || '일반'} · 수업 참여 코드</span>
              <h2 className="apple-modal-title">{codeModalClassroom.name}</h2>
            </div>

            {/* 코드 전시 박스 (기본 & 칠판/빔프로젝터 크게 보기 부드러운 전환) */}
            <div className={`apple-code-container ${isBigCodeView ? 'enlarged' : ''}`}>
              <div className="apple-code-display">
                <span className="apple-code-value">{codeModalClassroom.code}</span>
              </div>

              {/* 하단 제어 바: 복사 버튼 + 크게 보기 토글 버튼 */}
              <div className="apple-code-actions">
                <button
                  type="button"
                  className={`apple-btn-copy ${copiedCodeId === codeModalClassroom.id ? 'copied' : ''}`}
                  onClick={(e) => handleCopyCode(e, codeModalClassroom)}
                  title="클립보드에 코드 복사"
                >
                  {copiedCodeId === codeModalClassroom.id ? (
                    <>
                      <Check size={16} />
                      <span>복사 완료!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>코드 복사</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className={`apple-btn-toggle-size ${isBigCodeView ? 'active' : ''}`}
                  onClick={() => setIsBigCodeView(!isBigCodeView)}
                  title={isBigCodeView ? "기본 크기로 전환" : "교실 칠판/빔프로젝터용 대형 화면으로 확대"}
                >
                  {isBigCodeView ? (
                    <>
                      <Minimize2 size={16} />
                      <span>기본 크기로</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 size={16} />
                      <span>칠판·빔프로젝터 크게 보기</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 안내 가이드 */}
            <p className="apple-modal-guide">
              학생들이 화면 상단의 <strong>[새 교실 참여하기]</strong> 버튼을 누르고 이 코드를 입력하면 즉시 교실에 입장합니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
