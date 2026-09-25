import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Lock, 
  Unlock, 
  ShieldAlert, 
  Users, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle
} from 'lucide-react';

export default function TimerControl({
  currentRole,
  isLocked,
  setIsLocked,
  requireApproval,
  setRequireApproval,
  onlineStudentsCount = 5,
  lessonCode = 'SCI-502',
  onTimerExpire
}) {
  const [inputMinutes, setInputMinutes] = useState('10');
  const [inputSeconds, setInputSeconds] = useState('00');
  const [baseTotalSeconds, setBaseTotalSeconds] = useState(600);
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [isRunning, setIsRunning] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Timer Countdown Logic
  useEffect(() => {
    let timer = null;
    if (isRunning && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsLocked(true); // 자동 잠금
            if (onTimerExpire) onTimerExpire();
            setInputMinutes('00');
            setInputSeconds('00');
            return 0;
          }
          const next = prev - 1;
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, secondsLeft, setIsLocked, onTimerExpire]);

  // 분 직접 타이핑 입력 핸들러
  const handleMinutesChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = Math.min(999, parseInt(raw, 10) || 0);
    setInputMinutes(raw === '' ? '' : String(num));
    const s = parseInt(inputSeconds, 10) || 0;
    const total = (raw === '' ? 0 : num) * 60 + s;
    setSecondsLeft(total);
    setBaseTotalSeconds(total);
  };

  // 초 직접 타이핑 입력 핸들러
  const handleSecondsChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = Math.min(59, parseInt(raw, 10) || 0);
    setInputSeconds(raw === '' ? '' : String(num));
    const m = parseInt(inputMinutes, 10) || 0;
    const total = m * 60 + (raw === '' ? 0 : num);
    setSecondsLeft(total);
    setBaseTotalSeconds(total);
  };

  // 입력란 포커스 아웃 시 두 자리 포맷팅
  const handleInputBlur = () => {
    const m = parseInt(inputMinutes, 10) || 0;
    const s = Math.min(59, parseInt(inputSeconds, 10) || 0);
    setInputMinutes(String(m).padStart(2, '0'));
    setInputSeconds(String(s).padStart(2, '0'));
    const total = m * 60 + s;
    setSecondsLeft(total);
    setBaseTotalSeconds(total);
  };

  // 시작 / 일시정지
  const handleStartPause = () => {
    if (!isRunning) {
      const m = parseInt(inputMinutes, 10) || 0;
      const s = Math.min(59, parseInt(inputSeconds, 10) || 0);
      const total = secondsLeft > 0 ? secondsLeft : m * 60 + s;
      if (total <= 0) {
        alert('1초 이상의 시간을 입력해 주세요.');
        return;
      }
      setInputMinutes(String(Math.floor(total / 60)).padStart(2, '0'));
      setInputSeconds(String(total % 60).padStart(2, '0'));
      setSecondsLeft(total);
      setIsRunning(true);
    } else {
      setIsRunning(false);
      const m = Math.floor(secondsLeft / 60);
      const s = secondsLeft % 60;
      setInputMinutes(String(m).padStart(2, '0'));
      setInputSeconds(String(s).padStart(2, '0'));
    }
  };

  // 리셋 (입력했던 기본 시간으로 복귀)
  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(baseTotalSeconds);
    const m = Math.floor(baseTotalSeconds / 60);
    const s = baseTotalSeconds % 60;
    setInputMinutes(String(m).padStart(2, '0'));
    setInputSeconds(String(s).padStart(2, '0'));
  };

  // 프리셋 버튼 클릭
  const handlePreset = (m) => {
    setIsRunning(false);
    const total = m * 60;
    setBaseTotalSeconds(total);
    setSecondsLeft(total);
    setInputMinutes(String(m).padStart(2, '0'));
    setInputSeconds('00');
  };

  // +1분, +5분 빠른 시간 추가
  const handleAddTime = (addSeconds) => {
    const next = secondsLeft + addSeconds;
    setSecondsLeft(next);
    setBaseTotalSeconds((prev) => Math.max(prev, next));
    const m = Math.floor(next / 60);
    const s = next % 60;
    setInputMinutes(String(m).padStart(2, '0'));
    setInputSeconds(String(s).padStart(2, '0'));
  };

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // 학생 모드일 때 보여줄 상단 공지 배너
  if (currentRole === 'student') {
    return (
      <>
        <div className={`student-notice-banner ${isLocked ? 'locked-alert' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isLocked ? (
              <>
                <Lock size={18} />
                <span>선생님이 활동을 마감했습니다 (읽기 전용 모드)</span>
              </>
            ) : (
              <>
                <Clock size={18} />
                <span>활동 남은 시간: <strong>{formatTime(secondsLeft)}</strong></span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem' }}>
            <span>접속자 {onlineStudentsCount}명</span>
            {requireApproval && <span>(게시글 사전 승인 적용 중)</span>}
          </div>
        </div>
      </>
    );
  }

  // 교사 및 관리자 모드용 정밀 제어 바
  return (
    <div className="control-bar">
      {/* 1. 교사용 타이머 컨트롤 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="timer-box">
          <Clock size={18} color="var(--primary)" />

          {/* 타이머 동작 중: 실시간 남은 시간 표시 (클릭 시 일시정지 후 수정 가능) */}
          {isRunning ? (
            <span 
              className={`timer-display ${secondsLeft <= 60 ? 'urgent' : ''}`}
              onClick={handleStartPause}
              title="클릭하여 일시정지 후 시간 수정"
              style={{ cursor: 'pointer' }}
            >
              {formatTime(secondsLeft)}
            </span>
          ) : (
            /* 타이머 정지/대기 중: 원하는 숫자를 직접 타이핑하여 입력 */
            <div className="timer-input-group" title="분과 초를 직접 입력하세요 (Enter를 누르면 시작)">
              <input
                type="text"
                inputMode="numeric"
                className="timer-num-input"
                value={inputMinutes}
                onChange={handleMinutesChange}
                onBlur={handleInputBlur}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => { if (e.key === 'Enter') handleStartPause(); }}
                placeholder="10"
                title="분 입력 (클릭 후 직접 타이핑)"
              />
              <span className="timer-sep">:</span>
              <input
                type="text"
                inputMode="numeric"
                className="timer-num-input"
                value={inputSeconds}
                onChange={handleSecondsChange}
                onBlur={handleInputBlur}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => { if (e.key === 'Enter') handleStartPause(); }}
                placeholder="00"
                title="초 입력 (0~59)"
              />
            </div>
          )}

          <button 
            className={`btn btn-sm ${isRunning ? 'btn-secondary' : 'btn-primary'}`}
            onClick={handleStartPause}
            title={isRunning ? '타이머 일시정지' : '타이머 시작'}
          >
            {isRunning ? <Pause size={13} /> : <Play size={13} />}
            {isRunning ? '일시정지' : '시작'}
          </button>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={handleReset}
            title="타이머 처음 시간으로 리셋"
          >
            <RotateCcw size={13} />
          </button>
        </div>

        {/* 타이머 프리셋 & 연장 버튼 */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {[3, 5, 10, 15, 20].map((m) => (
            <button
              key={m}
              className={`btn btn-sm ${!isRunning && parseInt(inputMinutes, 10) === m && (parseInt(inputSeconds, 10) || 0) === 0 ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              onClick={() => handlePreset(m)}
              title={`${m}분으로 설정`}
            >
              {m}분
            </button>
          ))}
          <button
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#4f46e5' }}
            onClick={() => handleAddTime(60)}
            title="1분 연장"
          >
            +1분
          </button>
          <button
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#4f46e5' }}
            onClick={() => handleAddTime(300)}
            title="5분 연장"
          >
            +5분
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={{ 
              padding: '0.25rem 0.65rem', 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              background: 'linear-gradient(135deg, #eef2ff 0%, #fce7f3 100%)', 
              border: '1px solid #c7d2fe', 
              color: '#4338ca',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
            onClick={() => onTimerExpire && onTimerExpire()}
            title="학생들의 시선을 집중시키는 화려한 폭죽 축하 애니메이션을 화면에 띄웁니다"
          >
            <span>🎉</span>
            <span>폭죽/시선집중</span>
          </button>
        </div>
      </div>

      {/* 2. 교실 잠금 & 안전 통제 도구 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* 긴급 수동 잠금 버튼 */}
        <button 
          className={`btn btn-sm ${isLocked ? 'btn-danger' : 'btn-secondary'}`}
          onClick={() => setIsLocked(!isLocked)}
          title={isLocked ? '보드 잠금 해제 (학생 작성 허용)' : '보드 즉시 잠금 (학생 작성 중단)'}
        >
          {isLocked ? <Lock size={15} /> : <Unlock size={15} />}
          {isLocked ? '보드 잠김 (읽기 전용)' : '보드 열림 (작성 가능)'}
        </button>

        {/* 게시글 사전 승인제 토글 */}
        <button
          className={`btn btn-sm ${requireApproval ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setRequireApproval(!requireApproval)}
          title="학생이 작성한 글을 교사가 승인해야 전체 보드에 게시되는 모드"
        >
          <ShieldAlert size={14} />
          게시글 사전 승인 {requireApproval ? 'ON' : 'OFF'}
        </button>

        {/* 수업 QR 및 학생 참여 안내 */}
        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => setShowQrModal(true)}
          title="학생 입장용 QR 코드 및 접속 링크 보기"
        >
          <QrCode size={14} /> 수업 입장 코드 [{lessonCode}]
        </button>

        {/* 접속 학생 현황 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#64748b' }}>
          <Users size={15} />
          <span>온라인 <strong>{onlineStudentsCount}</strong>명</span>
        </div>
      </div>

      {/* QR 모달 */}
      {showQrModal && (
        <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="modal-content" style={{ maxWidth: '380px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">학생 접속 안내</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowQrModal(false)}>닫기</button>
            </div>
            <div className="modal-body">
              <div style={{ 
                width: '180px', 
                height: '180px', 
                margin: '0 auto 1rem', 
                background: '#f1f5f9', 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '2px dashed #94a3b8'
              }}>
                <QrCode size={120} color="#4f46e5" />
              </div>
              <h4 style={{ marginBottom: '6px' }}>수업 링크 접속</h4>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                학생 기기 카메라로 QR을 스캔하거나, 링크로 입장하여 학번/이름으로 로그인하세요.
              </p>
              <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                https://classtree.edu/join?code={lessonCode}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
