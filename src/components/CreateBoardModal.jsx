import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  X, 
  Compass, 
  Grid, 
  Layers, 
  BookOpen, 
  Sparkles,
  Check,
  Copy,
  School,
  CheckCircle2,
  FileText
} from 'lucide-react';

export default function CreateBoardModal({
  isOpen,
  onClose,
  classroom,
  onCreateBoard,
  availableClassrooms = []
}) {
  const [tab, setTab] = useState('scratch'); // 'scratch' | 'copy'

  // 직접 새로 만들기 상태
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState('guided'); // 'guided' | 'canvas'
  const [description, setDescription] = useState('');

  // 다른 교실 차시 복사하기 상태
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [copyTitle, setCopyTitle] = useState('');
  const [copyStudentPosts, setCopyStudentPosts] = useState(false);

  // 모달이 열리거나 availableClassrooms가 변경될 때 초기 교실 및 차시 세팅
  useEffect(() => {
    if (isOpen && availableClassrooms.length > 0) {
      const otherClassroom = availableClassrooms.find(c => c.id !== classroom?.id) || availableClassrooms[0];
      const initialClassroomId = otherClassroom?.id || '';
      setSelectedClassroomId(initialClassroomId);

      const targetCls = availableClassrooms.find(c => c.id === initialClassroomId);
      if (targetCls && targetCls.boards && targetCls.boards.length > 0) {
        setSelectedBoardId(targetCls.boards[0].id);
        setCopyTitle(targetCls.boards[0].title);
      } else {
        setSelectedBoardId('');
        setCopyTitle('');
      }
    }
  }, [isOpen, classroom?.id, availableClassrooms]);

  if (!isOpen) return null;

  // 교실 변경 시 해당 교실의 첫 차시 자동 선택
  const handleSelectClassroom = (clsId) => {
    setSelectedClassroomId(clsId);
    const targetCls = availableClassrooms.find(c => c.id === clsId);
    if (targetCls && targetCls.boards && targetCls.boards.length > 0) {
      setSelectedBoardId(targetCls.boards[0].id);
      setCopyTitle(targetCls.boards[0].title);
    } else {
      setSelectedBoardId('');
      setCopyTitle('');
    }
  };

  // 차시 선택 시 복사 제목 동기화
  const handleSelectBoard = (board) => {
    setSelectedBoardId(board.id);
    setCopyTitle(board.title);
  };

  const selectedSourceClassroom = availableClassrooms.find(c => c.id === selectedClassroomId);
  const sourceBoards = selectedSourceClassroom?.boards || [];
  const selectedBoardObj = sourceBoards.find(b => b.id === selectedBoardId);

  // 1. 직접 새로 만들기 제출
  const handleSubmitScratch = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('수업 차시 주제(제목)를 입력해 주세요.');
      return;
    }

    onCreateBoard({
      title: title.trim(),
      mode,
      description: description.trim(),
      sections: ['학생 발표', '선생님 자료']
    });

    // Reset form
    setTitle('');
    setDescription('');
    onClose();
  };

  // 2. 다른 교실 차시 복사하여 개설 제출
  const handleSubmitCopy = (e) => {
    e.preventDefault();
    if (!selectedBoardObj) {
      alert('복사할 원본 수업 차시를 선택해 주세요.');
      return;
    }
    if (!copyTitle.trim()) {
      alert('새로 개설할 수업 차시 제목을 입력해 주세요.');
      return;
    }

    onCreateBoard({
      isCopied: true,
      copiedBoard: selectedBoardObj,
      title: copyTitle.trim(),
      copyStudentPosts
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-board-modal" onClick={(e) => e.stopPropagation()}>
        {/* 모달 헤더 */}
        <div className="modal-header">
          <div className="modal-header-with-icon">
            <div className="create-board-icon-badge">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="modal-title">새 수업 차시 추가</h3>
              <p className="modal-subtitle-text">
                <strong>{classroom?.name}</strong>에 수업 차시를 개설합니다.
              </p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </div>

        {/* 탭 네비게이션: 직접 새로 만들기 vs 다른 교실 차시 복사하기 */}
        <div className="board-modal-tab-bar">
          <button
            type="button"
            className={`board-modal-tab ${tab === 'scratch' ? 'active' : ''}`}
            onClick={() => setTab('scratch')}
          >
            <Plus size={15} />
            <span>직접 새로 만들기</span>
          </button>
          <button
            type="button"
            className={`board-modal-tab ${tab === 'copy' ? 'active' : ''}`}
            onClick={() => setTab('copy')}
          >
            <Copy size={15} />
            <span>다른 교실 차시 복사하기</span>
          </button>
        </div>

        {tab === 'scratch' ? (
          /* 직접 새로 만들기 폼 */
          <form onSubmit={handleSubmitScratch}>
            <div className="modal-body">
              {/* 1. 수업 차시 주제/제목 */}
              <div className="form-group mb-4">
                <label className="form-label font-bold">
                  수업 차시 주제 / 제목 <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: 3단원: 바람과 기압의 이동 원리 실험"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {/* 2. 수업 진행 모드 선택 */}
              <div className="form-group mb-4">
                <label className="form-label font-bold">수업 진행 방식 (모드) 선택</label>
                <div className="board-mode-options-grid">
                  {/* 지식 흐름도 모드 */}
                  <div 
                    className={`board-mode-card ${mode === 'guided' ? 'selected' : ''}`}
                    onClick={() => setMode('guided')}
                  >
                    <div className="mode-card-header">
                      <div className="mode-card-icon guided">
                        <Compass size={22} />
                      </div>
                      <div className="mode-radio-check">
                        {mode === 'guided' && <Check size={14} />}
                      </div>
                    </div>
                    <strong className="mode-card-title">지식 흐름도 모드 (교사 주도)</strong>
                    <p className="mode-card-desc">
                      단계별 노드(1단계→2단계...)로 수업 흐름을 설계하고, 교사의 진행 단계에 맞춰 학생들의 캔버스가 실시간 동기화됩니다.
                    </p>
                    <span className="mode-badge-tag guided">개념 구조화 · 단계별 실험용</span>
                  </div>

                  {/* 무한 캔버스 모드 */}
                  <div 
                    className={`board-mode-card ${mode === 'canvas' ? 'selected' : ''}`}
                    onClick={() => setMode('canvas')}
                  >
                    <div className="mode-card-header">
                      <div className="mode-card-icon canvas">
                        <Grid size={22} />
                      </div>
                      <div className="mode-radio-check">
                        {mode === 'canvas' && <Check size={14} />}
                      </div>
                    </div>
                    <strong className="mode-card-title">무한 캔버스 모드 (자유 협업)</strong>
                    <p className="mode-card-desc">
                      전체화면 패들렛 공간에서 학생들이 자유롭게 글, 이미지, 그림을 포스트로 작성하고 브레인스토밍합니다.
                    </p>
                    <span className="mode-badge-tag canvas">토의·토론 · 프로젝트 발표용</span>
                  </div>
                </div>
              </div>

              {/* 3. 수업 안내 및 설명 (선택 사항) */}
              <div className="form-group">
                <label className="form-label font-bold">
                  수업 안내 및 설명 <span className="text-subtle font-normal" style={{ fontSize: '0.78rem' }}>(선택)</span>
                </label>
                <textarea
                  className="form-input form-textarea"
                  rows={2}
                  placeholder="학생들에게 보여질 이번 차시의 학습 목표나 안내사항을 입력하세요."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                취소
              </button>
              <button type="submit" className="btn btn-primary">
                <Plus size={16} /> 차시 개설하기
              </button>
            </div>
          </form>
        ) : (
          /* 다른 교실 차시 복사하기 폼 */
          <form onSubmit={handleSubmitCopy}>
            <div className="modal-body">
              {/* 안내 메시지 */}
              <div className="copy-board-info-banner">
                <Copy size={16} className="info-icon" />
                <span>기존 교실에서 완성해 둔 <strong>흐름도 단계 구조</strong>와 <strong>선생님 수업 자료</strong>를 그대로 가져와 빠르게 새 차시를 개설합니다.</span>
              </div>

              {/* 원본 교실 선택 */}
              <div className="form-group mb-4">
                <label className="form-label font-bold">
                  가져올 원본 교실 선택 <span className="text-danger">*</span>
                </label>
                <div className="custom-select-wrapper">
                  <select
                    className="form-input form-select"
                    value={selectedClassroomId}
                    onChange={(e) => handleSelectClassroom(e.target.value)}
                  >
                    {availableClassrooms.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        [{cls.teacherName || '교사'}] {cls.name} ({cls.grade || '일반'}) - 차시 {cls.boards?.length || 0}개 {cls.id === classroom?.id ? '(현재 교실)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 원본 차시(보드) 선택 목록 */}
              <div className="form-group mb-4">
                <label className="form-label font-bold">
                  복사할 수업 차시 선택 <span className="text-danger">*</span>
                </label>
                {sourceBoards.length === 0 ? (
                  <div className="copy-board-empty-state">
                    선택한 교실에 개설된 수업 차시가 없습니다. 다른 교실을 선택해 주세요.
                  </div>
                ) : (
                  <div className="copy-source-boards-list">
                    {sourceBoards.map((b, idx) => {
                      const isSelected = b.id === selectedBoardId;
                      const isGuided = b.mode === 'guided';
                      return (
                        <div
                          key={b.id}
                          className={`copy-source-board-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSelectBoard(b)}
                        >
                          <div className="board-item-header">
                            <div className="board-item-title-group">
                              <span className="board-item-badge">차시 {idx + 1}</span>
                              <strong className="board-item-title">{b.title}</strong>
                            </div>
                            <div className="board-item-check-icon">
                              {isSelected ? <CheckCircle2 size={18} color="#4f46e5" /> : <div className="check-ring" />}
                            </div>
                          </div>

                          <div className="board-item-meta">
                            <span className={`meta-mode-tag ${isGuided ? 'guided' : 'canvas'}`}>
                              {isGuided ? <Compass size={12} /> : <Grid size={12} />}
                              {isGuided ? '지식 흐름도 모드' : '무한 캔버스 모드'}
                            </span>
                            {isGuided && (
                              <span className="meta-nodes-tag">
                                <Layers size={12} /> {b.nodes?.length || 0}개 단계 노드
                              </span>
                            )}
                          </div>

                          {b.description && (
                            <p className="board-item-desc">{b.description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 새 차시 제목 입력 */}
              {selectedBoardObj && (
                <div className="form-group mb-4">
                  <label className="form-label font-bold">
                    현재 교실에 개설될 새 차시 제목 <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={copyTitle}
                    onChange={(e) => setCopyTitle(e.target.value)}
                    placeholder="새 차시 제목을 입력하세요."
                    required
                  />
                  <p className="form-help-text">
                    원본 차시의 이름과 다른 제목을 원하시면 자유롭게 수정하세요.
                  </p>
                </div>
              )}

              {/* 학생 글 복사 옵션 */}
              {selectedBoardObj && (
                <div className="copy-option-card">
                  <label className="copy-checkbox-label">
                    <input
                      type="checkbox"
                      checked={copyStudentPosts}
                      onChange={(e) => setCopyStudentPosts(e.target.checked)}
                    />
                    <div className="checkbox-text-wrap">
                      <strong className="checkbox-main-title">이전 학생 게시글도 함께 복제하기</strong>
                      <span className="checkbox-desc">
                        체크 해제 시 교사 안내 자료와 흐름도 단계 구조만 깨끗하게 복사됩니다. (권장)
                      </span>
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                취소
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!selectedBoardObj || !copyTitle.trim()}
              >
                <Copy size={16} /> 이 차시 복사하여 개설하기
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
