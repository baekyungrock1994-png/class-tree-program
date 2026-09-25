// 교사 -> 교실 -> 보드 3단계 계층 구조 및 모드별 초기 데이터

export const INITIAL_LESSON = {
  id: 'lesson-sci-5-2',
  title: '초등 5학년 과학: 날씨와 우리 생활',
  teacherName: '김길동T',
  currentMode: 'guided', // 'guided': 교사 주도 모드, 'canvas': 무한 캔버스 모드
  activeStageId: 'node-1',
  liveStageId: 'node-1',
  isLocked: false,
  timerSeconds: 600,
  timerActive: false,
  requirePostApproval: false,
  waitingRoomEnabled: false,
};

// 1. 김길동T의 기본 노드 & 포스트 (날씨와 우리 생활)
export const WEATHER_FLOW_NODES = [
  {
    id: 'node-1',
    stepNumber: 1,
    title: '1. 습도와 이슬·안개',
    description: '건습구 습도계로 습도를 측정하고, 기온이 낮아질 때 수증기가 어떻게 응결되는지 관찰해 봅시다.',
    x: 40,
    y: 90,
    category: '관찰·탐구',
    color: '#10b981',
    hasCanvas: true,
    canvasSections: ['학생 발표', '선생님 자료'],
    boardStatus: 'open'
  },
  {
    id: 'node-2',
    stepNumber: 2,
    title: '2. 구름과 강수(비·눈)',
    description: '공기가 위로 올라가 팽창할 때 구름이 생기는 원리를 간이 구름 발생 장치로 실험합니다.',
    x: 360,
    y: 90,
    category: '실험·원리',
    color: '#0ea5e9',
    hasCanvas: true,
    canvasSections: ['학생 발표', '선생님 자료'],
    boardStatus: 'open'
  },
  {
    id: 'node-3',
    stepNumber: 3,
    title: '3. 고기압과 저기압의 바람',
    description: '공기의 무게와 기압의 차이에 의해 공기가 이동(바람)하는 방향을 추론해 봅시다.',
    x: 680,
    y: 90,
    category: '개념·적용',
    color: '#6366f1',
    hasCanvas: true,
    canvasSections: ['학생 발표', '선생님 자료'],
    boardStatus: 'open'
  },
  {
    id: 'node-4',
    stepNumber: 4,
    title: '4. 우리 생활과 일기예보',
    description: '일기도 기호를 해석하고 날씨 변화가 농업, 교통, 여가에 주는 영향을 토의해 봅시다.',
    x: 1000,
    y: 90,
    category: '융합·토의',
    color: '#f59e0b',
    hasCanvas: false,
    canvasSections: ['학생 발표', '선생님 자료'],
    boardStatus: 'open'
  }
];

export const WEATHER_EDGES = [
  { from: 'node-1', to: 'node-2' },
  { from: 'node-2', to: 'node-3' },
  { from: 'node-3', to: 'node-4' }
];

