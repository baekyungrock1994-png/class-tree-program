// 교사 -> 교실 -> 보드 3단계 계층 구조 및 모드별 초기 데이터

export const INITIAL_LESSON = {
  id: 'lesson-main',
  title: '새로운 수업 차시',
  teacherName: '선생님',
  currentMode: 'guided',
  activeStageId: 'node-1',
  liveStageId: 'node-1',
  isLocked: false,
  timerSeconds: 600,
  timerActive: false,
  requirePostApproval: false,
  waitingRoomEnabled: false,
};

// 1. 기본 수업 시작 노드 (더미 데이터 삭제 후 1단계 스타터 노드만 유지)
export const WEATHER_FLOW_NODES = [
  {
    id: 'node-1',
    stepNumber: 1,
    title: '1단계: 도입 및 생각 열기',
    description: '수업 활동을 시작하며 오늘의 학습 주제를 확인하고 생각을 기록해 보세요.',
    x: 60,
    y: 90,
    category: '도입',
    color: '#6366f1',
    hasCanvas: true,
    canvasSections: ['학생 발표', '선생님 자료'],
    boardStatus: 'open'
  }
];

export const WEATHER_EDGES = [];

// 더미 게시글 삭제 완료 (빈 배열)
export const WEATHER_POSTS = [];
export const NEWSPAPER_CANVAS_POSTS = [];

// 2. 선생님 -> 교실 -> 보드 기본 계층 구조
export const TEACHER_HIERARCHY = [
  {
    id: 'tch-1',
    name: '김선생님',
    role: '교사',
    color: '#4f46e5',
    classrooms: [
      {
        id: 'cls-101',
        name: '우리 반 교실',
        grade: '5학년',
        code: 'CLS-501',
        members: [
          { id: 'tch-1', name: '김선생님', username: 'teacher', role: 'owner', email: 'teacher@school.edu' }
        ],
        boards: [
          {
            id: 'brd-1',
            title: '1단원: 첫 번째 수업 탐구',
            mode: 'guided',
            nodes: WEATHER_FLOW_NODES,
            edges: WEATHER_EDGES,
            posts: [],
            sections: ['학생 발표', '선생님 자료'],
            activeStageId: 'node-1',
            liveStageId: 'node-1'
          }
        ]
      }
    ]
  }
];

// 더미 학생 목록 삭제 완료 (빈 배열)
export const INITIAL_STUDENTS = [];

// 더미 정보 변경 요청 목록 삭제 완료 (빈 배열)
export const INITIAL_CHANGE_REQUESTS = [];

// 4. 회원 계정 목록 (더미 가상 학생/신청자 제거, 최고 관리자 및 기본 교사 계정만 보존)
export const INITIAL_USERS = [
  {
    id: 'usr-admin',
    name: '최고 관리자',
    username: 'admin',
    password: 'password123!',
    role: 'admin',
    detail: 'ClassTree 최고 관리자 마스터 계정',
    joinedDate: '2026-03-01',
    status: 'active'
  },
  {
    id: 'usr-tch-1',
    refId: 'tch-1',
    name: '김선생님',
    username: 'teacher',
    password: 'password123!',
    role: 'teacher',
    detail: '담당 교사',
    joinedDate: '2026-03-01',
    status: 'active'
  }
];
