# 시스템 설계 문서 (System Design): gwiki

**문서 버전:** 1.0
**작성일:** 2025년 11월 3일

---

## 1. 개요

이 문서는 `prd.md`에 정의된 요구사항을 바탕으로 gwiki 애플리케이션의 기술적 아키텍처와 시스템 설계를 정의합니다.

---

## 2. 아키텍처

### 2.1. 고수준 아키텍처

gwiki는 클라이언트-서버 모델을 따릅니다.

*   **클라이언트 (Client):** 사용자의 웹 브라우저에서 실행되는 React 기반의 단일 페이지 애플리케이션(SPA).
*   **서버 (Server):** Node.js/Express로 구현된 API 서버. 데이터(페이지 파일)를 관리하고 사용자 인증을 처리합니다.

### 2.2. 컴포넌트

*   **프론트엔드 (Frontend):**
    *   **기술 스택:** React
    *   **역할:** 사용자 인터페이스(UI) 제공, 마크다운 에디터, 페이지 렌더링, 백엔드 API와의 통신을 담당합니다.

*   **백엔드 (Backend):**
    *   **언어 (Language):** TypeScript
    *   **런타임 (Runtime):** Node.js
    *   **프레임워크 (Framework):** Express
    *   **주요 라이브러리 (Key Libraries):**
        *   `jsonwebtoken`: JWT 기반 인증 토큰 생성 및 검증
        *   `bcrypt`: 관리자 비밀번호 해싱(hashing)
        *   `cors`: 개발 환경에서 Cross-Origin Resource Sharing 처리
        *   `ts-node`, `nodemon`: TypeScript 개발 워크플로우 및 서버 자동 재시작
    *   **역할:** RESTful API 제공, 사용자 인증 처리, 파일 시스템을 이용한 페이지 CRUD(생성, 읽기, 수정, 삭제), Git을 이용한 버전 관리를 담당합니다.

*   **데이터 스토어 (Data Store):**
    *   **기술 스택:** Filesystem, Git
    *   **역할:** 모든 위키 페이지의 본문(.md 파일)을 물리적인 파일로 저장합니다. 모든 변경 사항은 Git 커밋으로 기록되어 버전 관리가 이루어집니다.

### 2.3. 실행 환경 (Runtime Environment)

개발과 운영 환경을 분리하여 효율성을 높입니다.

*   **개발 환경:**
    *   **프론트엔드:** React 개발 서버(예: `localhost:3000`)를 별도로 실행하여 Hot-reloading 등 개발 편의 기능을 활용합니다.
    *   **백엔드:** Node.js API 서버(예: `localhost:8080`)를 별도로 실행합니다.
    *   **CORS:** 백엔드에서 `cors` 라이브러리를 사용해 프론트엔드 개발 서버의 요청을 허용해야 합니다.

*   **운영 환경 (최종 목표):**
    *   React 앱을 빌드(`npm run build`)하여 정적 파일(HTML, JS, CSS)을 생성합니다.
    *   Node.js 서버 하나가 API 서버의 역할과 정적 파일 서빙 역할을 **모두** 수행합니다. 이를 통해 CORS 문제 없이 단일 프로세스로 전체 애플리케이션을 운영할 수 있습니다.

---

## 3. 데이터 모델 및 저장소

### 3.1. 디렉토리 구조

서버의 특정 경로 아래에 모든 데이터를 저장합니다. 이 경로는 설정 파일(`.env`)의 `DATA_DIRECTORY_PATH` 변수를 통해 지정할 수 있어 유연하게 변경 가능합니다.

```
/path/to/your/wiki/data/  (DATA_DIRECTORY_PATH)
|-- .git/         # Git 저장소 메타데이터
|-- pages/        # 페이지 마크다운 파일 저장
|   |-- Welcome.md
|   |-- How-to-use.md
|   `-- ...
```

*   모든 페이지는 `.md` 확장자를 가진 파일로 `pages/` 디렉토리 내에 저장됩니다.
*   페이지 제목은 파일 이름과 직접적으로 매핑됩니다.

### 3.2. 버전 관리

*   페이지 생성, 수정, 삭제 작업은 파일 시스템의 내용을 변경할 뿐, 자동으로 `git commit`을 실행하지 않습니다.
*   사용자는 별도의 **'변경사항 관리' 페이지**에서 현재 작업 중인 모든 파일의 변경 상태(수정, 추가, 삭제)를 확인할 수 있습니다. (git status와 유사)
*   이 페이지에서 사용자는 커밋 메시지를 작성하고 '커밋' 버튼을 눌러 현재까지의 모든 변경사항을 하나의 커밋으로 묶어 저장할 수 있습니다.

---

## 4. 인증 시스템

시스템은 단 한 명의 관리자/사용자만 가정합니다.

### 4.1. 개요

*   별도의 회원가입 기능은 제공하지 않습니다.
*   인증 정보는 서버의 설정 파일(Environment Variables)에 정적으로 저장됩니다.

### 4.2. 설정

프로젝트 루트에 `.env` 파일을 생성하여 관리자 정보를 저장합니다. 이 파일은 Git에 포함되지 않도록 `.gitignore`에 추가해야 합니다.

```.env
# .env

