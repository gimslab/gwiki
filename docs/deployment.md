# gwiki 프로덕션 배포 및 서비스 등록 가이드

이 문서는 gwiki 애플리케이션을 빌드하고, Linux 서버에서 `systemd` 서비스를 사용하여 영구적으로 실행하는 방법을 안내합니다.

## 사전 준비

배포 전에 프로덕션용으로 프론트엔드와 백엔드 애플리케이션을 빌드해야 합니다. 프로젝트 루트 디렉토리에서 다음 스크립트를 실행하세요.

```bash
./build_production.sh
```

## `systemd` 서비스를 이용한 배포

`systemd`는 Linux 시스템에서 서비스를 관리하는 표준적인 방법입니다. 서비스를 등록하면 서버가 시작될 때 애플리케이션을 자동으로 실행하고, 예기치 않은 오류로 인해 프로세스가 종료되면 자동으로 재시작할 수 있습니다.

### 1. `systemd` 서비스 파일 생성

먼저, gwiki를 위한 서비스 파일을 생성합니다. `sudo` 권한이 필요하며, `nano`나 `vim` 같은 텍스트 편집기를 사용하세요.

```bash
sudo nano /etc/systemd/system/gwiki.service
```

파일을 열고 아래 내용을 붙여넣으세요.

```ini
[Unit]
Description=gwiki web service
# 네트워크가 준비된 후에 서비스를 시작합니다.
After=network.target

[Service]
# 서비스를 실행할 사용자 계정을 지정합니다. (환경에 맞게 변경)
User=gim

# 프로젝트의 루트 디렉토리를 작업 디렉토리로 설정합니다.
WorkingDirectory=/home/gim/project/gwiki

# 서비스를 시작할 명령어로, run_production.sh 스크립트의 절대 경로를 지정합니다.
ExecStart=/home/gim/project/gwiki/run_production.sh

# 어떤 이유로든 서비스가 실패하면 항상 재시작합니다.
Restart=always

[Install]
# 다중 사용자 모드로 부팅될 때 서비스를 시작하도록 설정합니다.
WantedBy=multi-user.target
```

**참고:** `User`와 `WorkingDirectory`, `ExecStart` 경로는 실제 서버 환경에 맞게 수정해야 할 수 있습니다.

### 2. 서비스 활성화 및 시작

서비스 파일을 저장한 후, 다음 명령어를 순서대로 실행하여 서비스를 시스템에 등록하고 시작합니다. 이 과정은 **최초 한 번만** 수행하면 됩니다.

```bash
# systemd가 새로운 서비스 파일을 인식하도록 리로드합니다.
sudo systemctl daemon-reload

# 서버 부팅 시 gwiki 서비스가 자동으로 시작되도록 활성화합니다.
sudo systemctl enable gwiki.service

# 지금 바로 서비스를 시작합니다.
sudo systemctl start gwiki.service
```

### 3. 애플리케이션 업데이트

최초 배포 이후 소스 코드가 변경된 경우, 다음 두 단계를 통해 실행 중인 서비스에 변경사항을 적용할 수 있습니다.

1.  **코드 빌드:**
    프로젝트 루트에서 `build_production.sh`를 실행하여 변경된 코드를 다시 빌드합니다.
    ```bash
    ./build_production.sh
    ```

2.  **서비스 재시작:**
    새로운 빌드 파일을 서비스에 적용하기 위해 `systemd` 서비스를 재시작합니다.
    ```bash
    sudo systemctl restart gwiki.service
    ```

### 4. 서비스 관리 명령어

서비스가 실행된 후에는 다음 명령어를 사용하여 관리할 수 있습니다.

*   **서비스 상태 확인:**
    ```bash
    sudo systemctl status gwiki.service
    ```

*   **서비스 중지:**
    ```bash
    sudo systemctl stop gwiki.service
    ```

*   **서비스 재시작:**
    (코드 업데이트 후 적용 시 사용)
    ```bash
    sudo systemctl restart gwiki.service
    ```

*   **실시간 로그 확인:**
    서비스에서 출력되는 로그를 실시간으로 확인하려면 다음 명령어를 사용합니다.
    ```bash
    sudo journalctl -u gwiki.service -f
    ```
