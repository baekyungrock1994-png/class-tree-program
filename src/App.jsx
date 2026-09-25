import React, { useState, useRef, useEffect } from 'react';
import Navbar from './components/Navbar';
import TimerControl from './components/TimerControl';
import FlowCanvas from './components/FlowCanvas';
import PadletBoard from './components/PadletBoard';
import TeacherSidebar from './components/TeacherSidebar';
import ClassroomCardView from './components/ClassroomCardView';
import BoardCardView from './components/BoardCardView';
import TeacherChatMessenger from './components/TeacherChatMessenger';
import ClassroomMembersModal from './components/ClassroomMembersModal';
import JoinClassroomModal from './components/JoinClassroomModal';
import CreateBoardModal from './components/CreateBoardModal';
import CreateClassroomModal from './components/CreateClassroomModal';
import EditClassroomModal from './components/EditClassroomModal';
import EditBoardModal from './components/EditBoardModal';
import StudentAdmin from './components/StudentAdmin';
import LoginModal from './components/LoginModal';
import TimerExpireCelebrationModal from './components/TimerExpireCelebrationModal';
import { subscribeBoardPosts } from './services/firebaseService';
import { 
  INITIAL_LESSON, 
  TEACHER_HIERARCHY,
  INITIAL_STUDENTS, 
  INITIAL_CHANGE_REQUESTS,
  INITIAL_USERS
} from './data/mockData';
import { ShieldCheck, ArrowLeft, School, BookOpen, Edit, CheckCircle, Radio, GitFork, Settings, LogIn } from 'lucide-react';

const INITIAL_TEACHER_CHATS = {
  'tch-2': [
    {
      id: 'msg-1',
      senderId: 'tch-2',
      senderName: '홍길동T',
      text: '김 선생님, 5학년 과학 날씨 단원 흐름도 잘 보았습니다! 3차시 바람의 원리 실험은 어떻게 진행하실 계획인가요?',
      time: '오전 10:15',
      type: 'text'
    },
    {
      id: 'msg-2',
      senderId: 'tch-1',
      senderName: '김길동T',
      text: '홍 선생님 안녕하세요! 간이 풍향·풍속계 제작 후 운동장에서 직접 관찰해 보려고 합니다. 2반과 협동 수업으로 함께 진행해도 좋을 것 같아요!',
      time: '오전 10:20',
      type: 'text'
    },
    {
      id: 'msg-3',
      senderId: 'tch-2',
      senderName: '홍길동T',
      text: '좋습니다! 저희 반 학생들도 참여할 수 있도록 공동 보드로 함께 열어주시겠어요?',
      time: '오전 10:22',
      type: 'collab_request'
    }
  ],
  'tch-3': [
    {
      id: 'msg-4',
      senderId: 'tch-3',
      senderName: '남길동T',
      text: '김길동 선생님, 방과후 환경 동아리에서 5학년 과학 기후 위기 토의 보드 템플릿을 참고해도 괜찮을까요?',
      time: '어제',
      type: 'board_request'
    },
    {
      id: 'msg-5',
      senderId: 'tch-1',
      senderName: '김길동T',
      text: '네 남 선생님, 언제든 편하게 복제해서 쓰셔도 됩니다! 학생들 반응 좋았던 활동지도 보드에 올려두었습니다.',
      time: '어제',
      type: 'text'
    }
  ]
};

