# Bithumb AI Trade Kit 검증 2차

검토 대상: CLI/MCP 0.8.5, GitHub main 2b6304261c81f48256e63b0588db2ca1c44df52f.
최신 여부는 npm registry latest 및 GitHub commits/main에서 재확인했다.

## 검증 방법과 한계

- 실계정과 실키를 사용하지 않았다. 모든 fetch는 모의 함수로 교체했다. 테스트 중 외부 API 요청은 발생하지 않았다.
- CLI는 배포된 main 함수부터 실제 파서, 설정 로더, REST 클라이언트, 출력 경로를 실행했다.
- MCP는 배포 소스의 원래 도구 등록 함수와 createServer 요청 처리 함수를 그대로 실행했다. SDK Server 등록 부분만 메모리 스텁으로 대체했으므로 실제 MCP 전송 계층과 개별 AI 클라이언트의 추가 검증은 검증 범위 밖이다.
- 거래소의 매칭 엔진, 실제 계정 차단, 실제 출금 및 실제 금전 손실은 검증하지 않았다.
- audit-v2.mjs는 매 실행 시 독립적인 임시 홈 디렉터리를 만들고, 프로세스의 os.homedir만 해당 경로로 대체한다. 사용자의 실제 설정 파일이나 키는 읽지 않는다.

## 신규 확인

### A. MCP 단일 주문의 time_in_force 누락 — 높음, 함수 수준 재현

최신 주문 API는 limit 주문에서 post_only/ioc/fok를 지원한다. MCP 단일 주문에 각 값을 전달하면 handler가 오류 없이 time_in_force 필드를 제외한 POST 본문을 생성한다. 같은 필드를 배치 주문에 넣으면 보존된다. CLI의 --time-in-force 옵션은 지원하지 않으며 오류로 차단된다. 따라서 조건 누락의 재현 범위는 MCP 단일 주문 처리 경로다.

영향: maker-only 조건이나 즉시 체결/취소 조건이 제거된 일반 지정가 주문이 제출될 수 있다. 실제 체결 결과는 호가 및 거래소 처리에 달려 있다.
근거: mcp/package/dist/index.js registerTradeTools의 trade_place_order.handler 및 https://apidocs.bithumb.com/reference/주문-요청

### B. MCP 로그 조회의 자기 중첩 — 높음, 읽기 전용 상태 재현

system_get_audit_log는 기존 로그 객체를 포함한 응답을 반환하고, createServer는 그 응답 전체를 logTool로 다시 기록한다. 다음 조회가 이전 조회 응답까지 포함한다. 기본 limit 20으로 7회 조회한 실험에서 파일 크기는 381, 973, 2157, 4525, 9261, 18733, 37677바이트였다. 일곱 번째 MCP 반환값 JSON 크기는 73671바이트였다. read_only=true에서도 발생했다. 실험은 1MB 미만으로 제한했다.

영향: 정상적인 반복 진단으로 디스크, 파싱 메모리 및 AI 입력이 증폭될 수 있다. readEntries는 제한 개수를 적용하기 전에 최근 7일 로그 전체를 동기적으로 읽고 파싱한다. 실제 OOM이나 디스크 고갈까지 실행하지 않았다.
근거: mcp/package/dist/index.js readEntries, registerAuditTools, createServer의 logger.logTool.

### C. 호출 제한 분류 불일치 — 높음, 모의 시계 재현

최신 API 문서는 IP와 API 분류별 합산 제한을 명시한다. Private 기타 분류는 초당 140회다. 킷은 account_get_assets와 account_get_order_chance에 독립 버킷을 배정한다. 고정된 동일 타임스탬프에서 각 100회, 총 200회가 모의 fetch까지 통과했다. 실제 서버로 부하를 전송하지 않았다.

영향: 자체 제한기를 통과해도 서버 제한에 걸릴 수 있으며, 여러 CLI 프로세스/REST 클라이언트는 제한 상태도 공유하지 않는다.
근거: cli/package/dist/chunk-Y64A2CTR.js RateLimiter/privateRateLimit 및 https://apidocs.bithumb.com/docs/api-요청-수-제한-안내

### D. 인증 진단 실패에도 종료 코드 0 — 중요, CLI 진입점 재현

인증 거절을 모의 응답으로 반환하면 system diagnose 결과에 Auth Validity fail이 포함되지만 CLI 종료 코드는 0이다. 필수 진단을 셸 성공/실패로 검사하는 자동화는 통과시킬 수 있다. JSON의 checks를 별도로 검사하는 사용자에게 실패 정보가 숨겨지는 것은 아니다.
근거: cli/package/dist/system-7NJPR4AY.js cmdDiagnose 및 GitHub skills/bithumb-trade/SKILL.md Credential Check.

## 조건부 위험

### E. 주문 결과 불명 타임아웃에 일반 재시도 제안

주문을 수신했다고 가정한 모의 서버가 응답 단계에서 예외를 내도록 구성했다. 킷은 NetworkError와 Check network connectivity and try again. 제안을 반환했고 주문 상태를 조회하지 않았다. 테스트 코드가 동일 요청을 명시적으로 다시 실행했을 때 모의 주문은 2개였다. 둘 다 client_order_id는 없었다.

중요: 킷 자체가 자동 재시도했다는 주장이 아니다. 사용자가 재실행하거나 에이전트가 CLI 실패를 MCP로 전환하는 경우의 위험이다. 실제 중복 주문은 실거래로 검증하지 않았다. GitHub 스킬은 CLI unavailable/fails 때 MCP fallback을 허용하지만 모호한 주문 제출 결과를 구분하는 구체 절차가 부족하다.

### F. 취소 접수 결과를 취소 완료로 표시

취소 응답에 order_id와 created_at만 있는 모의 응답을 전달했을 때 CLI는 Order cancelled를 출력했다. DELETE 후 주문 상태 GET은 없었다. 최신 API 제목은 주문 취소 접수이고, GitHub 스킬은 취소 후 확인을 요구한다. 접수부터 완료까지 실제 서버 시간/상태 변화는 미검증이다.

## 이전 지적 재검증 및 범위 보정

- 없는 프로필이 환경변수 키로 넘어가고 쓰기 요청을 보내는 현상: CLI main부터 재현 유지.
- 전체 실패 배치 결과의 종료 코드 0: CLI main부터 재현 유지.
- MCP의 --read-only 실행 차단: 작동함. 이것을 읽기 전용 우회 취약점이라고 부르지 않는다.
- CLI 프로필 read_only가 MCP에 상속되지 않는 것은 별도 설정 경계다.
- 승인 프롬프트의 런타임 강제 부재는 클라이언트 책임과 관련된 설계 한계이며, 무조건 악용 가능한 보안 취약점으로 단정하지 않는다.
- 로그 필터의 배열/필드명 결함은 가짜 데이터로 검증됐지만 실제 Secret Key가 API 응답에 포함돼 유출됐다는 증거는 없다. 공식 문서는 발급 후 Secret Key 재조회가 불가하다고 설명한다.
- 구형 /v1/orders 사용 자체는 결함으로 분류하지 않는다. 최신 문서에도 해당 경로와 uuid/uuids 계약이 유지된다.

## 증거

- audit-v2.mjs: 독립 모의 검증 코드
- results-v2.json: 검증 결과
- verified-metadata.json: 버전과 배포 파일 SHA-256
- audit.mjs / results.json: 1차 검증
