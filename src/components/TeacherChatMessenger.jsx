import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Minus, 
  X, 
  CheckCheck
} from 'lucide-react';

export default function TeacherChatMessenger({
  targetTeacher,
  currentTeacher,
  chats = {},
  onSendMessage,
  onClose
}) {
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const teacherMessages = (targetTeacher && chats[targetTeacher.id]) || [];

  // 스크롤 최하단 유지
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [teacherMessages.length, isTyping, isMinimized]);

  // 포커스
  useEffect(() => {
    if (!isMinimized) {
      inputRef.current?.focus();
    }
  }, [targetTeacher?.id, isMinimized]);

  if (!targetTeacher) return null;

  const handleSend = (textToSend = inputText) => {
    const text = textToSend.trim();
    if (!text) return;

    if (onSendMessage) {
      onSendMessage(targetTeacher.id, {
        senderId: currentTeacher?.id || 'tch-1',
        senderName: currentTeacher?.name || '김길동T',
        text: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text'
      });
    }

    setInputText('');

    // 다른 선생님의 친절한 실시간 자동 답변 시뮬레이션 (1.2초 뒤)
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let replyText = '네 김 선생님, 메시지 확인했습니다! 잠시 후 수업 끝나고 상세히 검토해보고 답변드릴게요 😊';

      if (text.includes('협동') || text.includes('공동')) {
        replyText = `네 김 선생님! ${targetTeacher.name}입니다. 공동 수업 보드 개설 좋습니다! 2반 학생들도 함께 참여할 수 있게 안내하겠습니다.`;
      } else if (text.includes('흐름도') || text.includes('복제') || text.includes('공유')) {
        replyText = '네! 흐름도 템플릿 언제든 편하게 복제해 가셔도 됩니다. 도움이 되셨으면 좋겠습니다 ✨';
      } else if (text.includes('일정') || text.includes('시간')) {
        replyText = '네, 오늘 4교시 이후나 방과 후에 연구실에서 만나서 맞춰보시죠!';
      }

      if (onSendMessage) {
        onSendMessage(targetTeacher.id, {
          senderId: targetTeacher.id,
          senderName: targetTeacher.name,
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'text'
        });
      }
    }, 1200);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 1. 최소화 상태일 때의 플로팅 칩
  if (isMinimized) {
    return (
      <div 
        className="teacher-chat-minimized-chip"
        onClick={() => setIsMinimized(false)}
        title="클릭하여 협업 메신저 열기"
      >
        <div className="chat-chip-avatar">
          <MessageSquare size={16} />
        </div>
        <div className="chat-chip-info">
          <strong>{targetTeacher.name}</strong>
          <span>협업 메신저 대화 중</span>
        </div>
        <button 
          className="chat-chip-close"
          onClick={(e) => {
            e.stopPropagation();
            if (onClose) onClose();
          }}
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  // 2. 전체 채팅창
  return (
    <div className="teacher-chat-window">
      {/* 헤더 */}
      <div className="teacher-chat-header">
        <div className="chat-header-user">
          <div className="chat-avatar-badge" style={{ backgroundColor: targetTeacher.color || '#4f46e5' }}>
            {targetTeacher.name?.[0] || '교'}
            <span className="chat-online-dot"></span>
          </div>
          <div className="chat-user-meta">
            <div className="chat-user-title-row">
              <strong className="chat-user-name">{targetTeacher.name}</strong>
              <span className="chat-user-role-badge">{targetTeacher.role || '협동 교사'}</span>
            </div>
            <span className="chat-online-status">🟢 접속 중 · 실시간 협업 가능</span>
          </div>
        </div>

        <div className="chat-header-actions">
          <button 
            className="chat-ctrl-btn"
            onClick={() => setIsMinimized(true)}
            title="창 최소화"
          >
            <Minus size={15} />
          </button>
          <button 
            className="chat-ctrl-btn close"
            onClick={onClose}
            title="대화창 닫기"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* 대화 본문 */}
      <div className="teacher-chat-messages">
        <div className="chat-date-divider">
          <span>오늘</span>
        </div>

        {teacherMessages.length === 0 ? (
          <div className="chat-empty-hint">
            <MessageSquare size={32} color="#cbd5e1" />
            <p>{targetTeacher.name} 선생님과 나눈 대화가 없습니다.</p>
            <span>협동 수업 또는 수업 흐름도에 관한 이야기를 시작해보세요!</span>
          </div>
        ) : (
          teacherMessages.map((msg, idx) => {
            const isMe = msg.senderId === (currentTeacher?.id || 'tch-1');

            return (
              <div 
                key={msg.id || idx} 
                className={`chat-bubble-row ${isMe ? 'mine' : 'theirs'}`}
              >
                {!isMe && (
                  <div className="bubble-avatar" style={{ backgroundColor: targetTeacher.color || '#0ea5e9' }}>
                    {targetTeacher.name?.[0] || '교'}
                  </div>
                )}

                <div className="bubble-content-wrap">
                  {!isMe && (
                    <span className="bubble-sender-name">{msg.senderName}</span>
                  )}
                  <div className={`chat-bubble ${isMe ? 'bubble-mine' : 'bubble-theirs'}`}>
                    <p className="bubble-text">{msg.text}</p>
                  </div>
                  <div className="bubble-meta">
                    <span className="bubble-time">{msg.time}</span>
                    {isMe && <CheckCheck size={12} className="bubble-read-check" color="#10b981" />}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* 타이핑 인디케이터 */}
        {isTyping && (
          <div className="chat-bubble-row theirs typing-row">
            <div className="bubble-avatar" style={{ backgroundColor: targetTeacher.color || '#0ea5e9' }}>
              {targetTeacher.name?.[0] || '교'}
            </div>
            <div className="bubble-content-wrap">
              <span className="bubble-sender-name">{targetTeacher.name}</span>
              <div className="chat-bubble bubble-theirs typing-bubble">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="teacher-chat-input-area">
        <textarea
          ref={inputRef}
          className="chat-input-textarea"
          placeholder={`${targetTeacher.name} 선생님께 보낼 메시지를 입력하세요... (Enter로 전송)`}
          rows={2}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button 
          className="chat-send-btn"
          onClick={() => handleSend()}
          disabled={!inputText.trim()}
          title="메시지 전송"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