export const WEATHER_POSTS = [
  {
    id: 'post-1',
    nodeId: 'node-1',
    sectionName: '학생 발표',
    authorId: 'std-1',
    authorName: '배경록',
    studentNo: '10102',
    title: 'A의견에 대한 나의 생각',
    content: '1. 가나다라\n2. 가나다라\n3. 가가가나다',
    imageUrl: null,
    drawingDataUrl: null,
    likes: 3,
    likedBy: ['std-2'],
    comments: [
      { id: 'c-1', authorName: '홍길동', text: '1번에 저도 완전 동의해요!' }
    ],
    createdAt: '30분전',
    approved: true
  },
  {
    id: 'post-2',
    nodeId: 'node-1',
    sectionName: '학생 발표',
    authorId: 'std-2',
    authorName: '홍길동',
    studentNo: '10102',
    title: 'A의견에 대한 나의 생각',
    content: '1. 가나다라\n2. 가나다라\n3. 가가가나다',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    drawingDataUrl: null,
    likes: 5,
    likedBy: ['std-1', 'std-3'],
    comments: [
      { id: 'c-2', authorName: '김길동T', text: '책에서 찾은 예시와 연결한 점이 매우 훌륭합니다.' }
    ],
    createdAt: '30분전',
    approved: true
  },
  {
    id: 'post-3',
    nodeId: 'node-1',
    sectionName: '선생님 자료',
    authorId: 'tch-1',
    authorName: '김길동T',
    studentNo: '교사',
    title: '실험 1 핵심 가이드 (이슬·안개 발생 조건)',
    content: '• 수증기가 차가운 물체 표면에 닿아 응결하면 이슬\n• 공기 중의 먼지(응결핵)와 만나 공기 중에 떠 있으면 안개\n우리 교실 간이 실험 결과를 기록해 보세요!',
    imageUrl: null,
    drawingDataUrl: null,
    likes: 8,
    likedBy: ['std-1', 'std-2', 'std-3'],
    comments: [],
    createdAt: '1시간 전',
    approved: true
  },
  {
    id: 'post-4',
    nodeId: 'node-1',
    sectionName: '학생 발표',
    authorId: 'std-4',
    authorName: '이서연',
    studentNo: '10104',
    title: '얼음물 컵 실험 스케치',
    content: '얼음물이 든 차가운 컵 표면에 물방울이 맺히는 걸 직접 그렸어요. 공기 중 수증기가 응결된 것입니다.',
    imageUrl: null,
    drawingDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150"><rect width="300" height="150" fill="%23f0f9ff"/><rect x="110" y="30" width="80" height="90" rx="10" fill="%2393c5fd" stroke="%232563eb" stroke-width="3"/><circle cx="105" cy="60" r="4" fill="%233b82f6"/><circle cx="195" cy="80" r="5" fill="%233b82f6"/><circle cx="140" cy="85" r="4" fill="%233b82f6"/><text x="120" y="20" font-size="12" fill="%231e3a8a" font-weight="bold">얼음물 컵</text></svg>',
    likes: 4,
    likedBy: ['std-1', 'std-2'],
    comments: [],
    createdAt: '15분전',
    approved: true
  },
  {
    id: 'post-5',
    nodeId: 'node-2',
    sectionName: '학생 발표',
    authorId: 'std-3',
    authorName: '김민준',
    studentNo: '10103',
    title: '구름 발생 실험 관찰일지',
    content: '간이 구름 발생 장치 펌프로 압축했다가 밸브를 열었더니 단열 팽창으로 뿌옇게 구름이 발생했습니다!',
    imageUrl: null,
    drawingDataUrl: null,
    likes: 2,
    likedBy: ['std-1'],
    comments: [],
    createdAt: '5분전',
    approved: true
  }
];

// 무한 캔버스 전용 샘플 포스트 (날씨 신문 만들기)
export const NEWSPAPER_CANVAS_POSTS = [
  {
    id: 'post-canvas-1',
    nodeId: 'canvas-main',
    sectionName: '학생 발표',
    authorId: 'std-1',
    authorName: '배경록',
    studentNo: '10102',
    title: '태풍 힌남노 특집 기사 기획안',
    content: '1. 발생 경로 및 중심 기압 분석\n2. 해안가 및 농경지 침수 피해 예방 인터뷰\n3. 우리 동네 안전 수칙 포스터 제작',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    drawingDataUrl: null,
    likes: 6,
    likedBy: ['std-2', 'std-3'],
    comments: [
      { id: 'c-np-1', authorName: '김길동T', text: '기상청 일기도 자료를 1면에 배치하면 좋겠네요!' }
    ],
    createdAt: '20분전',
    approved: true
  },
  {
    id: 'post-canvas-2',
    nodeId: 'canvas-main',
    sectionName: '선생님 자료',
    authorId: 'tch-1',
    authorName: '김길동T',
    studentNo: '교사',
    title: '날씨 신문 제작 가이드 & 양식',
    content: '• 헤드라인 기사: 이번 주 가장 중요한 날씨 뉴스\n• 과학 칼럼: 왜 봄철에 황사와 미세먼지가 심할까?\n• 날씨 만평 / 4컷 만화 코너',
    imageUrl: null,
    drawingDataUrl: null,
    likes: 12,
    likedBy: ['std-1', 'std-2', 'std-4'],
    comments: [],
    createdAt: '2시간 전',
    approved: true
  },
  {
    id: 'post-canvas-3',
    nodeId: 'canvas-main',
    sectionName: '학생 발표',
    authorId: 'std-2',
    authorName: '홍길동',
    studentNo: '10102',
    title: '일기예보 아나운서 대본 카드',
    content: '내일은 전국이 맑은 고기압의 영향을 받아 화창한 봄 날씨가 이어지겠습니다.\n낮 최고 기온은 22도로 야외 활동하기에 쾌적하겠습니다.',
    imageUrl: null,
    drawingDataUrl: null,
    likes: 4,
    likedBy: ['std-1'],
    comments: [],
    createdAt: '10분전',
    approved: true
  }
];

