import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ThumbsUp, 
  MessageSquare, 
  Image, 
  Palette, 
  Send, 
  CheckCircle, 
  Clock, 
  Lock, 
  Trash2, 
  MoreVertical,
  UploadCloud,
  FileText,
  Sparkles,
  BookOpen,
  Pencil,
  X,
  ZoomIn,
  GripVertical
} from 'lucide-react';
import DrawingModal from './DrawingModal';
import { 
  savePostToFirestore, 
  deletePostFromFirestore, 
  addCommentToFirestore, 
  toggleLikeInFirestore 
} from '../services/firebaseService';
import { compressImage } from '../utils/imageCompressor';

export default function PadletBoard({
  currentNode,
  posts = [],
  setPosts,
  currentRole,
  canModify = true,
  isLocked,
  requireApproval,
  currentStudent,
  lessonMode,
  onUpdateSections,
  onBackToOverview,
  onToggleCanvas
}) {
  const isTeacher = (currentRole === 'teacher' || currentRole === 'admin') && canModify;
  const [activeSectionForNewPost, setActiveSectionForNewPost] = useState('학생 발표');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDrawingModal, setShowDrawingModal] = useState(false);

  // 애플 감성 모달 내 인라인 편집 상태
  const [isEditingInsideModal, setIsEditingInsideModal] = useState(false);
  const [modalEditTitle, setModalEditTitle] = useState('');
  const [modalEditContent, setModalEditContent] = useState('');

  // 섹션 목록 동적 관리 (선생님이 새로운 섹터를 언제든 추가 가능)
  const [sections, setSections] = useState(
    currentNode?.canvasSections || ['학생 발표', '선생님 자료']
  );

  useEffect(() => {
    if (currentNode?.canvasSections) {
      setSections(currentNode.canvasSections);
    }
  }, [currentNode?.id, currentNode?.canvasSections]);

  // 새로운 섹터 만들기 상태
  const [isAddingSector, setIsAddingSector] = useState(false);
  const [newSectorTitle, setNewSectorTitle] = useState('');

  // New Post Form States
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [drawingData, setDrawingData] = useState(null);
  const [activeTabMedia, setActiveTabMedia] = useState('none'); // 'none' | 'image' | 'drawing'

  // Comments and Interactions
  const [newCommentText, setNewCommentText] = useState({});
  const [expandedComments, setExpandedComments] = useState({});

  // 3-dots 메뉴 & 수정 모달 상태
  const [openMenuPostId, setOpenMenuPostId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // 3번 요구사항: 카드 확대 보기 모달 및 사진 확대 라이트박스 상태
  const [viewingPost, setViewingPost] = useState(null);
  const [zoomedPhotoUrl, setZoomedPhotoUrl] = useState(null);

  // 교사용 카드 드래그 앤 드롭 재배치 상태
  const [draggedPostId, setDraggedPostId] = useState(null);
  const [dragOverPostId, setDragOverPostId] = useState(null);
  const [dragOverPosition, setDragOverPosition] = useState('before'); // 'before' | 'after'
  const [dragOverSector, setDragOverSector] = useState(null);
  const isDraggingCardRef = React.useRef(false);

  // 실시간 동기화된 확대 카드
  const activeViewingPost = viewingPost ? (posts.find((p) => p.id === viewingPost.id) || viewingPost) : null;

  // 카드 드롭 처리 (다른 카드 앞/뒤로 재배치 또는 섹터 변경)
  const handleDropOnCard = (sourceId, targetId, targetSection, position) => {
    if (!sourceId || !targetId || sourceId === targetId) return;

    setPosts((prevPosts) => {
      const sourcePost = prevPosts.find((p) => p.id === sourceId);
      const targetPost = prevPosts.find((p) => p.id === targetId);
      if (!sourcePost || !targetPost) return prevPosts;

      const updatedSource = { ...sourcePost, sectionName: targetSection };
      const remainingPosts = prevPosts.filter((p) => p.id !== sourceId);

      const targetIndex = remainingPosts.findIndex((p) => p.id === targetId);
      if (targetIndex === -1) return prevPosts;

      const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;
      const nextPosts = [...remainingPosts];
      nextPosts.splice(insertIndex, 0, updatedSource);

      return nextPosts;
    });
  };

  // 섹터 트랙 자체(빈 공간)에 드롭했을 때
  const handleDropOnSectorTrack = (sourceId, targetSection) => {
    if (!sourceId || !targetSection) return;

    setPosts((prevPosts) => {
      const sourcePost = prevPosts.find((p) => p.id === sourceId);
      if (!sourcePost) return prevPosts;

      const updatedSource = { ...sourcePost, sectionName: targetSection };
      const remainingPosts = prevPosts.filter((p) => p.id !== sourceId);

      let lastIndexInSection = -1;
      for (let i = 0; i < remainingPosts.length; i++) {
        if ((remainingPosts[i].sectionName || '학생 발표') === targetSection && remainingPosts[i].nodeId === currentNode?.id) {
          lastIndexInSection = i;
        }
      }

      const nextPosts = [...remainingPosts];
      if (lastIndexInSection !== -1) {
        nextPosts.splice(lastIndexInSection + 1, 0, updatedSource);
      } else {
        nextPosts.unshift(updatedSource);
      }

      return nextPosts;
    });
  };

  if (!currentNode) {
    return (
      <div className="padlet-canvas-container" style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
        상단 지식 흐름도에서 단계를 선택하면 해당 단계에 연동된 무한 캔버스가 활성화됩니다.
      </div>
    );
  }

  // 교사가 캔버스를 비활성화한 단계인 경우
  if (currentNode.hasCanvas === false) {
    return (
      <div className="padlet-canvas-container empty-canvas-notice-container">
        <div className="empty-canvas-notice-card">
          <div className="empty-canvas-icon-wrap">
            <BookOpen size={40} color="#6366f1" />
          </div>
          <h3 className="empty-canvas-title">캔버스 미사용 단계입니다</h3>
          <p className="empty-canvas-desc">
            이 단계는 교사가 참여 캔버스(보드) 없이 설명 및 학습 안내 전용으로 지정한 단계입니다.
          </p>
          <div className="empty-canvas-node-card">
            <span className="empty-canvas-category-tag">{currentNode.category}</span>
            <strong className="empty-canvas-node-title">{currentNode.title}</strong>
            <p className="empty-canvas-node-desc">{currentNode.description}</p>
          </div>
          <div className="empty-canvas-actions">
            {onBackToOverview && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={onBackToOverview}>
                전체 흐름도로 돌아가기
              </button>
            )}
            {isTeacher && onToggleCanvas && (
              <button type="button" className="btn btn-primary btn-sm" onClick={onToggleCanvas}>
                <Plus size={14} /> 이 단계에 캔버스 활성화하기
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 섹터 추가 핸들러
  const handleConfirmAddSector = () => {
    if (!newSectorTitle.trim()) return;
    const trimmed = newSectorTitle.trim();
    if (sections.includes(trimmed)) {
      alert('이미 존재하는 섹터 이름입니다.');
      return;
    }
    const nextSections = [...sections, trimmed];
    setSections(nextSections);
    if (onUpdateSections) {
      onUpdateSections(nextSections);
    }
    setNewSectorTitle('');
    setIsAddingSector(false);
  };

  // 섹터 삭제 핸들러
  const handleDeleteSector = (sectorName) => {
    if (sections.length <= 1) {
      alert('최소 하나의 섹터는 유지되어야 합니다.');
      return;
    }
    if (window.confirm(`'${sectorName}' 섹터를 삭제하시겠습니까?`)) {
      const nextSections = sections.filter((s) => s !== sectorName);
      setSections(nextSections);
      if (onUpdateSections) {
        onUpdateSections(nextSections);
      }
    }
  };

  // 현재 노드의 포스트만 필터링
  const nodePosts = posts.filter((p) => p.nodeId === currentNode.id);

  // 새 포스트 작성 핸들러
  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newContent.trim() && !drawingData && !newImageUrl) return;

    const studentInfo = currentStudent || {
      id: 'std-guest',
      studentNo: '10100',
      name: '익명학생',
      className: '1반',
      group: '1조'
    };

    const newPost = {
      id: `post-${Date.now()}`,
      nodeId: currentNode.id,
      sectionName: activeSectionForNewPost,
      authorId: isTeacher ? 'tch-1' : studentInfo.id,
      authorName: isTeacher ? '김길동T' : studentInfo.name,
      studentNo: isTeacher ? '교사' : studentInfo.studentNo,
      className: isTeacher ? '지도교사' : studentInfo.className,
      group: isTeacher ? '운영' : studentInfo.group,
      title: newTitle.trim() || (activeSectionForNewPost === '선생님 자료' ? '학습 가이드 및 참고자료' : '나의 생각과 탐구 결과'),
      content: newContent,
      imageUrl: newImageUrl || null,
      drawingDataUrl: drawingData || null,
      likes: 0,
      likedBy: [],
      comments: [],
      createdAt: '방금전',
      approved: !requireApproval || isTeacher
    };

    setPosts([newPost, ...posts]);
    savePostToFirestore(newPost); // Firebase Firestore 실시간 저장
    setNewTitle('');
    setNewContent('');
    setNewImageUrl('');
    setDrawingData(null);
    setShowCreateModal(false);
  };

  // 좋아요 토글
  const handleToggleLike = (postId) => {
    const studentId = currentStudent?.id || 'guest';
    const targetPost = posts.find((p) => p.id === postId);
    if (targetPost) {
      toggleLikeInFirestore(postId, studentId, targetPost.likes || 0, targetPost.likedBy || []);
    }
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const alreadyLiked = p.likedBy.includes(studentId);
        return {
          ...p,
          likes: alreadyLiked ? p.likes - 1 : p.likes + 1,
          likedBy: alreadyLiked ? p.likedBy.filter((id) => id !== studentId) : [...p.likedBy, studentId]
        };
      })
    );
  };

  // 댓글 추가
  const handleAddComment = (postId) => {
    const text = newCommentText[postId];
    if (!text || !text.trim()) return;

    const newComment = {
      id: `c-${Date.now()}`,
      authorName: currentRole === 'student' ? (currentStudent?.name || '학생') : '김길동T',
      text: text.trim(),
      timeAgo: '방금'
    };

    const targetPost = posts.find((p) => p.id === postId);
    if (targetPost) {
      addCommentToFirestore(postId, newComment, targetPost.comments || []);
    }

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p))
    );

    setNewCommentText({ ...newCommentText, [postId]: '' });
  };

  // 게시글 삭제
  const handleDeletePost = (postId) => {
    if (!canModify) {
      alert('다른 선생님의 수업은 열람 전용으로 수정 및 삭제가 불가능합니다.');
      return;
    }
    if (window.confirm('이 활동 카드를 삭제하시겠습니까?')) {
      deletePostFromFirestore(postId); // Firebase Firestore 삭제
      setPosts(posts.filter((p) => p.id !== postId));
      if (viewingPost && viewingPost.id === postId) {
        setViewingPost(null);
      }
    }
  };

  // 애플 감성 팝업 내 인라인 편집 핸들러
  const handleStartEditInsideModal = (post) => {
    if (!canModify) {
      alert('다른 선생님의 수업은 열람 전용입니다.');
      return;
    }
    setIsEditingInsideModal(true);
    setModalEditTitle(post.title || '');
    setModalEditContent(post.content || '');
  };

  const handleCancelEditInsideModal = () => {
    setIsEditingInsideModal(false);
  };

  const handleSaveEditInsideModal = (postId) => {
    if (!canModify) {
      alert('다른 선생님의 수업은 열람 전용입니다.');
      return;
    }
    const trimmedTitle = modalEditTitle.trim();
    const trimmedContent = modalEditContent.trim();
    if (!trimmedContent) {
      alert('내용을 입력해주세요.');
      return;
    }

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, title: trimmedTitle, content: trimmedContent }
          : p
      )
    );

    const targetPost = posts.find((p) => p.id === postId);
    if (targetPost) {
      savePostToFirestore({ ...targetPost, title: trimmedTitle, content: trimmedContent });
    }

    if (viewingPost && viewingPost.id === postId) {
      setViewingPost((prev) => ({
        ...prev,
        title: trimmedTitle,
        content: trimmedContent
      }));
    }

    setIsEditingInsideModal(false);
  };

  // 카드 수정 시작 (인라인 애플 모달로 직관적 연결)
  const handleStartEdit = (post, e) => {
    if (e) e.stopPropagation();
    if (!canModify) {
      alert('다른 선생님의 수업은 열람 전용입니다.');
      return;
    }
    setViewingPost(post);
    handleStartEditInsideModal(post);
    setOpenMenuPostId(null);
  };

  // 카드 수정 저장 (레거시 폼 방어)
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!canModify) {
      alert('다른 선생님의 수업은 열람 전용입니다.');
      return;
    }
    if (!editingPost) return;
    const trimmedTitle = editTitle.trim();
    const trimmedContent = editContent.trim();

    setPosts((prev) =>
      prev.map((p) =>
        p.id === editingPost.id
          ? { ...p, title: trimmedTitle, content: trimmedContent }
          : p
      )
    );

    savePostToFirestore({ ...editingPost, title: trimmedTitle, content: trimmedContent });

    if (viewingPost && viewingPost.id === editingPost.id) {
      setViewingPost((prev) => ({
        ...prev,
        title: trimmedTitle,
        content: trimmedContent
      }));
    }

    setEditingPost(null);
  };

  // 사진 파일 선택 (클라이언트 초경량 자동 압축 ➡️ 무료 Firestore 직접 저장, 유료 Storage 불필요!)
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedDataUrl = await compressImage(file, 900, 900, 0.75);
        if (compressedDataUrl) {
          setNewImageUrl(compressedDataUrl);
        }
      } catch (err) {
        console.warn('이미지 압축 중 오류 발생 (기본 로드 대체):', err);
        const reader = new FileReader();
        reader.onload = (event) => {
          setNewImageUrl(event.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <section className="padlet-canvas-container">
      {/* 캔버스 상단 스테이지 안내 헤더 */}
      <div className="padlet-stage-header">
        <div className="stage-header-title-wrap">
          <h3 className="stage-title">
            {currentNode.title} 활동 게시판
            <span className="stage-count-badge">({nodePosts.length}개의 기록)</span>
          </h3>
          <p className="stage-subtitle">{currentNode.description}</p>
        </div>
      </div>

      {/* 무한 캔버스 워크스페이스: 섹터별 가로 카드 나열 및 하단 섹터 추가 */}
      <div className="infinite-canvas-area padlet-horizontal-layout">
        <div className="padlet-sectors-container">
          {sections.map((sectionName) => {
            const sectionPosts = nodePosts.filter(
              (p) => (p.sectionName || '학생 발표') === sectionName
            );

            return (
              <div key={sectionName} className="padlet-sector-row">
                {/* 섹터 상단 헤더: 섹터 알약 뱃지 + 작성 버튼 + (교사용) 삭제 버튼 */}
                <div className="sector-row-header">
                  <div className="sector-header-left">
                    <div className="section-pill">
                      <span className="section-pill-text">{sectionName}</span>
                      <span className="section-pill-count">({sectionPosts.length})</span>
                    </div>

                    {canModify ? (
                      <button
                        className="btn-sector-add-card"
                        onClick={() => {
                          setActiveSectionForNewPost(sectionName);
                          setShowCreateModal(true);
                        }}
                        disabled={isLocked && currentRole === 'student'}
                        title={isLocked ? '보드가 잠겨 작성할 수 없습니다' : `${sectionName}에 새 카드 작성`}
                      >
                        <Plus size={14} />
                        <span>카드 작성</span>
                      </button>
                    ) : (
                      <span className="section-readonly-pill" style={{ fontSize: '0.72rem', color: '#64748b', background: '#f1f5f9', padding: '3px 8px', borderRadius: '12px', fontWeight: 600 }}>
                        👁️ 열람 전용
                      </span>
                    )}
                  </div>

                  {isTeacher && (
                    <div className="sector-header-right">
                      <button
                        className="sector-delete-btn"
                        onClick={() => handleDeleteSector(sectionName)}
                        title="이 섹터 삭제"
                      >
                        <Trash2 size={13} />
                        <span>섹터 삭제</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 해당 섹션의 카드들 목록: 오른쪽 방향으로 가로 나열 */}
                <div 
                  className={`sector-cards-track ${dragOverSector === sectionName ? 'is-drag-over-sector' : ''}`}
                  onDragOver={(e) => {
                    if (!isTeacher || !draggedPostId) return;
                    e.preventDefault();
                    setDragOverSector(sectionName);
                  }}
                  onDragLeave={(e) => {
                    if (!isTeacher) return;
                    if (e.currentTarget.contains(e.relatedTarget)) return;
                    if (dragOverSector === sectionName) setDragOverSector(null);
                  }}
                  onDrop={(e) => {
                    if (!isTeacher || !draggedPostId) return;
                    e.preventDefault();
                    handleDropOnSectorTrack(draggedPostId, sectionName);
                    setDraggedPostId(null);
                    setDragOverPostId(null);
                    setDragOverSector(null);
                  }}
                >
                  {sectionPosts.length === 0 ? (
                    <div 
                      className="empty-sector-card"
                      onClick={() => {
                        if (!canModify) return;
                        if (!isLocked || isTeacher) {
                          setActiveSectionForNewPost(sectionName);
                          setShowCreateModal(true);
                        }
                      }}
                      style={{ cursor: canModify ? 'pointer' : 'default' }}
                    >
                      <div className="empty-sector-icon">
                        <Plus size={22} />
                      </div>
                      <strong className="empty-sector-title">등록된 카드가 없습니다</strong>
                      <span className="empty-sector-sub">
                        {canModify ? '클릭하여 이 섹터에 첫 카드를 작성해보세요' : '선생님 및 학생들이 작성한 카드가 없습니다'}
                      </span>
                    </div>
                  ) : (
                    <>
                      {sectionPosts.map((post) => {
                        const isLiked = post.likedBy.includes(currentStudent?.id || 'guest');
                        const isCommentsOpen = expandedComments[post.id];
                        const canEdit = canModify && (isTeacher || (currentRole === 'student' && (post.authorId === currentStudent?.id || post.authorName === currentStudent?.name)));

                        return (
                          <div 
                            key={post.id} 
                            className={`padlet-classic-card ${isTeacher ? 'is-teacher-draggable' : ''} ${draggedPostId === post.id ? 'is-dragging-card' : ''} ${dragOverPostId === post.id ? (dragOverPosition === 'before' ? 'drop-target-before' : 'drop-target-after') : ''}`}
                            draggable={isTeacher}
                            onDragStart={(e) => {
                              if (!isTeacher) return;
                              isDraggingCardRef.current = true;
                              e.dataTransfer.setData('text/plain', post.id);
                              e.dataTransfer.effectAllowed = 'move';
                              setDraggedPostId(post.id);
                            }}
                            onDragEnd={() => {
                              setDraggedPostId(null);
                              setDragOverPostId(null);
                              setDragOverSector(null);
                              setTimeout(() => {
                                isDraggingCardRef.current = false;
                              }, 100);
                            }}
                            onDragOver={(e) => {
                              if (!isTeacher || !draggedPostId || draggedPostId === post.id) return;
                              e.preventDefault();
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              const isRightHalf = (e.clientX - rect.left) > (rect.width / 2);
                              setDragOverPostId(post.id);
                              setDragOverPosition(isRightHalf ? 'after' : 'before');
                              setDragOverSector(sectionName);
                            }}
                            onDragLeave={(e) => {
                              if (!isTeacher) return;
                              if (e.currentTarget.contains(e.relatedTarget)) return;
                              if (dragOverPostId === post.id) {
                                setDragOverPostId(null);
                              }
                            }}
                            onDrop={(e) => {
                              if (!isTeacher || !draggedPostId) return;
                              e.preventDefault();
                              e.stopPropagation();
                              if (draggedPostId !== post.id) {
                                handleDropOnCard(draggedPostId, post.id, sectionName, dragOverPosition);
                              }
                              setDraggedPostId(null);
                              setDragOverPostId(null);
                              setDragOverSector(null);
                              setTimeout(() => {
                                isDraggingCardRef.current = false;
                              }, 100);
                            }}
                            onClick={() => {
                              if (isDraggingCardRef.current) return;
                              setViewingPost(post);
                            }}
                            title={isTeacher ? "클릭하여 카드 확대 보기 / 드래그하여 원하는 위치로 이동" : "클릭하여 카드 확대 보기"}
                          >
                            {/* 카드 상단: 학번 이름 + 30분전 + 옵션메뉴 */}
                            <div className="card-top-row">
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                {isTeacher && (
                                  <div className="card-teacher-drag-handle" title="마우스로 잡고 드래그하여 카드 위치 이동">
                                    <GripVertical size={14} />
                                  </div>
                                )}
                                <div className="card-meta">
                                  <span className="card-author">
                                    {post.studentNo !== '교사' ? `${post.studentNo} ` : ''}{post.authorName}
                                  </span>
                                  <span className="card-time">{post.createdAt || '방금전'}</span>
                                </div>
                              </div>
                              <div className="card-top-actions" onClick={(e) => e.stopPropagation()}>
                                <div className="card-more-menu-wrapper">
                                  <button 
                                    type="button"
                                    className="card-icon-btn" 
                                    title="옵션 메뉴 (수정 / 삭제)"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuPostId(openMenuPostId === post.id ? null : post.id);
                                    }}
                                  >
                                    <MoreVertical size={14} />
                                  </button>

                                  {openMenuPostId === post.id && (
                                    <div className="card-more-dropdown" onClick={(e) => e.stopPropagation()}>
                                      {canEdit ? (
                                        <>
                                          <button
                                            type="button"
                                            className="dropdown-action-btn edit"
                                            onClick={(e) => handleStartEdit(post, e)}
                                          >
                                            <Pencil size={13} />
                                            <span>내용 수정</span>
                                          </button>
                                          <button
                                            type="button"
                                            className="dropdown-action-btn delete"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setOpenMenuPostId(null);
                                              handleDeletePost(post.id);
                                            }}
                                          >
                                            <Trash2 size={13} />
                                            <span>삭제하기</span>
                                          </button>
                                        </>
                                      ) : (
                                        <div className="dropdown-action-disabled">
                                          {!canModify ? '열람 전용 수업입니다 (수정 불가)' : '작성자 본인만 수정 가능합니다.'}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* 카드 제목 (옵션) */}
                            {post.title && (
                              <h4 className="card-heading">{post.title}</h4>
                            )}

                            {/* 첨부 이미지 (사진 2번 스타일) */}
                            {post.imageUrl && (
                              <div className="card-image-wrap">
                                <img 
                                  src={post.imageUrl} 
                                  alt={post.title || '첨부 사진'} 
                                  className="card-featured-img"
                                />
                              </div>
                            )}

                            {/* 첨부 손그림 */}
                            {post.drawingDataUrl && (
                              <div className="card-image-wrap drawing">
                                <img 
                                  src={post.drawingDataUrl} 
                                  alt="손그림 스케치" 
                                  className="card-featured-img"
                                />
                              </div>
                            )}

                            {/* 본문 텍스트 (줄바꿈 보존) */}
                            {post.content && (
                              <div className="card-body-text">
                                {post.content}
                              </div>
                            )}

                            {/* 카드 하단 상호작용 바 (좋아요 & 댓글) */}
                            <div className="card-bottom-bar" onClick={(e) => e.stopPropagation()}>
                              <button
                                className={`card-interaction-btn ${isLiked ? 'active' : ''}`}
                                onClick={() => handleToggleLike(post.id)}
                                title="좋아요"
                              >
                                <ThumbsUp size={15} fill={isLiked ? '#4f46e5' : 'none'} />
                                {post.likes > 0 && <span className="interaction-count">{post.likes}</span>}
                              </button>
                              <button
                                className={`card-interaction-btn ${isCommentsOpen ? 'active' : ''}`}
                                onClick={() => setExpandedComments({ ...expandedComments, [post.id]: !isCommentsOpen })}
                                title="댓글 열기/닫기"
                              >
                                <MessageSquare size={15} />
                                {post.comments?.length > 0 && (
                                  <span className="interaction-count">{post.comments.length}</span>
                                )}
                              </button>
                            </div>

                            {/* 댓글 영역 확장 */}
                            {isCommentsOpen && (
                              <div className="card-comments-tray" onClick={(e) => e.stopPropagation()}>
                                {post.comments && post.comments.length > 0 && (
                                  <div className="comments-list">
                                    {post.comments.map((c) => (
                                      <div key={c.id} className="comment-bubble">
                                        <span className="comment-author">{c.authorName}:</span>
                                        <span className="comment-text">{c.text}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {(!isLocked || isTeacher) && (
                                  <div className="comment-input-row">
                                    <input
                                      type="text"
                                      className="comment-input"
                                      placeholder="친구의 의견에 댓글 남기기..."
                                      value={newCommentText[post.id] || ''}
                                      onChange={(e) => setNewCommentText({ ...newCommentText, [post.id]: e.target.value })}
                                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                    />
                                    <button
                                      className="comment-send-btn"
                                      onClick={() => handleAddComment(post.id)}
                                    >
                                      <Send size={13} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* 오른쪽 끝에 빠른 추가 카드 버튼 */}
                      {(!isLocked || isTeacher) && (
                        <button
                          className="sector-add-more-card-btn"
                          onClick={() => {
                            setActiveSectionForNewPost(sectionName);
                            setShowCreateModal(true);
                          }}
                          title={`${sectionName}에 카드 추가`}
                        >
                          <div className="add-more-icon-circle">
                            <Plus size={20} />
                          </div>
                          <span>카드 추가</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 2번 요구사항: 아래 쪽에 '새로운 섹터 만들기' 버튼 (교사/관리자용) */}
        {isTeacher && (
          <div className="add-new-sector-section">
            {!isAddingSector ? (
              <button
                className="btn-trigger-add-sector"
                onClick={() => setIsAddingSector(true)}
              >
                <Plus size={18} />
                <span>새로운 섹터 만들기</span>
              </button>
            ) : (
              <div className="add-sector-form-card">
                <div className="add-sector-form-top">
                  <div className="add-sector-title-badge">
                    <Sparkles size={16} />
                    <strong>새로운 활동 섹터 생성</strong>
                  </div>
                  <span className="add-sector-desc">
                    선생님이 설정한 주제별 섹터에 학생들이 맞춤형 글과 사진을 작성합니다.
                  </span>
                </div>

                {/* 빠른 추천 키워드 */}
                <div className="sector-quick-chips">
                  <span className="quick-chip-label">추천 섹터:</span>
                  {['실험 관찰 결과', '모둠 토의 발표', '궁금한 질문 / 피드백', '오늘의 배움 한 줄', '선생님 피드백'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="quick-chip"
                      onClick={() => setNewSectorTitle(tag)}
                    >
                      +{tag}
                    </button>
                  ))}
                </div>

                <div className="add-sector-input-group">
                  <input
                    type="text"
                    className="add-sector-input"
                    placeholder="새 섹터 이름을 입력하세요 (예: 3조 실험 결과, 자유 질문 등)"
                    value={newSectorTitle}
                    onChange={(e) => setNewSectorTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleConfirmAddSector();
                      }
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleConfirmAddSector}
                  >
                    섹터 생성
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setIsAddingSector(false);
                      setNewSectorTitle('');
                    }}
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 새 카드 작성 모달 */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content padlet-create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                [{currentNode.title}] {activeSectionForNewPost} 카드 쓰기
              </span>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCreateModal(false)}>취소</button>
            </div>

            <form onSubmit={handleCreatePost}>
              <div className="modal-body">
                {/* 섹션 선택 탭 */}
                <div className="form-group">
                  <label className="form-label">등록 섹션</label>
                  <div className="section-select-chips">
                    {sections.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`chip-btn ${activeSectionForNewPost === s ? 'active' : ''}`}
                        onClick={() => setActiveSectionForNewPost(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 카드 제목 */}
                <div className="form-group">
                  <label className="form-label">제목</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="예: A의견에 대한 나의 생각"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                {/* 카드 내용 */}
                <div className="form-group">
                  <label className="form-label">내용 (생각, 탐구 결과, 의견)</label>
                  <textarea
                    className="form-textarea"
                    rows="5"
                    placeholder="1. 가나다라&#10;2. 가나다라&#10;3. 가가가나다"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    required={!drawingData && !newImageUrl}
                  />
                </div>

                {/* 미디어 첨부 옵션 */}
                <div className="form-group">
                  <label className="form-label">미디어 첨부 (선택)</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <UploadCloud size={14} />
                      <span>사진 업로드</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageFileChange} 
                        style={{ display: 'none' }} 
                      />
                    </label>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowDrawingModal(true)}
                    >
                      <Palette size={14} /> 손그림 / 스케치 그리기
                    </button>
                  </div>

                  {/* 첨부된 사진 미리보기 */}
                  {newImageUrl && (
                    <div className="preview-container">
                      <img src={newImageUrl} alt="업로드 이미지 미리보기" className="preview-img" />
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm preview-remove-btn"
                        onClick={() => setNewImageUrl('')}
                      >
                        사진 삭제
                      </button>
                    </div>
                  )}

                  {/* 첨부된 손그림 미리보기 */}
                  {drawingData && (
                    <div className="preview-container">
                      <img src={drawingData} alt="손그림 미리보기" className="preview-img" />
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm preview-remove-btn"
                        onClick={() => setDrawingData(null)}
                      >
                        그림 삭제
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary">
                  카드 발행하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 손그림 드로잉 모달 */}
      <DrawingModal
        isOpen={showDrawingModal}
        onClose={() => setShowDrawingModal(false)}
        onSave={(dataUrl) => setDrawingData(dataUrl)}
      />

      {/* 3번 요구사항 & 애플 감성 리디자인: 카드 상세 확대 및 인라인 수정 모달 */}
      {activeViewingPost && (
        <div 
          className="modal-overlay" 
          onClick={() => {
            setIsEditingInsideModal(false);
            setViewingPost(null);
          }}
        >
          <div 
            className="apple-card-modal-dialog" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* 상단 헤더: 애플 스타일 미려한 프로필 및 액션 */}
            <div className="apple-card-header">
              <div className="apple-author-wrap">
                <div className={`apple-author-avatar ${activeViewingPost.studentNo === '교사' ? 'teacher' : 'student'}`}>
                  {activeViewingPost.studentNo === '교사' ? '👨‍🏫' : '🎓'}
                </div>
                <div className="apple-author-meta">
                  <div className="apple-author-name-row">
                    <span className="apple-author-name">
                      {activeViewingPost.studentNo !== '교사' ? `${activeViewingPost.studentNo} ` : ''}{activeViewingPost.authorName}
                    </span>
                    <span className="apple-section-pill">{activeViewingPost.sectionName}</span>
                  </div>
                  <span className="apple-time-label">{activeViewingPost.createdAt || '방금전'}</span>
                </div>
              </div>

              <div className="apple-header-controls">
                {!isEditingInsideModal && canModify && (isTeacher || (currentRole === 'student' && (activeViewingPost.authorId === currentStudent?.id || activeViewingPost.authorName === currentStudent?.name))) && (
                  <button
                    type="button"
                    className="apple-btn-edit"
                    onClick={() => handleStartEditInsideModal(activeViewingPost)}
                    title="카드 내용 수정하기"
                  >
                    <Pencil size={13} />
                    <span>내용 수정</span>
                  </button>
                )}
                <button 
                  type="button" 
                  className="apple-btn-close" 
                  onClick={() => {
                    setIsEditingInsideModal(false);
                    setViewingPost(null);
                  }}
                  aria-label="닫기"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* 스크롤 본문 영역 */}
            <div className="apple-card-scroll-body">
              {isEditingInsideModal ? (
                /* 애플 감성 인라인 수정 폼 */
                <div className="apple-edit-container">
                  <div className="apple-edit-field-label">
                    <Pencil size={14} />
                    <span>활동 제목</span>
                  </div>
                  <input
                    type="text"
                    className="apple-edit-title-input"
                    placeholder="활동 카드 제목을 입력하세요"
                    value={modalEditTitle}
                    onChange={(e) => setModalEditTitle(e.target.value)}
                    autoFocus
                  />

                  <div className="apple-edit-field-label" style={{ marginTop: '4px' }}>
                    <Sparkles size={14} />
                    <span>활동 내용</span>
                  </div>
                  <textarea
                    className="apple-edit-textarea"
                    placeholder="수정할 내용을 작성해주세요"
                    value={modalEditContent}
                    onChange={(e) => setModalEditContent(e.target.value)}
                    rows={6}
                  />

                  <div className="apple-edit-action-row">
                    <button
                      type="button"
                      className="apple-btn-cancel"
                      onClick={handleCancelEditInsideModal}
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      className="apple-btn-save"
                      onClick={() => handleSaveEditInsideModal(activeViewingPost.id)}
                    >
                      <CheckCircle size={14} />
                      <span>수정 완료</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* 일반 카드 상세 보기 모드 */
                <>
                  {activeViewingPost.title && (
                    <h3 className="apple-content-title">{activeViewingPost.title}</h3>
                  )}

                  {/* 첨부 이미지 - 클릭 시 사진 더 크게 확대 (라이트박스) */}
                  {activeViewingPost.imageUrl && (
                    <div 
                      className="zoomed-card-media-wrap"
                      onClick={() => setZoomedPhotoUrl(activeViewingPost.imageUrl)}
                      title="클릭하여 원본 크기로 더 크게 확대"
                    >
                      <img src={activeViewingPost.imageUrl} alt={activeViewingPost.title || '첨부 사진'} className="zoomed-media-img" />
                      <div className="media-zoom-overlay-hint">
                        <ZoomIn size={16} />
                        <span>클릭하여 사진 더 크게 보기</span>
                      </div>
                    </div>
                  )}

                  {/* 손그림 스케치 - 클릭 시 사진 더 크게 확대 */}
                  {activeViewingPost.drawingDataUrl && (
                    <div 
                      className="zoomed-card-media-wrap drawing"
                      onClick={() => setZoomedPhotoUrl(activeViewingPost.drawingDataUrl)}
                      title="클릭하여 원본 크기로 더 크게 확대"
                    >
                      <img src={activeViewingPost.drawingDataUrl} alt="손그림 스케치" className="zoomed-media-img" />
                      <div className="media-zoom-overlay-hint">
                        <ZoomIn size={16} />
                        <span>클릭하여 그림 더 크게 보기</span>
                      </div>
                    </div>
                  )}

                  {/* 본문 텍스트 패널 */}
                  {activeViewingPost.content && (
                    <div className="apple-content-panel">
                      {activeViewingPost.content}
                    </div>
                  )}

                  {/* 애플 iMessage 감성 댓글 섹션 */}
                  <div className="apple-comments-block">
                    <div className="apple-comments-header">
                      <MessageSquare size={15} color="#0071e3" />
                      <span>댓글 {activeViewingPost.comments?.length || 0}개</span>
                    </div>

                    {activeViewingPost.comments && activeViewingPost.comments.length > 0 && (
                      <div className="apple-comments-list" style={{ marginBottom: '10px' }}>
                        {activeViewingPost.comments.map((c) => (
                          <div key={c.id} className="apple-comment-bubble">
                            <span className="apple-comment-author">{c.authorName}:</span>
                            <span className="apple-comment-text">{c.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {canModify && (!isLocked || isTeacher) ? (
                      <div className="apple-comment-input-bar">
                        <input
                          type="text"
                          className="apple-comment-input"
                          placeholder="이 의견에 댓글 남기기..."
                          value={newCommentText[activeViewingPost.id] || ''}
                          onChange={(e) => setNewCommentText({ ...newCommentText, [activeViewingPost.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddComment(activeViewingPost.id);
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="apple-comment-send-btn"
                          onClick={() => handleAddComment(activeViewingPost.id)}
                          title="댓글 보내기"
                        >
                          <Send size={13} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.78rem', color: '#86868b', textAlign: 'center', padding: '6px 0' }}>
                        {!canModify ? '👁️ 다른 선생님 수업은 열람 전용입니다.' : '🔒 현재 댓글 작성이 잠겨 있습니다.'}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* 하단 푸터: 애플 감성 좋아요 & 닫기 버튼 */}
            <div className="apple-card-footer">
              <button 
                type="button" 
                className={`apple-btn-like ${activeViewingPost.likedBy?.includes(currentStudent?.id || 'guest') ? 'active' : ''}`}
                onClick={() => handleToggleLike(activeViewingPost.id)}
              >
                <ThumbsUp size={15} fill={activeViewingPost.likedBy?.includes(currentStudent?.id || 'guest') ? '#4f46e5' : 'none'} />
                <span>좋아요 {activeViewingPost.likes || 0}</span>
              </button>
              <button 
                type="button" 
                className="apple-btn-dismiss" 
                onClick={() => {
                  setIsEditingInsideModal(false);
                  setViewingPost(null);
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3번 요구사항: 사진 더 크게 확대 라이트박스 뷰어 */}
      {zoomedPhotoUrl && (
        <div className="photo-lightbox-overlay" onClick={() => setZoomedPhotoUrl(null)}>
          <button 
            type="button"
            className="photo-lightbox-close" 
            onClick={() => setZoomedPhotoUrl(null)}
            aria-label="닫기"
          >
            <X size={26} />
          </button>
          <div className="photo-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <img src={zoomedPhotoUrl} alt="확대 사진 원본" className="photo-lightbox-img" />
          </div>
        </div>
      )}

      {/* 2번 요구사항: 카드 내용 수정 모달 */}
      {editingPost && (
        <div className="modal-overlay" onClick={() => setEditingPost(null)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Pencil size={18} color="#4f46e5" />
                <span className="modal-title">활동 카드 내용 수정</span>
              </div>
              <button type="button" className="btn-close-modal" onClick={() => setEditingPost(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                <div className="form-group mb-3">
                  <label className="form-label font-bold">제목</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="카드 제목"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label font-bold">내용</label>
                  <textarea
                    className="form-input"
                    rows={6}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="수정할 내용을 입력하세요"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingPost(null)}>
                  취소
                </button>
                <button type="submit" className="btn btn-primary">
                  수정 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
