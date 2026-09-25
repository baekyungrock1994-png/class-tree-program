import React, { useState } from 'react';
import { Plus, School, BookOpen, MessageSquare, ChevronLeft, ChevronRight, User } from 'lucide-react';

export default function TeacherSidebar({
  teachers = [],
  activeTeacherId = 'tch-1',
  onSelectTeacher,
  currentRole = 'teacher',
  studentClassrooms = [],
  activeClassroomId = 'cls-101',
  onSelectStudentClassroom,
  onOpenTeacherChat,
  onOpenJoinModal,
  isCollapsed: externalIsCollapsed,
  onToggleCollapse: externalOnToggleCollapse
}) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalCollapsed;
  const handleToggle = () => {
    if (externalOnToggleCollapse) {
      externalOnToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  const isStudent = currentRole === 'student';
  const sidebarTitle = isStudent ? '교실 목록' : '선생님 보드';

  return (
    <div className={`sidebar-container ${isCollapsed ? 'collapsed' : ''}`}>
      <aside className="teacher-sidebar">
        <div className="teacher-sidebar-inner">
          {/* 1. 사이드바 상단 헤더: 교사 모드 vs 학생 모드 분기 */}
          <div className="teacher-sidebar-header">
            <span className="teacher-sidebar-brand">
              <span className="brand-icon">{isStudent ? '🏫' : '🌱'}</span>
              {sidebarTitle}
            </span>
          </div>

          {/* 2. 사이드바 리스트 */}
          <div className="teacher-list">
            {isStudent ? (
              /* 학생 모드: 학생이 가입된 교실 목록 나열 */
              studentClassrooms.map((c) => {
                const isActive = c.id === activeClassroomId;
                const teacherObj = teachers.find((t) => t.id === c.teacherId);
                const teacherName = c.teacherName || teacherObj?.name || '담당 교사';

                return (
                  <div
                    key={c.id}
                    className={`teacher-item student-room-item ${isActive ? 'active' : ''}`}
                    onClick={(e) => onSelectStudentClassroom && onSelectStudentClassroom(c, e)}
                    title={`${c.name} (${teacherName}) 수업 보드 목록 보기`}
                  >
                    <div className="student-room-icon-box">
                      <span className="student-room-icon">🏫</span>
                    </div>
                    <div className="student-room-text-group">
                      <span className="student-room-name">{c.name}</span>
                      <span className="student-room-teacher">
                        <User size={11} strokeWidth={2.4} className="student-room-teacher-icon" />
                        <span className="student-room-teacher-name">{teacherName}</span>
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              /* 교사 모드: 선생님 목록 (# 김길동T, # 홍길동T, # 남길동T) */
              teachers.map((t) => {
                const isActive = t.id === activeTeacherId;

                return (
                  <div
                    key={t.id}
                    className={`teacher-item ${isActive ? 'active' : ''}`}
                    onClick={() => onSelectTeacher && onSelectTeacher(t.id)}
                    title={`${t.name} (${t.role || '교사'})의 학급 및 수업 목록 보기`}
                  >
                    <div className="teacher-item-left">
                      <span className="teacher-hash">#</span>
                      <span className="teacher-name">{t.name}</span>
                    </div>

                    {/* 점3개 자리에 배치된 말풍선 채팅 버튼 */}
                    <button 
                      type="button"
                      className="teacher-item-chat-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenTeacherChat) onOpenTeacherChat(t);
                      }}
                      aria-label={`${t.name} 선생님과 협업 채팅`}
                      title={`${t.name} 선생님과 협업 채팅`}
                    >
                      <MessageSquare size={16} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* 3. 사이드바 하단 버튼 */}
          {(currentRole === 'teacher' || currentRole === 'admin') ? (
            <div className="teacher-sidebar-footer">
              <button 
                className="sidebar-add-btn"
                onClick={() => onOpenJoinModal && onOpenJoinModal('teacher')}
                title="학급 고유 코드로 협동 교사를 초대하거나 다른 교실에 공동교사로 참여합니다."
              >
                <Plus size={15} />
                <span>협동 교사 초대 / 참여</span>
              </button>
            </div>
          ) : (
            <div className="teacher-sidebar-footer">
              <button 
                className="sidebar-add-btn"
                onClick={() => onOpenJoinModal && onOpenJoinModal('student')}
                title="선생님이 공유해주신 학급 고유 코드를 입력하여 새 교실에 참여합니다."
              >
                <Plus size={15} />
                <span>새 교실 참여하기</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 중간에 위치한 사이드바 접기/열기 버튼 (화면 넓게 쓰기) */}
      <button 
        type="button"
        className="sidebar-toggle-btn"
        onClick={handleToggle}
        title={isCollapsed ? `${sidebarTitle} 열기` : `${sidebarTitle} 접기 (화면 넓게 쓰기)`}
        aria-label={isCollapsed ? `${sidebarTitle} 열기` : `${sidebarTitle} 접기`}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </div>
  );
}
