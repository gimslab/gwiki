# gwiki

**gwiki**는 개인용 파일 기반 위키 애플리케이션입니다. 마크다운 파일로 콘텐츠를 관리하며, Git을 이용한 버전 관리 기능을 제공합니다.

이 문서는 시스템 운영 및 유지보수를 위한 매뉴얼입니다.

---

## 1. 설치 및 빌드

### 필수 조건
- Node.js (v18 이상 권장)
- npm
- Git

### 초기 설정
프로젝트 루트에서 다음 스크립트를 실행하여 프론트엔드와 백엔드를 모두 빌드합니다.

```bash
# 프로덕션 빌드 (프론트엔드 + 백엔드)
./build_production.sh
```

## 2. 서버 실행

### 개발 모드
백엔드와 프론트엔드를 각각 개발 모드로 실행합니다.

```bash
# 백엔드 (포트 8080)
cd backend
npm run dev

# 프론트엔드 (별도 터미널)
cd frontend
npm run dev
```

### 프로덕션 모드
빌드된 결과물을 실행합니다.

```bash
./run_production.sh
```
- HTTPS 서버: `https://localhost:8080` (또는 설정된 도메인)
- HTTP 리디렉션 서버: `http://localhost:8000`

---

## 3. 서비스 운영 (Systemd)

이 애플리케이션은 `systemd` 서비스(`gwiki.service`)로 등록되어 실행됩니다.

### 주요 명령어

- **상태 확인**: `sudo systemctl status gwiki`
- **시작**: `sudo systemctl start gwiki`
- **중지**: `sudo systemctl stop gwiki`
- **재시작**: `sudo systemctl restart gwiki`
- **로그 확인**: `sudo journalctl -u gwiki -f` (실시간 로그)

---

## 4. SSL 인증서 관리 (Let's Encrypt)

이 서비스는 **Let's Encrypt** 무료 SSL 인증서를 사용하고 있습니다.

- **도메인**: `h.gimslab.com`
- **인증서 경로**: `/etc/letsencrypt/live/h.gimslab.com/`
- **만료 예정일**: 2026년 3월 30일 (최초 발급 기준)

### 자동 갱신 (Auto-renewal)
`certbot`이 설치되면서 자동으로 갱신 타이머가 등록되었습니다.
- 타이머 확인: `sudo systemctl list-timers | grep certbot`
- 동작 원리: 만료 30일 전부터 하루 2회 갱신을 시도합니다.

**주의:** 인증서 파일이 갱신되더라도, Node.js 서버가 이를 다시 읽어오려면 **서비스 재시작**이 필요합니다.
이를 자동화하려면 다음 명령어를 한 번 실행해 두는 것이 좋습니다 (테스트 포함):

```bash
sudo certbot renew --dry-run --deploy-hook "systemctl restart gwiki"
```

### 수동 갱신 절차
자동 갱신에 실패하거나 수동으로 갱신해야 할 경우 다음 절차를 따릅니다.

1. **갱신 시도**:
   ```bash
   sudo certbot renew
   ```
2. **서비스 재시작**:
   ```bash
   sudo systemctl restart gwiki
   ```

### 문제 해결

**Q. 인증서 갱신 시 권한 오류가 발생하나요?**
인증서 파일(`/etc/letsencrypt/...`)은 보안상 `root`만 접근 가능합니다. `gwiki` 서비스(사용자 `gim`)가 읽을 수 있도록 권한 설정이 되어 있어야 합니다.

```bash
# gim 사용자에게 읽기 권한 부여
sudo chown -R root:gim /etc/letsencrypt/live /etc/letsencrypt/archive
sudo chmod -R 750 /etc/letsencrypt/live /etc/letsencrypt/archive
```

**Q. 갱신 실패 시 로그 확인**
```bash
sudo cat /var/log/letsencrypt/letsencrypt.log
```

---

## 5. 환경 변수 설정 (`backend/.env`)

HTTPS 적용을 위해 `backend/.env` 파일에 다음 설정이 포함되어야 합니다.

```env
# ... 기존 설정 ...

# SSL Certificate paths (Let's Encrypt)
SSL_KEY_PATH=/etc/letsencrypt/live/h.gimslab.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/h.gimslab.com/fullchain.pem
```