// 2. 선생님 -> 교실 -> 보드 3단계 계층 구조
export const TEACHER_HIERARCHY = [
  {
    id: 'tch-1',
    name: '김길동T',
    role: '메인 교사 (5-1)',
    color: '#4f46e5',
    classrooms: [
      {
        id: 'cls-101',
        name: '5학년 1반 과학',
        grade: '5학년',
        code: 'SCI-501',
        members: [
          { id: 'tch-1', name: '김길동T', username: 'teacher_kim', role: 'owner', email: 'kim@school.edu' },
          { id: 'tch-2', name: '홍길동T', username: 'teacher_hong', role: 'co_teacher', email: 'hong@school.edu' },
          { id: 'std-1', name: '배경록', username: 'std_10101', studentNo: '10101', role: 'student' },
          { id: 'std-2', name: '홍길동', username: 'std_10102', studentNo: '10102', role: 'student' },
          { id: 'std-3', name: '김민준', username: 'std_10103', studentNo: '10103', role: 'student' },
          { id: 'std-4', name: '이서연', username: 'std_10104', studentNo: '10104', role: 'student' }
        ],
        boards: [
          {
            id: 'brd-1',
            title: '1단원: 날씨와 우리 생활',
            mode: 'guided', // 교사 주도 모드
            nodes: WEATHER_FLOW_NODES,
            edges: WEATHER_EDGES,
            posts: WEATHER_POSTS,
            sections: ['학생 발표', '선생님 자료'],
            activeStageId: 'node-1',
            liveStageId: 'node-1'
          },
          {
            id: 'brd-2',
            title: '프로젝트: 우리 반 날씨 신문',
            mode: 'canvas', // 무한 캔버스 모드
            nodes: [],
            edges: [],
            posts: NEWSPAPER_CANVAS_POSTS,
            sections: ['학생 발표', '선생님 자료'],
            activeStageId: 'canvas-main',
            liveStageId: 'canvas-main'
          }
        ]
      },
      {
        id: 'cls-102',
        name: '방과후 환경·기후 동아리',
        grade: '동아리',
        code: 'ENV-702',
        members: [
          { id: 'tch-1', name: '김길동T', username: 'teacher_kim', role: 'owner', email: 'kim@school.edu' },
          { id: 'tch-3', name: '남길동T', username: 'teacher_nam', role: 'co_teacher', email: 'nam@school.edu' },
          { id: 'std-1', name: '배경록', username: 'std_10101', studentNo: '10101', role: 'student' },
          { id: 'std-2', name: '홍길동', username: 'std_10102', studentNo: '10102', role: 'student' }
        ],
        boards: [
          {
            id: 'brd-3',
            title: '지구 온난화와 기후 위기 토의',
            mode: 'canvas',
            nodes: [],
            edges: [],
            posts: [
              {
                id: 'post-env-1',
                nodeId: 'canvas-main',
                sectionName: '학생 발표',
                authorId: 'std-1',
                authorName: '배경록',
                studentNo: '10102',
                title: '플라스틱 제로 챌린지 실천기록',
                content: '텀블러 사용하기 및 분리배출 3일차 실천 사진입니다.',
                imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
                likes: 5,
                likedBy: [],
                comments: [],
                createdAt: '1시간 전',
                approved: true
              }
            ],
            sections: ['학생 발표', '선생님 자료'],
            activeStageId: 'canvas-main',
            liveStageId: 'canvas-main'
          }
        ]
      }
    ]
  },
  {
    id: 'tch-2',
    name: '홍길동T',
    role: '협동 교사 (5-2)',
    color: '#0ea5e9',
    classrooms: [
      {
        id: 'cls-201',
        name: '5학년 2반 과학',
        grade: '5학년',
        code: 'SCI-502',
        members: [
          { id: 'tch-2', name: '홍길동T', username: 'teacher_hong', role: 'owner', email: 'hong@school.edu' },
          { id: 'tch-1', name: '김길동T', username: 'teacher_kim', role: 'co_teacher', email: 'kim@school.edu' },
          { id: 'std-5', name: '박도윤', username: 'std_10105', studentNo: '10105', role: 'student' }
        ],
        boards: [
          {
            id: 'brd-4',
            title: '2단원: 생물과 환경의 상호작용',
            mode: 'guided',
            nodes: [
              {
                id: 'node-bio-1',
                stepNumber: 1,
                title: '1. 생태계의 구성 요소',
                description: '생물 요소(생산자, 소비자, 분해자)와 비생물 요소 탐구하기',
                x: 40,
                y: 90,
                category: '관찰·탐구',
                color: '#10b981',
                hasCanvas: true,
                canvasSections: ['학생 발표', '선생님 자료'],
                boardStatus: 'open'
              },
              {
                id: 'node-bio-2',
                stepNumber: 2,
                title: '2. 먹이 사슬과 먹이 그물',
                description: '생태계 평형이 유지되는 조건 알아보기',
                x: 360,
                y: 90,
                category: '실험·원리',
                color: '#0ea5e9',
                hasCanvas: true,
                canvasSections: ['학생 발표', '선생님 자료'],
                boardStatus: 'open'
              }
            ],
            edges: [{ from: 'node-bio-1', to: 'node-bio-2' }],
            posts: [
              {
                id: 'post-bio-1',
                nodeId: 'node-bio-1',
                sectionName: '학생 발표',
                authorId: 'std-5',
                authorName: '박도윤',
                studentNo: '10105',
                title: '화단의 생물 조사 결과',
                content: '개미, 지렁이, 풀, 참새를 관찰했습니다.',
                likes: 3,
                likedBy: [],
                comments: [],
                createdAt: '40분전',
                approved: true
              }
            ],
            sections: ['학생 발표', '선생님 자료'],
            activeStageId: 'node-bio-1',
            liveStageId: 'node-bio-1'
          }
        ]
      }
    ]
  },
  {
    id: 'tch-3',
    name: '남길동T',
    role: '전담 교사 (실험실)',
    color: '#10b981',
    classrooms: [
      {
        id: 'cls-301',
        name: '과학 창의 융합 교실',
        grade: '전학년',
        code: 'EXP-301',
        members: [
          { id: 'tch-3', name: '남길동T', username: 'teacher_nam', role: 'owner', email: 'nam@school.edu' },
          { id: 'tch-1', name: '김길동T', username: 'teacher_kim', role: 'co_teacher', email: 'kim@school.edu' },
          { id: 'std-2', name: '홍길동', username: 'std_10102', studentNo: '10102', role: 'student' }
        ],
        boards: [
          {
            id: 'brd-5',
            title: '창의 발명 아이디어 캔버스',
            mode: 'canvas',
            nodes: [],
            edges: [],
            posts: [
              {
                id: 'post-inv-1',
                nodeId: 'canvas-main',
                sectionName: '학생 발표',
                authorId: 'std-2',
                authorName: '홍길동',
                studentNo: '10102',
                title: '비 올 때 신발 젖지 않는 방수 커버',
                content: '폐우산 천을 재활용해서 신발 커버를 만드는 아이디어입니다.',
                likes: 7,
                likedBy: [],
                comments: [],
                createdAt: '25분전',
                approved: true
              }
            ],
            sections: ['학생 발표', '선생님 자료'],
            activeStageId: 'canvas-main',
            liveStageId: 'canvas-main'
          }
        ]
      }
    ]
  }
];

