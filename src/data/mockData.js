// 교사 -> 교실 -> 보드 3단계 계층 구조 및 모드별 초기 데이터

// 1. 선생님 -> 교실 -> 보드 기본 계층 구조 (더미 교실 및 더미 교사 제거)
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
