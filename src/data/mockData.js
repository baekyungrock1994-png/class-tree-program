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

// 신규 보드 생성 시 사용할 1단계 기본 시작 노드 템플릿
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

// 2. 선생님 -> 교실 -> 보드 기본 계층 구조 (더미 교실 및 더미 교사 제거)
export const TEACHER_HIERARCHY = [];

// 학생 목록 (빈 배열)
export const INITIAL_STUDENTS = [];

// 정보 변경 요청 목록 (빈 배열)
export const INITIAL_CHANGE_REQUESTS = [];

// 4. 회원 계정 목록 (더미 교사 및 가상 학생 계정 모두 삭제, 최고 관리자 계정만 유지)
export const INITIAL_USERS = [
  {
    id: 'usr-admin',
    name: '최고 관리자',
    username: 'admin',
    password: 'password123!',
    role: 'admin',
    detail: 'ClassTree 시스템 총괄 관리자',
    joinedDate: '2026-03-01',
    status: 'active'
  }
];