export const INITIAL_STUDENTS = [
  { id: 'std-1', studentNo: '50101', name: '배경록', grade: 5, classNum: 1, className: '5학년 1반', group: '1조', status: 'active', isOnline: true },
  { id: 'std-2', studentNo: '50102', name: '홍길동', grade: 5, classNum: 1, className: '5학년 1반', group: '1조', status: 'active', isOnline: true },
  { id: 'std-3', studentNo: '50103', name: '김민준', grade: 5, classNum: 1, className: '5학년 1반', group: '2조', status: 'active', isOnline: true },
  { id: 'std-4', studentNo: '50104', name: '이서연', grade: 5, classNum: 1, className: '5학년 1반', group: '2조', status: 'active', isOnline: true },
  { id: 'std-5', studentNo: '50201', name: '박도윤', grade: 5, classNum: 2, className: '5학년 2반', group: '1조', status: 'active', isOnline: false },
  { id: 'std-6', studentNo: '50202', name: '최유나', grade: 5, classNum: 2, className: '5학년 2반', group: '2조', status: 'active', isOnline: true },
  { id: 'std-7', studentNo: '40101', name: '정시우', grade: 4, classNum: 1, className: '4학년 1반', group: '1조', status: 'active', isOnline: false },
  { id: 'std-8', studentNo: '40102', name: '윤서아', grade: 4, classNum: 1, className: '4학년 1반', group: '1조', status: 'active', isOnline: true },
  { id: 'std-9', studentNo: '60101', name: '강하늘', grade: 6, classNum: 1, className: '6학년 1반', group: '1조', status: 'active', isOnline: true },
  { id: 'std-10', studentNo: '60102', name: '송지호', grade: 6, classNum: 1, className: '6학년 1반', group: '2조', status: 'active', isOnline: false },
  { id: 'std-11', studentNo: '60201', name: '조예준', grade: 6, classNum: 2, className: '6학년 2반', group: '1조', status: 'active', isOnline: true },
];