export default function App() {
  // Global States
  const [currentRole, setCurrentRole] = useState('teacher'); // 'teacher' | 'student' | 'admin'
  const [teachers, setTeachers] = useState(TEACHER_HIERARCHY);

  // 교사 1:1 협업 메신저 상태
  const [activeChatTeacher, setActiveChatTeacher] = useState(null);
  const [teacherChats, setTeacherChats] = useState(INITIAL_TEACHER_CHATS);

  // 사이드바 접기/열기 상태 (기본 펼침, 토글 시 접혀서 전체 화면 넓게 사용)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // 메인 워크스페이스 컨테이너 ref (카드 클릭 좌표 계산용)
  const workspaceRef = useRef(null);

  // 3단계 네비게이션 레벨: 'classrooms' (학급 카드 목록) | 'boards' (수업 차시 목록) | 'lesson' (실제 수업 공간)
  const [viewLevel, setViewLevel] = useState('classrooms');
  // 닫힐 때(exiting) 화면이 즉시 언마운트되지 않도록 유지하는 표시 레벨
  const [displayedLevel, setDisplayedLevel] = useState('classrooms');

  // 클릭된 카드의 위치(Rect) 정보 저장 (애플 맥 파일 줌 원점)
  const [classroomOrigin, setClassroomOrigin] = useState(null);
  const [boardOrigin, setBoardOrigin] = useState(null);

  // 맥 스타일 파일 열기/닫기 줌 트랜지션 상태: phase: 'idle' | 'entering' | 'exiting'
  const [transitionState, setTransitionState] = useState({
    phase: 'idle',
    level: 'classrooms'
  });

  // Entering 애니메이션 완료 시 idle 상태 복귀
  useEffect(() => {
    if (transitionState.phase === 'entering') {
      const timer = setTimeout(() => {
        setTransitionState((prev) => ({ ...prev, phase: 'idle' }));
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [transitionState.phase]);

  // CSS transform-origin 및 시작 scale 계산 헬퍼 함수
  const getZoomOriginStyle = (rect, container) => {
    if (!rect || !container) {
      return {
        '--origin-x': '50%',
        '--origin-y': '45%',
        '--start-scale': '0.3',
        '--source-radius': '16px'
      };
    }
    const cRect = container.getBoundingClientRect();
    const cardCenterX = rect.left + rect.width / 2;
    const cardCenterY = rect.top + rect.height / 2;
    const originXPercent = ((cardCenterX - cRect.left) / cRect.width) * 100;
    const originYPercent = ((cardCenterY - cRect.top) / cRect.height) * 100;
    const scaleRatio = Math.max(0.18, Math.min(0.45, rect.width / cRect.width));
    return {
      '--origin-x': `${Math.max(5, Math.min(95, originXPercent)).toFixed(1)}%`,
      '--origin-y': `${Math.max(5, Math.min(95, originYPercent)).toFixed(1)}%`,
      '--start-scale': scaleRatio.toFixed(3),
      '--source-radius': '16px'
    };
  };

  // 현재 뷰에 적용할 줌 스타일
  const currentZoomStyle = (() => {
    if (displayedLevel === 'lesson' || transitionState.level === 'lesson') {
      return getZoomOriginStyle(boardOrigin, workspaceRef.current);
    }
    if (displayedLevel === 'boards' || transitionState.level === 'boards') {
      return getZoomOriginStyle(classroomOrigin, workspaceRef.current);
    }
    return getZoomOriginStyle(null, workspaceRef.current);
  })();

  // 현재 로그인된 기본 교사 계정 ID (김길동T) - 교사는 본인 교실만 수정 가능, 관리자는 모든 교사의 교실/수업 수정 가능
  const loggedInTeacherId = 'tch-1';

  // 관리자 콘솔용 전체 가입 사용자 (교사 & 학생) 상태
  const [users, setUsers] = useState(INITIAL_USERS);

  // 현재 선택된 계층 객체들
  const [activeTeacherId, setActiveTeacherId] = useState('tch-1');
  const currentTeacher = teachers.find((t) => t.id === activeTeacherId) || teachers[0];

  const [currentClassroom, setCurrentClassroom] = useState(currentTeacher.classrooms[0]);
  const [currentBoard, setCurrentBoard] = useState(currentTeacher.classrooms[0].boards[0]);

  // 학생 모드에서 선택된 교실 ID (처음 접속 시 null -> 화면 중앙에 ClassTree 로고 및 텍스트 표시)
  const [selectedStudentClassroomId, setSelectedStudentClassroomId] = useState(null);

  // 모드 상태: 'guided' (교사 주도 모드) | 'canvas' (무한 캔버스 모드)
  const [lessonMode, setLessonMode] = useState(currentTeacher.classrooms[0].boards[0].mode || 'guided');

  // 수업 내 데이터
  const [nodes, setNodes] = useState(currentTeacher.classrooms[0].boards[0].nodes || []);
  const [edges, setEdges] = useState(currentTeacher.classrooms[0].boards[0].edges || []);
  const [posts, setPosts] = useState(currentTeacher.classrooms[0].boards[0].posts || []);
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [changeRequests, setChangeRequests] = useState(INITIAL_CHANGE_REQUESTS);

  // Firebase Firestore 실시간 카드(포스트) 구독
  useEffect(() => {
    const unsubscribe = subscribeBoardPosts(
      null,
      (firestorePosts) => {
        if (firestorePosts && firestorePosts.length > 0) {
          setPosts(firestorePosts);
        }
      },
      () => {
        // Firebase 준비 중이거나 오프라인 시 조용히 로컬 상태 유지
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentBoard?.id]);

  // 캔버스 확장 여부 (교사 주도 모드에서 첫 화면에는 흐름도만 표시)
  const [canvasExpanded, setCanvasExpanded] = useState(false);

  // 라이브 단계 관리
  const [activeStageId, setActiveStageId] = useState('node-1');
  const [liveStageId, setLiveStageId] = useState('node-1');
  const [isLocked, setIsLocked] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);

  // 로그인 및 인증 상태 (처음에는 비로그인 웰컴 상태로 시작)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Modals
  const [isStudentAdminOpen, setIsStudentAdminOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [showStudentProfileModal, setShowStudentProfileModal] = useState(false);
  const [isTimerCelebrationOpen, setIsTimerCelebrationOpen] = useState(false);

  // 참여 인원 관리 모달 & 코드 초대/참여 모달 & 차시 생성 모달 상태
  const [selectedManageClassroom, setSelectedManageClassroom] = useState(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinModalRole, setJoinModalRole] = useState('teacher');
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [isCreateClassroomModalOpen, setIsCreateClassroomModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [editingBoard, setEditingBoard] = useState(null);

  // Current Logged-in Student
  const [currentStudent, setCurrentStudent] = useState(INITIAL_STUDENTS[0]);
  const [newRequestedName, setNewRequestedName] = useState('');
  const [profileRequestSuccess, setProfileRequestSuccess] = useState(false);

  // 학생이 가입된 교실 목록 데이터 (동적 참여 가능하도록 state로 관리)
  const [studentClassrooms, setStudentClassrooms] = useState([
    {
      id: 'cls-101',
      name: '5학년 1반 과학',
      teacherName: '김길동T',
      teacherId: 'tch-1',
      grade: '5학년',
      code: 'SCI-501',
      boards: TEACHER_HIERARCHY[0].classrooms[0].boards
    },
    {
      id: 'cls-102',
      name: '방과후 환경·기후 동아리',
      teacherName: '김길동T',
      teacherId: 'tch-1',
      grade: '동아리',
      code: 'ENV-702',
      boards: TEACHER_HIERARCHY[0].classrooms[1].boards
    },
    {
      id: 'cls-201',
      name: '5학년 2반 과학',
      teacherName: '홍길동T',
      teacherId: 'tch-2',
      grade: '5학년',
      code: 'SCI-502',
      boards: TEACHER_HIERARCHY[1].classrooms[0].boards
    }
  ]);

  // 학급 참여 인원 목록 및 역할 업데이트 핸들러
  const handleUpdateClassroomMembers = (classroomId, newMembers) => {
    setTeachers((prevTeachers) =>
      prevTeachers.map((teacher) => ({
        ...teacher,
        classrooms: teacher.classrooms.map((cls) =>
          cls.id === classroomId ? { ...cls, members: newMembers } : cls
        )
      }))
    );

    setCurrentClassroom((prev) =>
      prev && prev.id === classroomId ? { ...prev, members: newMembers } : prev
    );

    setSelectedManageClassroom((prev) =>
      prev && prev.id === classroomId ? { ...prev, members: newMembers } : prev
    );
  };

  // 새 수업 차시 개설 핸들러 (직접 생성 또는 다른 교실 차시 복사)
  const handleCreateBoard = (newBoardData) => {
    let newBoard;

    if (newBoardData.isCopied && newBoardData.copiedBoard) {
      const source = newBoardData.copiedBoard;
      const copyStudentPosts = newBoardData.copyStudentPosts || false;
      const idMap = {};
      const newBoardId = `brd-${Date.now()}`;

      // 노드 ID 재발급 및 매핑
      const newNodes = (source.nodes || []).map((node, idx) => {
        const newId = `node-${Date.now()}-${idx + 1}`;
        idMap[node.id] = newId;
        return {
          ...node,
          id: newId
        };
      });

      // 엣지 매핑
      const newEdges = (source.edges || []).map((edge) => ({
        ...edge,
        from: idMap[edge.from] || edge.from,
        to: idMap[edge.to] || edge.to
      }));

      // 포스트 복사 (학생 포스트 포함 여부 처리)
      const sourcePosts = source.posts || [];
      const filteredPosts = copyStudentPosts
        ? sourcePosts
        : sourcePosts.filter(
            (p) => p.studentNo === '교사' || p.authorId?.startsWith('tch')
          );

      const newPosts = filteredPosts.map((post, idx) => ({
        ...post,
        id: `post-${Date.now()}-${idx + 1}`,
        nodeId: idMap[post.nodeId] || post.nodeId
      }));

      newBoard = {
        id: newBoardId,
        title: newBoardData.title || source.title,
        mode: source.mode,
        description: newBoardData.description !== undefined ? newBoardData.description : (source.description || ''),
        sections: source.sections ? [...source.sections] : ['학생 발표', '선생님 자료'],
        nodes: newNodes,
        edges: newEdges,
        posts: newPosts,
        activeStageId: idMap[source.activeStageId] || newNodes[0]?.id || 'canvas-main',
        liveStageId: idMap[source.liveStageId] || newNodes[0]?.id || 'canvas-main'
      };
    } else {
      const isGuided = newBoardData.mode === 'guided';
      const firstNodeId = `node-${Date.now()}-1`;
      const secondNodeId = `node-${Date.now()}-2`;

      newBoard = {
        id: `brd-${Date.now()}`,
        title: newBoardData.title,
        mode: newBoardData.mode,
        description: newBoardData.description || '',
        sections: newBoardData.sections || ['학생 발표', '선생님 자료'],
        nodes: isGuided
          ? [
              {
                id: firstNodeId,
                stepNumber: 1,
                title: '1. 동기유발 및 핵심 질문',
                description: '수업의 핵심 질문을 탐구하고 배경 지식을 정리합니다.',
                x: 60,
                y: 90,
                category: '관찰·탐구',
                color: '#10b981',
                hasCanvas: true,
                canvasSections: newBoardData.sections || ['학생 발표', '선생님 자료'],
                boardStatus: 'open'
              },
              {
                id: secondNodeId,
                stepNumber: 2,
                title: '2. 본시 탐구 및 산출물 공유',
                description: '개념을 적용하고 협업 산출물을 공유합니다.',
                x: 420,
                y: 90,
                category: '실험·원리',
                color: '#0ea5e9',
                hasCanvas: true,
                canvasSections: newBoardData.sections || ['학생 발표', '선생님 자료'],
                boardStatus: 'open'
              }
            ]
          : [],
        edges: isGuided ? [{ from: firstNodeId, to: secondNodeId }] : [],
        posts: [],
        activeStageId: isGuided ? firstNodeId : 'canvas-main',
        liveStageId: isGuided ? firstNodeId : 'canvas-main'
      };
    }

    // 현재 선택된 학급에 차시 추가
    setCurrentClassroom((prev) => ({
      ...prev,
      boards: [...(prev.boards || []), newBoard]
    }));

    // teachers 계층 구조에도 반영
    setTeachers((prevTeachers) =>
      prevTeachers.map((t) => ({
        ...t,
        classrooms: (t.classrooms || []).map((c) =>
          c.id === currentClassroom.id
            ? { ...c, boards: [...(c.boards || []), newBoard] }
            : c
        )
      }))
    );

    // 학생이 가입된 교실 목록에도 동기화
    setStudentClassrooms((prev) =>
      prev.map((c) =>
        c.id === currentClassroom.id
          ? { ...c, boards: [...(c.boards || []), newBoard] }
          : c
      )
    );
  };

  // 새 학급(교실) 개설 핸들러
  const handleCreateClassroom = (newClassroomData) => {
    const newClassroomId = `cls-${Date.now()}`;
    const newClassroom = {
      id: newClassroomId,
      name: newClassroomData.name,
      grade: newClassroomData.grade || '일반',
      subject: newClassroomData.subject || '',
      code: newClassroomData.code,
      description: newClassroomData.description || '',
      members: [
        {
          id: currentTeacher.id,
          name: currentTeacher.name,
          username: `teacher_${currentTeacher.id}`,
          role: 'owner',
          email: `${currentTeacher.id}@school.edu`
        }
      ],
      boards: []
    };

    // 현재 교사의 classrooms 목록에 추가
    setTeachers((prevTeachers) =>
      prevTeachers.map((t) =>
        t.id === currentTeacher.id
          ? { ...t, classrooms: [...(t.classrooms || []), newClassroom] }
          : t
      )
    );

    // 바로 생성된 학급을 현재 학급으로 선택
    setCurrentClassroom(newClassroom);
  };

  // 학급 정보 수정 저장 핸들러
  const handleSaveEditedClassroom = (classroomId, updatedData) => {
    setTeachers((prevTeachers) =>
      prevTeachers.map((t) => ({
        ...t,
        classrooms: (t.classrooms || []).map((c) =>
          c.id === classroomId
            ? {
                ...c,
                ...updatedData
              }
            : c
        )
      }))
    );

    if (currentClassroom?.id === classroomId) {
      setCurrentClassroom((prev) => (prev ? { ...prev, ...updatedData } : prev));
    }

    setStudentClassrooms((prev) =>
      prev.map((c) =>
        c.id === classroomId
          ? { ...c, name: updatedData.name, code: updatedData.code, grade: updatedData.grade }
          : c
      )
    );

    setEditingClassroom(null);
  };

  // 학급 삭제 핸들러
  const handleDeleteClassroom = (classroom) => {
    if (!classroom) return;
    const confirmMsg = `정말 '${classroom.name}' 학급을 삭제하시겠습니까?\n소속된 모든 수업 차시(${classroom.boards?.length || 0}개)와 활동 데이터가 함께 삭제됩니다.`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setTeachers((prevTeachers) =>
      prevTeachers.map((t) => ({
        ...t,
        classrooms: (t.classrooms || []).filter((c) => c.id !== classroom.id)
      }))
    );

    setStudentClassrooms((prev) => prev.filter((c) => c.id !== classroom.id));

    if (currentClassroom?.id === classroom.id) {
      const remaining = (currentTeacher?.classrooms || []).filter((c) => c.id !== classroom.id);
      setCurrentClassroom(remaining[0] || null);
    }
  };

  // 수업 차시 정보 수정 저장 핸들러
  const handleSaveEditedBoard = (boardId, updatedData) => {
    setCurrentClassroom((prev) => {
      if (!prev) return prev;
      const updatedBoards = (prev.boards || []).map((b) =>
        b.id === boardId
          ? {
              ...b,
              title: updatedData.title,
              mode: updatedData.mode,
              description: updatedData.description
            }
          : b
      );
      return { ...prev, boards: updatedBoards };
    });

    if (currentBoard?.id === boardId) {
      setCurrentBoard((prev) =>
        prev
          ? {
              ...prev,
              title: updatedData.title,
              mode: updatedData.mode,
              description: updatedData.description
            }
          : prev
      );
      if (updatedData.mode) {
        setLessonMode(updatedData.mode);
      }
    }

    setTeachers((prevTeachers) =>
      prevTeachers.map((t) => ({
        ...t,
        classrooms: (t.classrooms || []).map((c) =>
          c.id === currentClassroom?.id
            ? {
                ...c,
                boards: (c.boards || []).map((b) =>
                  b.id === boardId
                    ? {
                        ...b,
                        title: updatedData.title,
                        mode: updatedData.mode,
                        description: updatedData.description
                      }
                    : b
                )
              }
            : c
        )
      }))
    );

    setStudentClassrooms((prev) =>
      prev.map((c) =>
        c.id === currentClassroom?.id
          ? {
              ...c,
              boards: (c.boards || []).map((b) =>
                b.id === boardId
                  ? {
                      ...b,
                      title: updatedData.title,
                      mode: updatedData.mode,
                      description: updatedData.description
                    }
                  : b
              )
            }
          : c
      )
    );

    setEditingBoard(null);
  };

  // 수업 차시 삭제 핸들러
  const handleDeleteBoard = (board) => {
    if (!board) return;
    const confirmMsg = `정말 '${board.title}' 수업 차시를 삭제하시겠습니까?\n등록된 수업 흐름도와 학생 산출물이 모두 삭제됩니다.`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setCurrentClassroom((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        boards: (prev.boards || []).filter((b) => b.id !== board.id)
      };
    });

    setTeachers((prevTeachers) =>
      prevTeachers.map((t) => ({
        ...t,
        classrooms: (t.classrooms || []).map((c) =>
          c.id === currentClassroom?.id
            ? {
                ...c,
                boards: (c.boards || []).filter((b) => b.id !== board.id)
              }
            : c
        )
      }))
    );

    setStudentClassrooms((prev) =>
      prev.map((c) =>
        c.id === currentClassroom?.id
          ? {
              ...c,
              boards: (c.boards || []).filter((b) => b.id !== board.id)
            }
          : c
      )
    );

    if (currentBoard?.id === board.id) {
      setCurrentBoard(null);
      setViewLevel('boards');
    }
  };

  // 고유 코드를 통한 학급 참여 핸들러 (학생 or 교사)
  const handleJoinClassroomByCode = (inputCode, role, userObj) => {
    const trimmed = inputCode.trim().toUpperCase();
    let foundClassroom = null;
    let foundTeacher = null;

    for (const t of teachers) {
      const target = t.classrooms.find((c) => c.code?.toUpperCase() === trimmed);
      if (target) {
        foundClassroom = target;
        foundTeacher = t;
        break;
      }
    }

    if (!foundClassroom) {
      return { success: false, message: `초대 코드 [${trimmed}]와 일치하는 학급(교실)을 찾을 수 없습니다.` };
    }

    // 학생으로 참여 시
    if (role === 'student') {
      const isAlreadyMember = foundClassroom.members?.some((m) => m.id === userObj.id);
      if (!isAlreadyMember) {
        const newMember = {
          id: userObj.id || `std-${Date.now()}`,
          name: userObj.name,
          username: userObj.studentNo ? `std_${userObj.studentNo}` : (userObj.username || 'std_new'),
          studentNo: userObj.studentNo || '10100',
          role: 'student'
        };
        const updatedMembers = [...(foundClassroom.members || []), newMember];
        handleUpdateClassroomMembers(foundClassroom.id, updatedMembers);
      }

      setStudentClassrooms((prev) => {
        if (prev.some((c) => c.id === foundClassroom.id)) return prev;
        return [
          ...prev,
          {
            id: foundClassroom.id,
            name: foundClassroom.name,
            teacherName: foundTeacher?.name,
            teacherId: foundTeacher?.id,
            grade: foundClassroom.grade,
            code: foundClassroom.code,
            boards: foundClassroom.boards || []
          }
        ];
      });

      setSelectedStudentClassroomId(foundClassroom.id);
      setCurrentClassroom(foundClassroom);
      setViewLevel('boards');
      return { success: true, classroom: foundClassroom };
    }

    // 교사(공동 수업 교사)로 참여 시
    if (role === 'teacher') {
      const isAlreadyMember = foundClassroom.members?.some((m) => m.id === userObj.id);
      if (!isAlreadyMember) {
        const newMember = {
          id: userObj.id,
          name: userObj.name,
          username: `teacher_${userObj.id}`,
          role: 'co_teacher',
          email: `${userObj.id}@school.edu`
        };
        const updatedMembers = [...(foundClassroom.members || []), newMember];
        handleUpdateClassroomMembers(foundClassroom.id, updatedMembers);
      }

      // 현재 교사의 학급 목록에도 추가
      setTeachers((prevTeachers) =>
        prevTeachers.map((t) => {
          if (t.id === userObj.id) {
            if (t.classrooms.some((c) => c.id === foundClassroom.id)) return t;
            return {
              ...t,
              classrooms: [...t.classrooms, foundClassroom]
            };
          }
          return t;
        })
      );

      setCurrentClassroom(foundClassroom);
      return { success: true, classroom: foundClassroom };
    }
  };

  // 모달 열기 핸들러
  const handleOpenMembersModal = (cls) => {
    setSelectedManageClassroom(cls);
  };

  const handleOpenJoinModal = (role = 'teacher') => {
    setJoinModalRole(role);
    setIsJoinModalOpen(true);
  };

  // 1. 좌측 교사 이름 클릭 시 -> 오른쪽 메인에 그 교사의 학급 카드들 나열 (교사용 Level 1)
  const handleSelectTeacher = (teacherId) => {
    setActiveTeacherId(teacherId);
    const teacher = teachers.find((t) => t.id === teacherId);
    if (teacher && teacher.classrooms.length > 0) {
      setCurrentClassroom(teacher.classrooms[0]);
    }
    setViewLevel('classrooms');
    setDisplayedLevel('classrooms');
    setTransitionState({ phase: 'idle', level: 'classrooms' });
  };

  // 학생 모드에서 좌측 교실 클릭 시 -> 해당 교실의 수업 목록으로 줌 인(빨려나옴)
  const handleSelectStudentClassroom = (classroom, e) => {
    let rect = null;
    if (e && e.currentTarget) {
      rect = e.currentTarget.getBoundingClientRect();
    }
    setClassroomOrigin(rect);
    setSelectedStudentClassroomId(classroom.id);
    setCurrentClassroom(classroom);
    const teacher = teachers.find((t) => t.id === classroom.teacherId) || teachers[0];
    setActiveTeacherId(teacher.id);
    setViewLevel('boards');
    setDisplayedLevel('boards');
    setTransitionState({ phase: 'entering', level: 'boards' });
  };

  // 로그인 성공 핸들러: 프로그램 접속
  const handleLoginSuccess = (user, role) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    const targetRole = role || user.role || 'teacher';
    setCurrentRole(targetRole);

    if (targetRole === 'teacher') {
      const matchedTeacher = teachers.find((t) => t.id === user.refId || t.name === user.name) || teachers[0];
      setActiveTeacherId(matchedTeacher.id);
      setCurrentClassroom(matchedTeacher.classrooms?.[0] || null);
      setViewLevel('classrooms');
      setDisplayedLevel('classrooms');
    } else if (targetRole === 'student') {
      const matchedStudent = students.find((s) => s.id === user.refId || s.name === user.name) || students[0];
      setCurrentStudent(matchedStudent);
      setSelectedStudentClassroomId(null);
      setViewLevel('classrooms');
      setDisplayedLevel('welcome');
    } else if (targetRole === 'admin') {
      setViewLevel('classrooms');
      setDisplayedLevel('classrooms');
      setIsStudentAdminOpen(true);
    }
  };

  // 로그아웃 핸들러: 비로그인 웰컴 상태로 복귀
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setSelectedStudentClassroomId(null);
    setCurrentBoard(null);
    setCurrentNode(null);
    setIsStudentAdminOpen(false);
    setDisplayedLevel('classrooms');
    setViewLevel('classrooms');
  };

  // 왼쪽 상단 로고 및 사이트 이름 클릭 시 맨 처음 홈 화면으로 복귀
  const handleGoHome = () => {
    // 1. 수업 공간에 있었다면 작업 내용 자동 저장
    if (displayedLevel === 'lesson') {
      handleSaveCurrentBoard();
    }

    // 2. 열려 있는 각종 보조 창 및 팝업 상태 닫기
    setCanvasExpanded(false);
    setIsStudentAdminOpen(false);
    setIsExportOpen(false);
    setShowStudentProfileModal(false);
    setEditingBoard(null);
    setEditingClassroom(null);
    setIsJoinModalOpen(false);
    setIsTimerCelebrationOpen(false);

    // 3. 현재 역할에 맞는 최상위 홈으로 복귀
    if (currentRole === 'student') {
      setSelectedStudentClassroomId(null);
      setDisplayedLevel('welcome');
      setViewLevel('classrooms');
    } else {
      // 교사 모드일 경우 로그인 교사의 기본 교실 목록으로 복귀
      if (currentRole === 'teacher') {
        setActiveTeacherId(loggedInTeacherId);
        const myTeacher = teachers.find((t) => t.id === loggedInTeacherId) || teachers[0];
        setCurrentClassroom(myTeacher.classrooms?.[0] || null);
      }
      setViewLevel('classrooms');
      setDisplayedLevel('classrooms');
    }

    setTransitionState({ phase: 'idle', level: currentRole === 'student' ? 'welcome' : 'classrooms' });
  };

  // 역할 전환 시 레벨 동기화
  const handleRoleChange = (role) => {
    setCurrentRole(role);
    setTransitionState({ phase: 'idle', level: 'classrooms' });
    
    // 비로그인 상태일 때는 화면이 웰컴 상태(우측에 마크+프로그램명)로 유지됨
    if (!isLoggedIn) {
      return;
    }

    if (role === 'student') {
      setSelectedStudentClassroomId(null); // 학생 모드로 진입 시 교실 선택 전 상태로 초기화
      setDisplayedLevel('welcome');
    } else if (role === 'admin') {
      setViewLevel('classrooms');
      setDisplayedLevel('classrooms');
      setIsStudentAdminOpen(true); // 관리자 콘솔 모달 오픈
    } else {
      setViewLevel('classrooms');
      setDisplayedLevel('classrooms');
    }
  };

  // 2. 학급 카드 클릭 시 -> 그 학급의 수업 차시별 주제 카드들로 줌 인(빨려나옴)
  const handleSelectClassroom = (classroom, e) => {
    let rect = null;
    if (e && e.currentTarget) {
      rect = e.currentTarget.getBoundingClientRect();
    }
    setClassroomOrigin(rect);
    setCurrentClassroom(classroom);
    setViewLevel('boards');
    setDisplayedLevel('boards');
    setTransitionState({ phase: 'entering', level: 'boards' });
  };

  // 3. 수업 차시별 주제 카드 클릭 시 -> 실제 수업 공간으로 줌 인(빨려나옴)
  const handleSelectBoard = (board, e) => {
    let rect = null;
    if (e && e.currentTarget) {
      rect = e.currentTarget.getBoundingClientRect();
    }
    setBoardOrigin(rect);
    setCurrentBoard(board);
    setLessonMode(board.mode || 'guided');
    setNodes(board.nodes || []);
    setEdges(board.edges || []);
    setPosts(board.posts || []);
    setActiveStageId(board.activeStageId || (board.nodes?.[0]?.id || 'canvas-main'));
    setLiveStageId(board.liveStageId || (board.nodes?.[0]?.id || 'canvas-main'));
    setCanvasExpanded(false); // 첫 화면은 흐름도 단독
    setViewLevel('lesson');
    setDisplayedLevel('lesson');
    setTransitionState({ phase: 'entering', level: 'lesson' });
  };

  // 4. 수업 공간에서 차시 목록으로 뒤로가기 -> 원래 보드 카드로 역방향 줌 아웃(빨려들어감)
  const handleBackFromLesson = () => {
    handleSaveCurrentBoard();
    setTransitionState({ phase: 'exiting', level: 'lesson' });
    setTimeout(() => {
      setViewLevel('boards');
      setDisplayedLevel('boards');
      setTransitionState({ phase: 'idle', level: 'boards' });
    }, 290);
  };

  // 5. 수업 차시 목록에서 교실 목록으로 뒤로가기 -> 원래 교실 카드로 역방향 줌 아웃(빨려들어감)
  const handleBackFromBoards = () => {
    setTransitionState({ phase: 'exiting', level: 'boards' });
    setTimeout(() => {
      if (currentRole === 'student') {
        setSelectedStudentClassroomId(null);
        setDisplayedLevel('welcome');
      } else {
        setViewLevel('classrooms');
        setDisplayedLevel('classrooms');
      }
      setTransitionState({ phase: 'idle', level: currentRole === 'student' ? 'welcome' : 'classrooms' });
    }, 290);
  };

  // 교사 협업 채팅 핸들러
  const handleOpenTeacherChat = (teacher) => {
    setActiveChatTeacher(teacher);
  };

  const handleSendTeacherChatMessage = (teacherId, message) => {
    setTeacherChats((prev) => ({
      ...prev,
      [teacherId]: [...(prev[teacherId] || []), message]
    }));
  };

  // 학생 개인정보 변경 요청 신청
  const handleSubmitProfileChange = (e) => {
    e.preventDefault();
    if (!newRequestedName.trim()) return;

    const newReq = {
      id: `req-${Date.now()}`,
      studentId: currentStudent.id,
      studentNo: currentStudent.studentNo,
      studentName: currentStudent.name,
      requestType: '이름/닉네임 변경',
      requestedValue: `${currentStudent.studentNo} (${newRequestedName.trim()})`,
      reason: '학생 직접 변경 신청',
      status: 'pending',
      requestDate: '방금 전'
    };

    setChangeRequests([newReq, ...changeRequests]);
    setProfileRequestSuccess(true);
    setTimeout(() => {
      setProfileRequestSuccess(false);
      setShowStudentProfileModal(false);
      setNewRequestedName('');
    }, 2000);
  };

  // 현재 차시(수업 흐름도, 노드, 엣지, 포스트) 저장 핸들러
  const handleSaveCurrentBoard = () => {
    if (!currentBoard || !currentClassroom) return;

    const updatedBoard = {
      ...currentBoard,
      nodes,
      edges,
      posts,
      activeStageId,
      liveStageId
    };

    setCurrentBoard(updatedBoard);

    // 현재 교실 내 boards 업데이트
    setCurrentClassroom((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        boards: (prev.boards || []).map((b) =>
          b.id === currentBoard.id ? updatedBoard : b
        )
      };
    });

    // teachers 계층 구조에도 반영
    setTeachers((prevTeachers) =>
      prevTeachers.map((t) => ({
        ...t,
        classrooms: (t.classrooms || []).map((c) =>
          c.id === currentClassroom.id
            ? {
                ...c,
                boards: (c.boards || []).map((b) =>
                  b.id === currentBoard.id ? updatedBoard : b
                )
              }
            : c
        )
      }))
    );

    // 학생 교실 목록에도 동기화
    setStudentClassrooms((prev) =>
      prev.map((c) =>
        c.id === currentClassroom.id
          ? {
              ...c,
              boards: (c.boards || []).map((b) =>
                b.id === currentBoard.id ? updatedBoard : b
              )
            }
          : c
      )
    );
  };

  // 라이브 동기화 적용된 활성 스테이지 ID
  const effectiveStageId = (lessonMode === 'guided' && currentRole === 'student') ? liveStageId : activeStageId;
  const currentNode = nodes.find((n) => n.id === effectiveStageId) || {
    id: 'canvas-main',
    title: currentBoard?.title || '무한 캔버스',
    description: `${currentClassroom?.name} - ${currentBoard?.title} 전체 협업 캔버스`,
    canvasSections: currentBoard?.sections || ['학생 발표', '선생님 자료']
  };

  return (
    <div className="app-container">
      {/* 1. 상단 글로벌 네비게이션 바 (뱃지 제거, 학생관리/내보내기 임시 제거, 역할 필 유지) */}
      <Navbar
        currentRole={currentRole}
        setCurrentRole={handleRoleChange}
        lessonMode={lessonMode}
        setLessonMode={(m) => {
          setLessonMode(m);
          if (m === 'canvas') setCanvasExpanded(true);
          else setCanvasExpanded(false);
        }}
        viewLevel={viewLevel}
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onGoHome={handleGoHome}
      />

      {/* 관리자 모드 및 로그인 상태일 때: 상단 마스터 권한 알림 바 & 계정/권한 관리 콘솔 열기 버튼 */}
      {isLoggedIn && currentRole === 'admin' && (
        <div className="admin-master-top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="admin-master-badge">👑 시스템 관리자 모드</span>
            <span>모든 선생님의 교실과 수업을 수정·관리할 수 있는 마스터 권한이 적용되어 있습니다.</span>
            {users.filter((u) => u.status === 'pending').length > 0 && (
              <span className="admin-top-pending-badge">
                신규 가입 승인 대기 {users.filter((u) => u.status === 'pending').length}건
              </span>
            )}
          </div>
          <button 
            type="button" 
            className="admin-open-console-btn"
            onClick={() => setIsStudentAdminOpen(true)}
            title="교사/학생 가입 승인, 학년·반 관리, 아이디, 비밀번호 관리 콘솔 열기"
          >
            <Settings size={13} />
            <span>관리자 콘솔 (가입승인·학급·계정)</span>
            {users.filter((u) => u.status === 'pending').length > 0 && (
              <span className="btn-badge-counter">{users.filter((u) => u.status === 'pending').length}</span>
            )}
          </button>
        </div>
      )}

      {/* 수업 공간(lesson)에 있을 때만 교실 통제 및 타이머 바 표시 (위에서 슬라이드 다운/업 애니메이션) */}
      {(displayedLevel === 'lesson' || (transitionState.phase === 'exiting' && transitionState.level === 'lesson')) && (
        <div 
          className={`timer-slide-wrapper ${
            transitionState.phase === 'entering' && transitionState.level === 'lesson'
              ? 'timer-slide-enter'
              : transitionState.phase === 'exiting' && transitionState.level === 'lesson'
              ? 'timer-slide-exit'
              : ''
          }`}
        >
          <TimerControl
            currentRole={currentRole}
            isLocked={isLocked}
            setIsLocked={setIsLocked}
            requireApproval={requireApproval}
            setRequireApproval={setRequireApproval}
            onlineStudentsCount={students.filter((s) => s.isOnline).length}
            lessonCode="SCI-502"
            onTimerExpire={() => {
              setIsTimerCelebrationOpen(true);
            }}
          />

          {/* 학생 모드일 때: 접속 안내 바 */}
          {currentRole === 'student' && (
            <div className="student-status-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="live-pulse-dot"></span>
                <span>
                  접속 학생: <strong>{currentStudent.name}</strong> ({currentStudent.studentNo} / {currentStudent.className} {currentStudent.group})
                </span>
                {lessonMode === 'guided' && (
                  <span className="live-sync-indicator">
                    <Radio size={12} /> 선생님 진행 단계: <strong>{currentNode?.title}</strong> 실시간 동기화 중
                  </span>
                )}
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                onClick={() => setShowStudentProfileModal(true)}
              >
                <Edit size={12} /> 개인정보 변경
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. 메인 바디 레이아웃 */}
      <div className="main-app-body">
        {/* 좌측 사이드바: 교사 모드일 때는 선생님 보드 / 학생 모드일 때는 교실 목록 (작은 버튼으로 접기/열기 가능) */}
        <TeacherSidebar
          teachers={teachers}
          activeTeacherId={activeTeacherId}
          onSelectTeacher={(t) => {
            if (!isLoggedIn) {
              setIsLoginModalOpen(true);
              return;
            }
            handleSelectTeacher(t);
          }}
          currentRole={currentRole}
          studentClassrooms={studentClassrooms}
          activeClassroomId={currentRole === 'student' ? selectedStudentClassroomId : currentClassroom?.id}
          onSelectStudentClassroom={(c) => {
            if (!isLoggedIn) {
              setIsLoginModalOpen(true);
              return;
            }
            handleSelectStudentClassroom(c);
          }}
          onOpenTeacherChat={handleOpenTeacherChat}
          onOpenJoinModal={handleOpenJoinModal}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        {/* 우측 메인 영역: 3단계 카드형 네비게이션 흐름 */}
        <main ref={workspaceRef} className="workspace-hybrid-layout">
          {/* 1. 로그인 전(첫 접속 시): 교사모드, 학생모드, 관리자 콘솔 모두 우측에 ClassTree 마크와 프로그램 이름 표시 */}
          {!isLoggedIn ? (
            <div className="student-welcome-screen universal-welcome">
              <div className="welcome-brand-mark" title="ClassTree">
                <GitFork size={52} />
              </div>
              <h1 className="welcome-brand-title">ClassTree</h1>
              <p className="welcome-brand-subtitle">
                {currentRole === 'teacher' && '선생님의 교실과 수업 흐름도를 설계하고 학생들과 실시간 협동 수업을 진행합니다.'}
                {currentRole === 'student' && '친구들과 함께 의견을 나누고 지식 흐름도를 탐구하는 스마트 교실 공간입니다.'}
                {currentRole === 'admin' && '회원가입 승인·반려, 학년·반 배정 및 전체 시스템을 총괄 관리합니다.'}
              </p>
              <div className="welcome-login-prompt-box">
                <button
                  type="button"
                  className="btn-welcome-login-cta"
                  onClick={() => setIsLoginModalOpen(true)}
                  title="로그인하고 시작하기"
                >
                  <LogIn size={17} />
                  <span>로그인하여 프로그램 접속하기</span>
                </button>
                <span className="welcome-hint-text">
                  * 오른쪽 위의 [로그인] 버튼을 눌러 교사, 학생, 관리자 계정으로 접속할 수 있습니다.
                </span>
              </div>
            </div>
          ) : currentRole === 'student' && !selectedStudentClassroomId && displayedLevel !== 'boards' && displayedLevel !== 'lesson' ? (
            <div className="student-welcome-screen">
              <div className="welcome-brand-mark" title="ClassTree">
                <GitFork size={48} />
              </div>
              <h1 className="welcome-brand-title">ClassTree</h1>
              <p className="welcome-brand-subtitle">
                왼쪽 교실 목록에서 참여할 교실을 선택해 주세요.
              </p>
            </div>
          ) : (
            <div 
              className={`mac-zoom-view-wrapper ${
                transitionState.phase === 'entering' ? 'mac-zoom-entering' : ''
              } ${
                transitionState.phase === 'exiting' ? 'mac-zoom-exiting' : ''
              }`}
              style={currentZoomStyle}
            >
              {/* Level 1: 교사의 학급(교실) 카드 목록 */}
              {displayedLevel === 'classrooms' && (
                <ClassroomCardView
                  teacher={currentTeacher}
                  onSelectClassroom={handleSelectClassroom}
                  currentRole={currentRole}
                  loggedInTeacherId={loggedInTeacherId}
                  onOpenMembersModal={handleOpenMembersModal}
                  onOpenCreateClassroomModal={() => setIsCreateClassroomModalOpen(true)}
                  onEditClassroom={(cls) => setEditingClassroom(cls)}
                  onDeleteClassroom={handleDeleteClassroom}
                />
              )}

              {/* Level 2: 학급의 수업 차시별 주제 카드 목록 */}
              {displayedLevel === 'boards' && (
                <BoardCardView
                  teacher={currentTeacher}
                  classroom={currentClassroom}
                  onBackToClassrooms={handleBackFromBoards}
                  onSelectBoard={handleSelectBoard}
                  currentRole={currentRole}
                  loggedInTeacherId={loggedInTeacherId}
                  onOpenCreateBoardModal={() => setIsCreateBoardModalOpen(true)}
                  onEditBoard={(board) => setEditingBoard(board)}
                  onDeleteBoard={handleDeleteBoard}
                />
              )}

              {/* Level 3: 실제 수업 공간 (교사 주도 흐름도 or 무한 캔버스) */}
              {displayedLevel === 'lesson' && (() => {
                const isMyTeacherClassroom = currentTeacher?.id === loggedInTeacherId;
                const canModifyLesson = currentRole === 'admin' || (currentRole === 'teacher' && isMyTeacherClassroom);

                return (
                  <div className="lesson-workspace-wrapper">
                    {/* 상단 수업 탈출 및 뒤로가기 브레드크럼 바 */}
                    <div className="lesson-top-nav-bar">
                      <button 
                        className="lesson-exit-btn"
                        onClick={handleBackFromLesson}
                        title="수업 차시 목록으로 돌아가기 (자동 저장됨)"
                      >
                        <ArrowLeft size={15} />
                        <span>{currentClassroom?.name} 수업 목록으로</span>
                      </button>
                      <div className="lesson-current-path">
                        <span>{currentTeacher?.name}</span>
                        <span className="path-sep">/</span>
                        <span>{currentClassroom?.name}</span>
                        <span className="path-sep">/</span>
                        <strong>{currentBoard?.title}</strong>
                        {currentRole === 'teacher' && !isMyTeacherClassroom && (
                          <span className="readonly-permission-badge" style={{ marginLeft: '12px' }}>
                            👁️ 다른 교사 수업 (열람 전용)
                          </span>
                        )}
                        {currentRole === 'admin' && (
                          <span className="admin-permission-badge" style={{ marginLeft: '12px' }}>
                            👑 관리자 마스터 권한
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 모드별 뷰 렌더링 */}
                    {lessonMode === 'canvas' ? (
                      /* 무한 캔버스 모드: 전체화면 패들렛 */
                      <PadletBoard
                        currentNode={{
                          id: 'canvas-main',
                          title: currentBoard?.title,
                          description: `${currentClassroom?.name} : 자유롭게 생각과 자료를 펼치는 무한 캔버스 공간입니다.`,
                          canvasSections: currentBoard?.sections || ['학생 발표', '선생님 자료']
                        }}
                        posts={posts}
                        setPosts={setPosts}
                        currentRole={currentRole}
                        canModify={canModifyLesson}
                        isLocked={isLocked}
                        requireApproval={requireApproval}
                        currentStudent={currentStudent}
                        lessonMode={lessonMode}
                        onUpdateSections={(newSections) => {
                          if (!canModifyLesson) return;
                          setCurrentBoard((prev) => ({ ...prev, sections: newSections }));
                        }}
                      />
                    ) : (
                      /* 교사 주도 모드: 첫 화면 흐름도 단독 -> 카드 클릭 시 상단 최소화 + 하단 캔버스 확장 */
                      <>
                        {!canvasExpanded ? (
                          <FlowCanvas
                            nodes={nodes}
                            setNodes={setNodes}
                            edges={edges}
                            setEdges={setEdges}
                            currentRole={currentRole}
                            canModify={canModifyLesson}
                            activeStageId={effectiveStageId}
                            setActiveStageId={setActiveStageId}
                            liveStageId={liveStageId}
                            setLiveStageId={setLiveStageId}
                            posts={posts}
                            isMinimized={false}
                            onOpenCanvas={(nodeId) => {
                              setActiveStageId(nodeId);
                              setCanvasExpanded(true);
                            }}
                            onSaveBoard={canModifyLesson ? handleSaveCurrentBoard : undefined}
                          />
                        ) : (
                          <>
                            <FlowCanvas
                              nodes={nodes}
                              setNodes={setNodes}
                              edges={edges}
                              setEdges={setEdges}
                              currentRole={currentRole}
                              canModify={canModifyLesson}
                              activeStageId={effectiveStageId}
                              setActiveStageId={setActiveStageId}
                              liveStageId={liveStageId}
                              setLiveStageId={setLiveStageId}
                              posts={posts}
                              isMinimized={true}
                              onBackToOverview={() => setCanvasExpanded(false)}
                            />

                            <PadletBoard
                              currentNode={currentNode}
                              posts={posts}
                              setPosts={setPosts}
                              currentRole={currentRole}
                              canModify={canModifyLesson}
                              isLocked={isLocked}
                              requireApproval={requireApproval}
                              currentStudent={currentStudent}
                              lessonMode={lessonMode}
                              onBackToOverview={() => setCanvasExpanded(false)}
                              onToggleCanvas={() => {
                                if (!canModifyLesson || !currentNode) return;
                                setNodes((prev) =>
                                  prev.map((n) =>
                                    n.id === currentNode.id
                                      ? { ...n, hasCanvas: n.hasCanvas === false ? true : false }
                                      : n
                                  )
                                );
                              }}
                              onUpdateSections={(newSections) => {
                                if (!canModifyLesson) return;
                                setNodes((prev) =>
                                  prev.map((n) =>
                                  n.id === currentNode.id ? { ...n, canvasSections: newSections } : n
                                )
                              );
                            }}
                          />
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </main>
    </div>

      {/* 모달들 */}
      {showStudentProfileModal && (
        <div className="modal-overlay" onClick={() => setShowStudentProfileModal(false)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">개인정보 변경 요청</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowStudentProfileModal(false)}>취소</button>
            </div>
            <form onSubmit={handleSubmitProfileChange}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">현재 학번 및 이름</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={`${currentStudent.studentNo} ${currentStudent.name}`} 
                    disabled 
                    style={{ background: '#f1f5f9' }} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">변경 희망 이름</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newRequestedName}
                    onChange={(e) => setNewRequestedName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowStudentProfileModal(false)}>닫기</button>
                <button type="submit" className="btn btn-primary">변경 요청</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 교사 1:1 협업 메신저 플로팅 윈도우 */}
      {activeChatTeacher && (currentRole === 'teacher' || currentRole === 'admin') && (
        <TeacherChatMessenger
          targetTeacher={activeChatTeacher}
          currentTeacher={currentTeacher}
          chats={teacherChats}
          onSendMessage={handleSendTeacherChatMessage}
          onClose={() => setActiveChatTeacher(null)}
        />
      )}

      {/* 1번 요구사항: 학급 참여 인원 관리 모달 (공동 수업 교사 vs 학생 권한 설정 & 아이디 확인) */}
      <ClassroomMembersModal
        isOpen={!!selectedManageClassroom}
        classroom={selectedManageClassroom}
        onClose={() => setSelectedManageClassroom(null)}
        onUpdateMembers={handleUpdateClassroomMembers}
        currentTeacherName={currentTeacher?.name}
      />

      {/* 2번 요구사항: 고유 코드를 통한 학급 초대 및 참여 모달 */}
      <JoinClassroomModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        currentRole={joinModalRole}
        currentTeacher={currentTeacher}
        currentStudent={currentStudent}
        onJoinByCode={handleJoinClassroomByCode}
        activeClassroom={currentClassroom}
      />

      {/* 새 수업 차시 개설 모달 */}
      <CreateBoardModal
        isOpen={isCreateBoardModalOpen}
        onClose={() => setIsCreateBoardModalOpen(false)}
        classroom={currentClassroom}
        onCreateBoard={handleCreateBoard}
        availableClassrooms={teachers.flatMap((t) =>
          (t.classrooms || []).map((c) => ({
            ...c,
            teacherName: t.name,
            teacherId: t.id
          }))
        )}
      />

      {/* 새 학급(교실) 개설 모달 */}
      <CreateClassroomModal
        isOpen={isCreateClassroomModalOpen}
        onClose={() => setIsCreateClassroomModalOpen(false)}
        teacher={currentTeacher}
        onCreateClassroom={handleCreateClassroom}
      />

      {/* 학급(교실) 정보 수정 모달 */}
      <EditClassroomModal
        isOpen={!!editingClassroom}
        classroom={editingClassroom}
        onClose={() => setEditingClassroom(null)}
        onSaveClassroom={handleSaveEditedClassroom}
      />

      {/* 수업 차시 정보 수정 모달 */}
      <EditBoardModal
        isOpen={!!editingBoard}
        board={editingBoard}
        onClose={() => setEditingBoard(null)}
        onSaveBoard={handleSaveEditedBoard}
      />

      {/* 시스템 관리자 종합 콘솔 모달 (아이디·비밀번호 수정/초기화 & 교사/학생 권한 변경) */}
      <StudentAdmin
        isOpen={isStudentAdminOpen}
        onClose={() => setIsStudentAdminOpen(false)}
        users={users}
        setUsers={setUsers}
        teachers={teachers}
        setTeachers={setTeachers}
        students={students}
        setStudents={setStudents}
        changeRequests={changeRequests}
        setChangeRequests={setChangeRequests}
      />

      {/* 로그인 모달 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        users={users}
        onLoginSuccess={handleLoginSuccess}
        currentRole={currentRole}
      />

      {/* 타이머 종료 화려한 폭죽 & 시선 집중 모달 */}
      {isTimerCelebrationOpen && (
        <TimerExpireCelebrationModal
          onClose={() => setIsTimerCelebrationOpen(false)}
          currentRole={currentRole}
        />
      )}
    </div>
  );
}
