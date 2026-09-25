import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, X, Sparkles, Clock, CheckCircle } from 'lucide-react';

/**
 * Web Audio API를 활용한 경쾌하고 주목도 높은 팡파레 사운드
 */
function playCelebrationSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const notes = [
      { freq: 523.25, time: 0.0, duration: 0.15 }, // C5
      { freq: 659.25, time: 0.15, duration: 0.15 }, // E5
      { freq: 783.99, time: 0.30, duration: 0.18 }, // G5
      { freq: 1046.50, time: 0.48, duration: 0.55 }, // C6 (길게)
      { freq: 880.00, time: 0.70, duration: 0.15 },  // A5
      { freq: 1046.50, time: 0.85, duration: 0.60 }  // C6 (피날레)
    ];

    notes.forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + time);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + duration);
    });
  } catch (err) {
    console.warn('AudioContext playback blocked or not supported:', err);
  }
}

export default function TimerExpireCelebrationModal({ onClose, currentRole }) {
  const canvasRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);

  // 사운드 재생
  useEffect(() => {
    if (!isMuted) {
      playCelebrationSound();
    }
  }, [isMuted]);

  // HTML5 Canvas 폭죽(Fireworks) & 콘페티(Confetti) 파티클 시스템
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const colors = [
      '#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#007aff', 
      '#5856d6', '#af52de', '#ff2d55', '#30b0c7', '#ffd60a'
    ];

    // 폭죽 로켓 및 폭발 파티클
    const particles = [];
    const rockets = [];

    class Rocket {
      constructor(targetX, targetY) {
        this.x = width * (0.2 + Math.random() * 0.6);
        this.y = height;
        this.targetX = targetX || width * (0.15 + Math.random() * 0.7);
        this.targetY = targetY || height * (0.15 + Math.random() * 0.45);
        this.speed = 12 + Math.random() * 6;
        const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.exploded = false;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.vy < 0 && this.y <= this.targetY) {
          this.explode();
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      explode() {
        this.exploded = true;
        const count = 70 + Math.floor(Math.random() * 40);
        for (let i = 0; i < count; i++) {
          particles.push(new Particle(this.x, this.y, this.color));
        }
      }
    }

    class Particle {
      constructor(x, y, baseColor) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.gravity = 0.12;
        this.friction = 0.96;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.012;
        this.color = Math.random() > 0.3 ? baseColor : colors[Math.floor(Math.random() * colors.length)];
        this.size = Math.random() * 4 + 2;
        this.isSparkle = Math.random() > 0.5;
        this.rotation = Math.random() * Math.PI;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
      }

      update() {
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
        this.rotation += this.rotationSpeed;
      }

      draw() {
        if (this.alpha <= 0) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (this.isSparkle) {
          ctx.fillStyle = this.color;
          ctx.shadowBlur = 8;
          ctx.shadowColor = this.color;
          ctx.fillRect(-this.size, -this.size / 2, this.size * 2, this.size);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, this.size, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // 화면 상단에서 지속적으로 흩날리는 콘페티
    const confettiList = [];
    for (let i = 0; i < 60; i++) {
      confettiList.push({
        x: Math.random() * width,
        y: Math.random() * height - height,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 3 + 2,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.1
      });
    }

    // 초반 폭죽 연속 발사
    rockets.push(new Rocket(width * 0.3, height * 0.25));
    rockets.push(new Rocket(width * 0.7, height * 0.28));
    rockets.push(new Rocket(width * 0.5, height * 0.2));

    let spawnTimer = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 주기적으로 새 폭죽 쏘아올리기
      spawnTimer++;
      if (spawnTimer % 22 === 0) {
        rockets.push(new Rocket());
      }

      // 로켓 업데이트
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.update();
        r.draw();
        if (r.exploded) {
          rockets.splice(i, 1);
        }
      }

      // 폭발 파티클 업데이트
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      // 콘페티 흩날리기
      confettiList.forEach((c) => {
        c.y += c.vy;
        c.x += c.vx + Math.sin(c.y * 0.02) * 0.8;
        c.rotation += c.rotSpeed;

        if (c.y > height) {
          c.y = -20;
          c.x = Math.random() * width;
        }

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // 화면 클릭 시 마우스 위치에서 즉시 폭죽 폭발 인터랙션
    const handleCanvasClick = (e) => {
      const clickColor = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < 60; i++) {
        particles.push(new Particle(e.clientX, e.clientY, clickColor));
      }
    };
    window.addEventListener('click', handleCanvasClick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('click', handleCanvasClick);
    };
  }, []);

  return (
    <div className="timer-celebration-backdrop" onClick={onClose}>
      {/* 1. 배경 폭죽 캔버스 (클릭 시에도 팡팡 터짐) */}
      <canvas ref={canvasRef} className="timer-celebration-canvas" />

      {/* 2. 중앙 알림 팝업 카드 */}
      <div 
        className="timer-celebration-card" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 볼륨 토글 및 닫기 버튼 */}
        <div className="timer-celebration-top-actions">
          <button
            type="button"
            className="celebration-icon-btn"
            onClick={() => setIsMuted((prev) => !prev)}
            title={isMuted ? '소리 켜기' : '소리 끄기'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button
            type="button"
            className="celebration-icon-btn"
            onClick={onClose}
            title="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* 대형 3D 바운스 이모지 & 펄스 링 */}
        <div className="celebration-badge-hero">
          <div className="celebration-pulse-ring ring-1"></div>
          <div className="celebration-pulse-ring ring-2"></div>
          <div className="celebration-emoji-main">⏰</div>
          <span className="celebration-mini-badge left">🎉</span>
          <span className="celebration-mini-badge right">✨</span>
        </div>

        {/* 텍스트 안내 헤더 */}
        <div className="celebration-content">
          <span className="celebration-pill-tag">
            <Sparkles size={14} />
            <span>수업 활동 종료</span>
          </span>
          <h2 className="celebration-title">
            활동 시간이 종료되었습니다!
          </h2>
          <p className="celebration-desc">
            모든 모둠과 학생들은 키보드와 펜을 내려놓고,<br />
            <strong>앞쪽 선생님 화면을 바라봐 주세요! 👀✨</strong>
          </p>

          <div className="celebration-status-box">
            <div className="celebration-status-dot"></div>
            <span>보드가 <strong>'열람 전용'</strong>으로 자동 전환되었습니다.</span>
          </div>
        </div>

        {/* 하단 확인 버튼 */}
        <div className="celebration-footer">
          <button
            type="button"
            className="celebration-confirm-btn"
            onClick={onClose}
          >
            <CheckCircle size={18} />
            <span>확인했습니다 (선생님 화면 주목)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
