import React, { useState, useEffect } from 'react';
import { 
  X, 
  Compass, 
  Grid, 
  Pencil, 
  Check, 
  BookOpen, 
  Sparkles 
} from 'lucide-react';

export default function EditBoardModal({
  isOpen,
  onClose,
  board,
  onSaveBoard
}) {
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState('guided');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (board && isOpen) {
      setTitle(board.title || '');
      setMode(board.mode || 'guided');
      setDescription(board.description || '');
    }
  }, [board, isOpen]);

  if (!isOpen || !board) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('수업 차시 주제(제목)를 입력해 주세요.');
      return;
    }

    onSaveBoard(board.id, {
      title: title.trim(),
      mode,
      description: description.trim()
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content create-board-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '560px' }}
      >
        {/* 모달 헤더 */}
        <div className="modal-header">
          <div className="modal-header-with-icon">
            <div className="create-board-icon-badge" style={{ background: '#eef2ff', color: '#4f46e5' }}>
              <Pencil size={20} />
            </div>
            <div>
              <h3 className="modal-title">수업 차시 정보 수정</h3>
              <p className="modal-subtitle">
                <strong>{board.title}</strong>의 수업 주제 및 모드를 변경합니다.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* 폼 본문 */}
        <form onSubmit={handleSubmit} className="modal-body-form">
          {/* 수업 주제(제목) */}
          <div className="form-group">
            <label className="form-label required">수업 차시 주제 (제목)</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="예: 3차시. 간이 풍향·풍속계로 바람 측정하기"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* 수업 진행 모드 선택 */}
          <div className="form-group">
            <label className="form-label required">수업 운영 모드 선택</label>
            <div className="mode-selection-cards">
              {/* 1. 교사 주도 흐름도 모드 */}
              <div 
                className={`mode-select-card ${mode === 'guided' ? 'selected' : ''}`}
                onClick={() => setMode('guided')}
              >
                <div className="mode-card-radio">
                  <span className={`radio-dot ${mode === 'guided' ? 'checked' : ''}`} />
                </div>
                <div className="mode-card-icon guided">
                  <Compass size={22} />
                </div>
                <div className="mode-card-content">
                  <div className="mode-card-title">교사 주도 흐름도 모드</div>
                  <div className="mode-card-desc">
                    단계별 지식 흐름도(카드)를 따라 교사의 실시간 진도에 맞춰 학생 화면이 동기화되는 수업입니다.
                  </div>
                </div>
              </div>

              {/* 2. 무한 캔버스 모드 */}
              <div 
                className={`mode-select-card ${mode === 'canvas' ? 'selected' : ''}`}
                onClick={() => setMode('canvas')}
              >
                <div className="mode-card-radio">
                  <span className={`radio-dot ${mode === 'canvas' ? 'checked' : ''}`} />
                </div>
                <div className="mode-card-icon canvas">
                  <Grid size={22} />
                </div>
                <div className="mode-card-content">
                  <div className="mode-card-title">무한 캔버스 모드 (패들렛형)</div>
                  <div className="mode-card-desc">
                    넓은 자유 캔버스 공간에서 학생들이 자유롭게 글과 사진을 붙이고 협업하는 수업입니다.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 수업 차시 상세 설명 */}
          <div className="form-group">
            <label className="form-label">수업 안내 및 설명 (선택)</label>
            <textarea 
              className="form-textarea" 
              rows={2}
              placeholder="예: 간이 풍향·풍속계를 제작한 뒤 운동장에 나가 관찰 결과를 기록합니다."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* 모달 푸터 버튼 */}
          <div className="modal-footer-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              취소
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ minWidth: '110px' }}
            >
              <Check size={15} />
              <span>변경사항 저장</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
