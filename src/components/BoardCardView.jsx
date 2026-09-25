import React from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Compass, 
  Grid, 
  Plus, 
  Layers, 
  Clock, 
  Sparkles,
  School,
  Pencil,
  Trash2
} from 'lucide-react';

export default function BoardCardView({
  teacher,
  classroom,
  onBackToClassrooms,
  onSelectBoard,
  currentRole = 'teacher',
  onOpenCreateBoardModal,
  onEditBoard,
  onDeleteBoard,
  loggedInTeacherId = 'tch-1'
}) {
  const boards = classroom?.boards || [];
  const isTeacher = currentRole === 'teacher';
  const isAdmin = currentRole === 'admin';
  const isMyTeacherBoard = teacher?.id === loggedInTeacherId;
  // 관리자는 모든 교사의 수업 차시 수정 가능 / 교사는 본인 교실만 수정 가능
  const canModify = isAdmin || (isTeacher && isMyTeacherBoard);

  return (
    <div className="card-browser-view">
      {/* 상단 브레드크럼 및 뒤로가기 헤더 */}
      <div className="browser-header">
        <button 
          className="browser-back-btn"
          onClick={onBackToClassrooms}
          title={currentRole === 'student' ? '교실 홈으로 돌아가기' : '학급 목록으로 돌아가기'}
        >
          <ArrowLeft size={16} />
          <span>{currentRole === 'student' ? '교실 홈으로' : '학급 목록으로'}</span>
        </button>

        <div style={{ marginTop: '0.75rem' }}>
          <div className="browser-path-tag">
            <span className="teacher-pill">#{teacher?.name}</span>
            <span className="path-slash">/</span>
            <span className="classroom-pill">
              <School size={12} /> {classroom?.name}
            </span>
            {isAdmin && (
              <span className="admin-permission-badge" title="시스템 관리자는 모든 선생님의 수업을 편집 및 관리할 수 있습니다.">
                👑 관리자 마스터 권한 (전체 수정 가능)
              </span>
            )}
            {isTeacher && !isMyTeacherBoard && (
              <span className="readonly-permission-badge" title="다른 선생님의 수업 목록입니다. 참관 및 열람만 가능합니다.">
                👁️ 다른 교사 수업 (열람 전용)
              </span>
            )}
          </div>
          <h2 className="browser-main-title">
            수업 차시별 주제 목록
          </h2>
          <p className="browser-subtitle">
            진행할 수업 차시를 선택하세요. 교사가 설계한 모드에 따라 <strong>지식 흐름도</strong> 또는 <strong>무한 캔버스</strong>로 연결됩니다.
          </p>
        </div>
      </div>

      {/* 수업 차시 카드 그리드 */}
      <div className="browser-cards-grid">
        {boards.map((board, index) => {
          const isGuided = board.mode === 'guided';

          return (
            <div 
              key={board.id} 
              className={`browser-entity-card board-card ${isGuided ? 'guided-mode' : 'canvas-mode'}`}
              onClick={(e) => onSelectBoard(board, e)}
            >
              <div className="entity-card-top">
                <div className={`entity-icon-badge ${isGuided ? 'guided' : 'canvas'}`}>
                  {isGuided ? <Compass size={22} /> : <Grid size={22} />}
                </div>
                <div className="card-top-tags">
                  <span className={`mode-badge ${isGuided ? 'badge-guided' : 'badge-canvas'}`}>
                    {isGuided ? '교사 주도 모드' : '무한 캔버스 모드'}
                  </span>

                  {/* 교사 본인 또는 관리자만 수정 / 삭제 가능 */}
                  {canModify && (
                    <div className="card-top-actions">
                      <button
                        type="button"
                        className="card-action-icon-btn edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onEditBoard) onEditBoard(board);
                        }}
                        title="수업 차시 정보 수정 (주제, 모드, 설명)"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        className="card-action-icon-btn delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDeleteBoard) onDeleteBoard(board);
                        }}
                        title="수업 차시 삭제 (흐름도 및 학생 산출물 정리)"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}

                  {!canModify && currentRole !== 'student' && (
                    <span className="readonly-permission-badge" style={{ fontSize: '0.68rem', padding: '1px 6px' }} title="다른 교사의 수업으로 수정할 수 없습니다">
                      열람 전용
                    </span>
                  )}
                </div>
              </div>

              <div className="board-card-step-num">차시 {index + 1}</div>
              <h3 className="entity-card-title">{board.title}</h3>

              <p className="entity-card-desc">
                {isGuided
                  ? `${board.nodes?.length || 4}단계 지식 흐름도 구조로, 교사의 진도에 맞춰 단계별 캔버스가 동기화되는 수업입니다.`
                  : '패들렛 스타일의 넓은 무한 캔버스에서 학생들이 자유롭게 글과 사진을 붙여 협업하는 수업입니다.'}
              </p>

              <div className="entity-card-footer">
                <ArrowRight size={18} className="action-arrow" />
              </div>
            </div>
          );
        })}

        {/* 새 수업 차시 개설 카드 (교사 본인 또는 관리자만 가능) */}
        {canModify && (
          <div 
            className="browser-entity-card add-card"
            onClick={() => onOpenCreateBoardModal && onOpenCreateBoardModal()}
            title="새 수업 차시 추가"
          >
            <div className="add-icon-circle">
              <Plus size={24} />
            </div>
            <h3 className="add-card-title">새 수업 차시 추가</h3>
            <p className="add-card-desc">교사 주도 흐름도 또는 무한 캔버스 수업을 새로 만듭니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