# 데이터 파일(.md)을 저장할 디렉토리의 절대 경로
# 이 디렉토리는 독립적인 Git 저장소로 관리됩니다.
DATA_DIRECTORY_PATH=/path/to/your/wiki/data

# 관리자 사용자 이름
ADMIN_USERNAME=admin

# 관리자 비밀번호 (bcrypt 등으로 해시 처리된 값)
ADMIN_PASSWORD_HASH=$2b$10$....

# JWT 서명에 사용할 시크릿 키
JWT_SECRET=your-super-secret-key
```

### 4.3. 로그인 흐름

1.  사용자가 프론트엔드 로그인 페이지에서 아이디와 비밀번호를 입력합니다.
2.  `POST /api/login` 요청을 보냅니다.
3.  서버는 요청받은 아이디가 `.env`의 `ADMIN_USERNAME`과 일치하는지 확인합니다.
4.  비밀번호는 `bcrypt.compare()`와 같은 함수를 사용하여 요청받은 비밀번호와 `.env`의 `ADMIN_PASSWORD_HASH` 값을 비교합니다.
5.  인증에 성공하면, 서버는 JWT(JSON Web Token)를 생성하여 클라이언트에 반환합니다.
6.  클라이언트는 이 JWT를 저장하고, 이후 모든 API 요청의 `Authorization` 헤더에 `Bearer {token}` 형태로 포함하여 보냅니다.

---

## 5. API 엔드포인트

| 기능 | Method | URL | 요청 본문 (Body) | 응답 | 인증 필요 |
| --- | --- | --- | --- | --- | --- |
| **인증** |
| 로그인 | `POST` | `/api/login` | `{ "username": "...", "password": "..." }` | `{ "token": "..." }` | No |
| 로그아웃 | `POST` | `/api/logout` | (없음) | `200 OK` | Yes |
| **페이지** |
| 목록 조회 | `GET` | `/api/pages` | (없음) | `[{ "name": "...", "path": "..." }]` | Yes |
| 상세 조회 | `GET` | `/api/pages/{pageName}` | (없음) | `{ "name": "...", "content": "..." }` | Yes |
| 생성 | `POST` | `/api/pages` | `{ "name": "...", "content": "..." }` | `201 Created` | Yes |
| 수정 | `PUT` | `/api/pages/{pageName}` | `{ "content": "..." }` | `200 OK` | Yes |
| 삭제 | `DELETE`| `/api/pages/{pageName}` | (없음) | `204 No Content` | Yes |
| **검색** |
| 내용 검색 | `GET` | `/api/search?q={query}` | (없음) | `[{ "name": "...", "path": "..." }]` | Yes |
| **Git 관리** |
| 변경 상태 확인 | `GET` | `/api/git/status` | (없음) | `[{ "path": "...", "status": "..." }]` | Yes |
| 커밋 | `POST` | `/api/git/commit` | `{ "message": "..." }` | `201 Created` | Yes |

---

## 6. 검색 설계 (v1.0)

*   **방식:** 단순 파일 내용 검색 (File Content Scan)
*   **동작:**
    1.  `GET /api/search?q=...` 요청을 받습니다.
    2.  서버는 `/data/gwiki/pages/` 디렉토리 내의 모든 `.md` 파일을 순차적으로 읽습니다.
    3.  각 파일의 내용에 검색어(query)가 포함되어 있는지 확인합니다.
    4.  검색어가 포함된 파일의 목록을 응답으로 반환합니다.
*   **고려사항:** 페이지 수가 매우 많아지면 성능이 저하될 수 있으나, 개인용 위키의 초기 버전에서는 충분히 효율적입니다.
