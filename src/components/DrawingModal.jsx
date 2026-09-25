import React, { useRef, useState, useEffect } from 'react';
import { Palette, Eraser, RotateCcw, Check, X } from 'lucide-react';

export default function DrawingModal({ isOpen, onClose, onSave }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#0f172a');
  const [lineWidth, setLineWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);

  const colors = ['#0f172a', '#ef4444', '#f97316', '#10b981', '#0ea5e9', '#6366f1', '#a855f7'];

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // 배경 흰색으로 초기화
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.strokeStyle = isEraser ? '#ffffff' : color;
    ctx.lineWidth = isEraser ? lineWidth * 3 : lineWidth;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Palette size={18} color="#4f46e5" />
            <span className="modal-title">손그림 / 실험 스케치 그리기</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={15} /></button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* 드로잉 도구 바 */}
          <div className="drawing-tools" style={{ width: '100%', justifyContent: 'space-between' }}>
            {/* 색상 팔레트 */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {colors.map((c) => (
                <div
                  key={c}
                  className={`color-dot ${color === c && !isEraser ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => {
                    setColor(c);
                    setIsEraser(false);
                  }}
                />
              ))}
            </div>

            {/* 도구들 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className={`btn btn-sm ${isEraser ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setIsEraser(!isEraser)}
                title="지우개 모드"
              >
                <Eraser size={14} /> 지우개
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={clearCanvas}
                title="모두 지우기"
              >
                <RotateCcw size={14} /> 전체삭제
              </button>
            </div>
          </div>

          {/* 선 굵기 조절 */}
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>굵기:</span>
            <input 
              type="range" 
              min="1" 
              max="15" 
              value={lineWidth} 
              onChange={(e) => setLineWidth(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{lineWidth}px</span>
          </div>

          {/* 캔버스 */}
          <canvas
            ref={canvasRef}
            width={460}
            height={260}
            className="drawing-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>취소</button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            <Check size={15} /> 그림 카드에 넣기
          </button>
        </div>
      </div>
    </div>
  );
}