export const INITIAL_CHANGE_REQUESTS = [
  {
    id: 'req-1',
    studentId: 'std-5',
    studentNo: '50201',
    studentName: '박도윤',
    requestType: '학번 및 닉네임 변경',
    requestedValue: '50201 (박도윤->도윤이대장)',
    reason: '오타 수정 및 친근한 이름 표기',
    status: 'pending',
    requestDate: '오늘 09:12'
  }
];

// 관리자 콘솔용 전체 가입 사용자 (교사 & 학생) 통합 계정 데이터
export const INITIAL_USERS = [
  // --- [활동 중인 교사] ---
  {
    id: 'usr-tch-1',
    refId: 'tch-1',
    name: '김길동T',
    username: 'teacher_kim',
    password: 'password123!',
    role: 'teacher',
    email: 'kim@school.edu',
    detail: '5학년 1반 담임 / 과학과 부장',
    joinedDate: '2026-03-01',
    status: 'active'
  },
  {
    id: 'usr-tch-2',
    refId: 'tch-2',
    name: '홍길동T',
    username: 'teacher_hong',
    password: 'password123!',
    role: 'teacher',
    email: 'hong@school.edu',
    detail: '5학년 2반 협동 교사',
    joinedDate: '2026-03-02',
    status: 'active'
  },
  {
    id: 'usr-tch-3',
    refId: 'tch-3',
    name: '남길동T',
    username: 'teacher_nam',
    password: 'password123!',
    role: 'teacher',
    email: 'nam@school.edu',
    detail: '과학 창의실험 전담 교사',
    joinedDate: '2026-03-05',
    status: 'active'
  },

  // --- [가입 승인 대기 중인 교사 (Pending)] ---
  {
    id: 'usr-tch-pending-1',
    name: '이수학T',
    username: 'teacher_lee',
    password: 'password123!',
    role: 'teacher',
    email: 'lee_math@school.edu',
    detail: '수학과 전담 교사 (신규 가입 신청)',
    joinedDate: '오늘 14:20',
    status: 'pending',
    requestReason: '5학년 수학·과학 융합 수업 공동교사 참여 요청'
  },

  // --- [활동 중인 학생 (학년/반 분류)] ---
  {
    id: 'usr-std-1',
    refId: 'std-1',
    name: '배경록',
    username: 'std_50101',
    password: 'password123!',
    role: 'student',
    grade: 5,
    classNum: 1,
    studentNo: '50101',
    email: 'std50101@school.edu',
    detail: '5학년 1반 1번 (1조)',
    joinedDate: '2026-03-10',
    status: 'active'
  },
  {
    id: 'usr-std-2',
    refId: 'std-2',
    name: '홍길동',
    username: 'std_50102',
    password: 'password123!',
    role: 'student',
    grade: 5,
    classNum: 1,
    studentNo: '50102',
    email: 'std50102@school.edu',
    detail: '5학년 1반 2번 (1조)',
    joinedDate: '2026-03-10',
    status: 'active'
  },
  {
    id: 'usr-std-3',
    refId: 'std-3',
    name: '김민준',
    username: 'std_50103',
    password: 'password123!',
    role: 'student',
    grade: 5,
    classNum: 1,
    studentNo: '50103',
    email: 'std50103@school.edu',
    detail: '5학년 1반 3번 (2조)',
    joinedDate: '2026-03-11',
    status: 'active'
  },
  {
    id: 'usr-std-4',
    refId: 'std-4',
    name: '이서연',
    username: 'std_50104',
    password: 'password123!',
    role: 'student',
    grade: 5,
    classNum: 1,
    studentNo: '50104',
    email: 'std50104@school.edu',
    detail: '5학년 1반 4번 (2조)',
    joinedDate: '2026-03-11',
    status: 'active'
  },
  {
    id: 'usr-std-5',
    refId: 'std-5',
    name: '박도윤',
    username: 'std_50201',
    password: 'password123!',
    role: 'student',
    grade: 5,
    classNum: 2,
    studentNo: '50201',
    email: 'std50201@school.edu',
    detail: '5학년 2반 1번 (1조)',
    joinedDate: '2026-03-12',
    status: 'active'
  },
  {
    id: 'usr-std-6',
    refId: 'std-6',
    name: '최유나',
    username: 'std_50202',
    password: 'password123!',
    role: 'student',
    grade: 5,
    classNum: 2,
    studentNo: '50202',
    email: 'std50202@school.edu',
    detail: '5학년 2반 2번 (2조)',
    joinedDate: '2026-03-12',
    status: 'active'
  },
  {
    id: 'usr-std-7',
    refId: 'std-7',
    name: '정시우',
    username: 'std_40101',
    password: 'password123!',
    role: 'student',
    grade: 4,
    classNum: 1,
    studentNo: '40101',
    email: 'std40101@school.edu',
    detail: '4학년 1반 1번 (1조)',
    joinedDate: '2026-03-13',
    status: 'active'
  },
  {
    id: 'usr-std-8',
    refId: 'std-8',
    name: '윤서아',
    username: 'std_40102',
    password: 'password123!',
    role: 'student',
    grade: 4,
    classNum: 1,
    studentNo: '40102',
    email: 'std40102@school.edu',
    detail: '4학년 1반 2번 (1조)',
    joinedDate: '2026-03-13',
    status: 'active'
  },
  {
    id: 'usr-std-9',
    refId: 'std-9',
    name: '강하늘',
    username: 'std_60101',
    password: 'password123!',
    role: 'student',
    grade: 6,
    classNum: 1,
    studentNo: '60101',
    email: 'std60101@school.edu',
    detail: '6학년 1반 1번 (1조)',
    joinedDate: '2026-03-14',
    status: 'active'
  },
  {
    id: 'usr-std-10',
    refId: 'std-10',
    name: '송지호',
    username: 'std_60102',
    password: 'password123!',
    role: 'student',
    grade: 6,
    classNum: 1,
    studentNo: '60102',
    email: 'std60102@school.edu',
    detail: '6학년 1반 2번 (2조)',
    joinedDate: '2026-03-14',
    status: 'active'
  },
  {
    id: 'usr-std-11',
    refId: 'std-11',
    name: '조예준',
    username: 'std_60201',
    password: 'password123!',
    role: 'student',
    grade: 6,
    classNum: 2,
    studentNo: '60201',
    email: 'std60201@school.edu',
    detail: '6학년 2반 1번 (1조)',
    joinedDate: '2026-03-15',
    status: 'active'
  },

  // --- [가입 승인 대기 중인 학생 (Pending)] ---
  {
    id: 'usr-std-pending-1',
    name: '최은우',
    username: 'std_50106',
    password: 'password123!',
    role: 'student',
    grade: 5,
    classNum: 1,
    studentNo: '50106',
    email: 'std50106@school.edu',
    detail: '5학년 1반 6번 (전입생 신청)',
    joinedDate: '오늘 15:30',
    status: 'pending',
    requestReason: '3월 타교 전입으로 인한 계정 생성 및 5학년 1반 등록 요청'
  },
  {
    id: 'usr-std-pending-2',
    name: '정하은',
    username: 'std_60202',
    password: 'password123!',
    role: 'student',
    grade: 6,
    classNum: 2,
    studentNo: '60202',
    email: 'std60202@school.edu',
    detail: '6학년 2반 2번 (신규 신청)',
    joinedDate: '오늘 16:15',
    status: 'pending',
    requestReason: '과학 프로젝트 수업 참여를 위한 신규 가입'
  },

  // --- [가입 반려된 계정 샘플 (Rejected)] ---
  {
    id: 'usr-rejected-1',
    name: '외부신청자',
    username: 'guest_outsider',
    password: 'password123!',
    role: 'student',
    grade: 4,
    classNum: 1,
    studentNo: '40199',
    email: 'outsider@gmail.com',
    detail: '외부 사용자 (학적 미확인)',
    joinedDate: '어제 11:00',
    status: 'rejected',
    rejectedReason: '학교 소속 학적부 명단 불일치'
  }
];
