# gwiki 개발 계획 (Development Plan)

이 문서는 gwiki 프로젝트의 전체 개발 계획과 진행 상황을 추적하기 위해 작성되었습니다.

**참고:** 각 항목을 구현할 때는 프로젝트의 전체적인 아키텍처와 API 명세가 담긴 **[시스템 설계 문서](../system-design.md)**를 참고하세요.

---

### ✅ Phase 0: 프로젝트 설정 및 설계

- [x] **요구사항 정의:** `prd.md` 작성 완료
- [x] **시스템 설계:** `system-design.md` 작성 완료
- [x] **백엔드 프로젝트 기본 설정:**
  - [x] `npm` 프로젝트 초기화
  - [x] TypeScript, Express 등 라이브러리 설치
  - [x] `tsconfig.json` 설정
  - [x] `nodemon`을 이용한 개발 환경 구성
- [x] **프론트엔드 프로젝트 기본 설정:**
  - [x] `create-react-app` 또는 `Vite`를 이용한 React 프로젝트 생성

---

### 🚧 Phase 1: 백엔드 개발

- [x] **인증 시스템 (Authentication System):**
  - [x] 환경변수 설정 (`dotenv`, `src/config.ts`)
  - [x] `POST /api/auth/login` 엔드포인트 구현 및 테스트 완료
  - [x] JWT 인증 미들웨어 구현 (`src/middleware/auth.ts`)
- [x] **페이지 관리 API (Page Management API):**
  - [x] `GET /api/pages` - 페이지 목록 조회
  - [x] `GET /api/pages/{pageName}` - 페이지 상세 조회
  - [x] `POST /api/pages` - 새 페이지 생성
  - [x] `PUT /api/pages/{pageName}` - 페이지 수정
  - [x] `DELETE /api/pages/{pageName}` - 페이지 삭제
- [x] **Git 관리 API (Git Management API):**
  - [x] `simple-git` 라이브러리 설치 및 설정
  - [x] `GET /api/git/status` - 변경 상태 확인
  - [x] `POST /api/git/commit` - 커밋 생성
- [x] **검색 API (Search API):**
  - [x] `GET /api/search?q={query}` - 내용 검색

---

### ⏳ Phase 2: 프론트엔드 개발

- [x] **기본 레이아웃 구성:** 사이드바, 헤더, 메인 콘텐츠 영역
- [x] **라우팅 설정:** `react-router-dom`을 이용한 페이지 간 이동
- [x] **인증 흐름 구현:**
  - [x] 로그인 페이지 UI
  - [x] 로그인 API 연동 및 JWT 저장/관리
  - [x] 로그아웃 기능
- [x] **페이지 기능 구현:**
  - [x] 페이지 목록 조회 및 사이드바에 표시
  - [x] 마크다운 뷰어(Renderer)를 이용한 페이지 조회
  - [x] 마크다운 에디터를 이용한 페이지 생성 및 수정
- [x] **Git 관리 페이지 구현:**
  - [x] `git status` 결과 표시
  - [x] 커밋 메시지 입력 및 커밋 요청
- [x] 검색 기능 구현:
  - [x] 검색창 UI
  - [x] 검색 API 연동 및 결과 표시
- [x] 웹페이지 크기 조절 및 가로 스크롤바 문제 해결
  - [x] 로그아웃 상태에서 루트 페이지에 로그인 버튼 추가
  - [x] 페이지 관리 기능 (생성) 테스트
  - [x] 페이지 관리 기능 (조회) 테스트
  - [x] 페이지 관리 기능 (수정) 테스트
  - [x] 페이지 관리 기능 (삭제) 테스트
  - [x] Git 관리 기능 (상태 확인, 커밋) 테스트
  - [x] 검색 기능 테스트

---

### ✅ Phase 3: 배포

- [x] **운영 환경용 빌드:**
  - [x] 프론트엔드 앱 빌드 (`npm run build`)
  - [x] 백엔드 서버가 빌드된 프론트엔드 파일을 서빙하도록 설정
- [x] **Dockerfile 작성 (선택 사항):** Docker를 이용한 배포 준비
- [x] **배포 및 최종 테스트**
