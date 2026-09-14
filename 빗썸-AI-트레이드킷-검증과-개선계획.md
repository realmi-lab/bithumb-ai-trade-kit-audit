# 빗썸 AI Trade Kit 검증 기록과 개선 계획

작성일: 2026-09-11 (한국 시간)

재검사 및 상세 보강: 2026-09-14 (한국 시간)

이 문서는 지금까지 조사한 허점, 검증 근거, 공식 참고 문서, 재현 방법, 우리가 구현해야 할 보호 장치, 앞으로의 검사 계획을 모은 작업 기준서다. 다음 작업자는 이 문서와 함께 보관된 증거부터 읽는다. 전체 보안 감사 완료나 모든 허점 발견을 의미하지 않는다.


## 2026-09-14 재검사 결과와 읽는 순서

**F01~F11은 보관본에서 다시 재현됐다. 현재 npm CLI/MCP latest도 0.8.5이며, 새로 내려받은 tarball 전체 파일이 보관본과 일치한다.** GitHub main도 기존 커밋과 같다. 이는 검사 시점의 사실이며 이후 릴리스에는 다시 확인해야 한다.

- 기존 재현 스크립트 3개를 독립 임시 복사본에서 실행했고 종료 코드 모두 0이었다. 이는 결함 재현 assertion 통과이며 제품 정상 판정이 아니다.
- F04는 함수 스텁을 넘어 실제 MCP SDK 1.26.0과 stdio JSON-RPC 통신으로 추가 재현했다. F09는 HTTP 401과 정확한 인증 검사 항목을 사용하는 사례를 추가했다.
- 원래 증거 파일은 덮어쓰지 않았다. 신규 결과는 [재검사 폴더](./recheck-20260914/), 추가 실행 방법은 [재검사 안내](./recheck-20260914/README.md)에 있다.
- 공식 주문·출금·요청 제한 웹 문서를 다시 읽었다. `.md` 원문 자동 저장은 403으로 실패하여 완전한 원문 스냅샷 확보로 처리하지 않았다.
- C01~C04는 조건부 위험/설계 경계이며 C05는 원문 추가 검증이 남았다. 문서의 향후 시나리오 전체를 실행했다는 의미가 아니다.
- 제품 소스 수정·실계정 거래·운영 배포는 하지 않았다. Node v24.19.0으로 검사했다.

[버전 확인 기록](./recheck-20260914/verification.json) · [배포 패키지 전체 대조](./recheck-20260914/package-comparison.json) · [실제 MCP stdio 결과](./recheck-20260914/mcp-stdio-results.json)

## 1. 목적과 현재 상태

목적은 빗썸 AI Trade Kit를 활용한 서비스·자동매매 도구를 만들 때, 문서의 사용 안내와 실제 실행 코드 사이에서 자금 손실·비밀정보 노출·운영 장애로 이어질 수 있는 차이를 확인하고 보완하는 것이다.

- 공개 소스 및 배포 코드 검토, 가짜 키·모의 응답을 사용하는 로컬 재현을 수행했다.
- 실제 계정 인증, 실제 주문·취소·출금, 서버 부하 테스트는 수행하지 않았다.
- upstream 소스 수정, 우리 서비스 구현, 운영 배포, 외부 제보는 아직 하지 않았다.
- MD/SKILL 지침은 AI에 전달하는 행동 지침이다. 런타임에서 강제하는 권한·승인·손실 한도와 같지 않다.
- 24시간 자동매매는 별도 상시 실행 환경, 상태 저장, 장애 복구와 위험 제한이 필요한 서비스다. 툴킷 설치만으로 운영 체계까지 완성되지는 않는다.

## 2. 검토 기준과 증거 보관

| 항목 | 이번 검토 기준 |
| --- | --- |
| 공식 저장소 | https://github.com/bithumb-official/bithumb-ai-trade-kit |
| GitHub 확인 커밋 | `2b6304261c81f48256e63b0588db2ca1c44df52f` |
| npm CLI | `@bithumb-official/bithumb-cli` 0.8.5 |
| npm MCP | `@bithumb-official/bithumb-mcp` 0.8.5 |
| 증거 폴더 | [bithumb-audit-evidence-20260911](./bithumb-audit-evidence-20260911/) |
| 버전·파일 해시 | [verified-metadata.json](./bithumb-audit-evidence-20260911/verified-metadata.json) |

버전은 조사 시점에 npm latest와 GitHub main으로 확인한 값이다. 향후 검사에서 계속 최신이라고 가정하지 않는다. GitHub main과 npm 배포본은 따로 비교해야 하며, 두 대상이 동일 빌드라는 보증도 하지 않는다.

### 증거 목록

- [1차 재현 코드](./bithumb-audit-evidence-20260911/audit.mjs) / [결과](./bithumb-audit-evidence-20260911/results.json)
- [2차 재현 코드](./bithumb-audit-evidence-20260911/audit-v2.mjs) / [결과](./bithumb-audit-evidence-20260911/results-v2.json)
- [3차 재현 코드](./bithumb-audit-evidence-20260911/audit-v3.mjs) / [결과](./bithumb-audit-evidence-20260911/results-v3.json)
- [2차 상세 검토 기록](./bithumb-audit-evidence-20260911/findings-v2.md)
- `cli/package/`, `mcp/package/`: 조사에 사용한 배포 패키지 사본. 재현에 필요한 번들·메타데이터를 보존했다.

결과 JSON에 남은 임시 경로는 당시 실행 경로이며, 현재 증거 경로가 아니다. fixture의 키·주소·주문 ID는 가짜 값이다. 사용자 설정과 실제 자격증명은 보관하지 않았다.

### 검증 수준

- **CLI 재현:** 실제 배포 CLI의 파서·설정 로더·요청 생성·출력 경로를 실행했다. 일부는 실제 별도 CLI 프로세스로 확인했다.
- **MCP 함수 재현:** 기존 1~3차는 SDK 등록 부분을 스텁으로 대체했다. 2026-09-14 F04와 읽기 전용 대조군은 실제 SDK stdio 검사로 보강했다. 나머지 MCP 사례와 개별 AI 앱 검사는 이 보강 범위에 포함하지 않는다.
- **계약 기반 모의 재현:** 공식 API 문서에 맞춘 모의 응답을 입력했다. 실제 서버의 응답·체결을 관찰한 것과 구분한다.
- **조건부 위험·설계 경계:** 코드에서 위험 조건은 확인했지만 실제 손실이나 악용까지 입증하지 않은 항목이다.

## 3. 확인한 허점과 고칠 기준

각 항목의 오류 위치 링크는 검증 자료를 보관한 GitHub 커밋 `62cba4a15302be83241f5a90f976434e4bebf1ba`에 고정했다. 줄 번호는 npm 0.8.5 배포 번들 기준이며 upstream TypeScript 원본 줄 번호가 아니다. 최신 버전에서는 위치와 동작을 다시 확인한다. 링크는 코드 근거를 가리키며, 누락 동작의 증명은 함께 보관한 재현 결과와 대조한다.

우선순위는 우리 서비스 도입 시의 작업 순서다. 공식 CVSS 평가가 아니다. P0는 실거래 연결 전 차단, P1은 운영 전 보완, P2는 후속 강화다.

### F01. 설정 파싱 오류가 Secret Key를 출력함 — P0

**오류 위치 — 보관된 0.8.5 배포 코드**

- [cli/package/dist/chunk-Y64A2CTR.js:3079–3089](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/cli/package/dist/chunk-Y64A2CTR.js#L3079-L3089) — readFullConfig: 파서 오류 원문을 예외 메시지에 포함.
- [cli/package/dist/index.js:221–224](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/cli/package/dist/index.js#L221-L224) — main.catch: Fatal 오류를 stderr에 출력.

- 조건: `secret_key="FAKE_SECRET"` 다음 줄 등에 `read_only=tru`처럼 TOML 오타가 있다.
- 실제 동작: 파서 오류가 주변 원문을 포함하고, CLI가 이를 그대로 표준 오류에 출력한다. 유효한 비밀키 줄도 함께 나온다.
- 근거: 3차 `malformed_config_discloses_secret_in_error`, `full_CLI_stderr_leaks_adjacent_valid_secret`.
- 영향: AI 도구 출력, CI 로그, 오류 보고서에 비밀값이 전달될 수 있다. 실제 사용자 키 유출을 관찰한 것은 아니다.
- 코드 위치: core `readFullConfig`; CLI `main().catch`.
- 할 일: 파서 원문을 사용자 출력에 직접 전달하지 않는다. 파일·행·열·안전한 오류 코드만 출력하고 예외·로그 경로 전반에 비밀값 제거를 적용한다.
- 완료 기준: 비밀값을 인접 줄·배열·예외 원인에 넣어도 stdout/stderr/로그/MCP 응답 어디에도 노출되지 않는다. 정상 설정은 계속 읽힌다.

**2026-09-14 재검사 상세**

- 판정: **재현 유지 — 실제 CLI 별도 프로세스**.
- 재현 입력: 가짜 secret_key가 정상인 설정에서 다음 줄만 read_only=tru로 만든 뒤 account assets 실행.
- 실행 경로와 원인: 설정 파서가 인접 줄을 포함한 오류를 만들고 최종 catch가 그대로 출력한다. CLI가 실패 종료해도 비밀값 출력은 이미 발생한다.
- 해석과 제한: 오류 반환과 비밀정보 보호는 별도 검사해야 한다. 수정 후 동일 가짜 비밀값을 stdout·stderr·파일 로그 전체에서 검색하고 0건을 요구한다.
- 이번 실행 증거: [results-v3.json](./recheck-20260914/results-v3.json)의 `full_CLI_stderr_leaks_adjacent_valid_secret` 항목.

```json
{
  "test": "full_CLI_stderr_leaks_adjacent_valid_secret",
  "exitCode": 1,
  "stderr": "Fatal: Failed to parse /private/var/folders/2y/j1pg5hzj125cqnyp0c_p42z40000gn/T/bithumb-recheck-frekeyat/fixture-v3-Wzwsqq/.bithumb/config.toml: Invalid TOML document: invalid value\n\n4:  secret_key=\"FAKE_SECRET_MUST_NOT_APPEAR\"\n5:  read_only=tru\n              ^\n\n"
}
```

### F02. 없는/불완전한 프로필에서 환경변수 계정으로 넘어감 — P0

**오류 위치 — 보관된 0.8.5 배포 코드**

- [cli/package/dist/chunk-Y64A2CTR.js:3095–3099](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/cli/package/dist/chunk-Y64A2CTR.js#L3095-L3099) — readTomlProfile: 없는 프로필을 빈 객체로 반환.
- [cli/package/dist/chunk-Y64A2CTR.js:3134–3149](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/cli/package/dist/chunk-Y64A2CTR.js#L3134-L3149) — loadConfig: 불완전한 명시 프로필에서 환경변수 키 선택.
- [cli/package/dist/chunk-Y64A2CTR.js:3189–3189](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/cli/package/dist/chunk-Y64A2CTR.js#L3189) — readOnly: 값이 없으면 false.

- 조건: 프로필 이름 오타 또는 키 일부 누락, 환경변수에는 다른 계정 키가 있다.
- 실제 동작: 환경변수 키가 선택되고 읽기 전용이 false인 상태로 쓰기 요청까지 생성될 수 있다.
- 근거: 1차 profile 항목 및 2차 CLI 재현.
- 영향: 사용자가 의도한 계정·보호 설정과 실제 실행 계정이 달라질 수 있다.
- 할 일: 명시적으로 지정한 프로필이 없거나 불완전하면 즉시 실패시킨다. 키 쌍을 서로 다른 출처에서 조합하지 않는다. 실행 계정의 안전한 식별값과 설정 출처를 보여준다.
- 완료 기준: 잘못된 프로필에서 네트워크 호출 0회. 의도한 정상 프로필에서는 성공. 자동 fallback은 명시적 정책 없이는 금지한다.

**2026-09-14 재검사 상세**

- 판정: **재현 유지 — core 및 CLI**.
- 재현 입력: 읽기 전용 프로필과 가짜 환경변수 키를 동시에 준비하고 --profile missing으로 주문을 요청.
- 실행 경로와 원인: 프로필을 못 찾으면 빈 객체가 되고 환경변수의 완전한 키 쌍이 선택된다. 기본 readOnly=false와 결합하여 요청 1회가 생성된다.
- 해석과 제한: 환경변수에 키가 없는 조건과 있는 조건을 분리한다. 다른 계정으로 실제 거래가 이루어진 검증은 아니며 가짜 키 선택과 요청 생성까지 확인했다.
- 이번 실행 증거: [results-v2.json](./recheck-20260914/results-v2.json)의 `full_CLI_missing_profile_write` 항목.

```json
{
  "test": "full_CLI_missing_profile_write",
  "requestSent": 1,
  "exitCode": 0
}
```

### F03. 읽기 전용 마법사의 알 수 없는 입력이 보호를 해제함 — P0

**오류 위치 — 보관된 0.8.5 배포 코드**

- [cli/package/dist/config-FAPUDUEP.js:205–220](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/cli/package/dist/config-FAPUDUEP.js#L205-L220) — runProfileWizard: y/yes 외 입력을 false로 저장.

- 조건: `Read-only? (y/N) [y]:`에 `true`를 입력한다.
- 실제 동작: `y`/`yes` 외 비어 있지 않은 입력을 false로 처리하여 기존 true를 false로 저장한다.
- 근거: 3차 `wizard_true_disables_readonly`; 대조군 `y`는 true 유지.
- 한계: 안내된 입력 형식은 y/N이다. 문제는 잘못된 입력을 거부하지 않고 보호 해제로 해석하는 데 있다.
- 할 일: 허용 입력을 명확하게 파싱하고 그 외에는 재질문한다. 빈 입력은 기존 값 유지. 보호 해제는 명확한 동작으로 표시한다.
- 완료 기준: 오타·공백·true/false·한글 응답 등에 대한 정책이 명시되어 있고, 인식하지 못한 값은 기존 보호를 바꾸지 않는다.

**2026-09-14 재검사 상세**

- 판정: **재현 유지 — 실제 설정 마법사 handler**.
- 재현 입력: 기존 read_only=true인 프로필에서 나머지 입력은 유지하고 Read-only? 질문에 true 입력.
- 실행 경로와 원인: 정규식 /^y(es)?$/i가 false를 반환하고 기존 보호 설정을 false로 덮어쓴다. Updated profile만 출력된다.
- 해석과 제한: 정상 y 입력은 true를 유지했다. 미지원 응답을 보호 해제로 해석하는 것이 문제이며 API 자체 권한을 우회하지 않는다.
- 이번 실행 증거: [results-v3.json](./recheck-20260914/results-v3.json)의 `wizard_true_disables_readonly` 항목.

```json
{
  "test": "wizard_true_disables_readonly",
  "readOnlyBefore": true,
  "answer": "true",
  "readOnlyAfter": false,
  "prompt": "Read-only? (y/N) [y]: ",
  "output": "Updated profile 'test'\n"
}
```

### F04. MCP 단일 주문에서 time_in_force가 빠짐 — P0

**오류 위치 — 보관된 0.8.5 배포 코드**

- [mcp/package/dist/index.js:1724–1778](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/mcp/package/dist/index.js#L1724-L1778) — trade_place_order: 스키마와 요청 본문에서 time_in_force 누락.

- 조건: 단일 주문 handler에 `post_only`, `ioc`, `fok`를 전달한다.
- 실제 동작: 오류 없이 요청 본문에서 해당 필드를 제외한다. 배치 주문은 보존한다. CLI의 미지원 옵션은 오류로 차단한다.
- 근거: 2차 `MCP_single_order_drops_time_in_force`, 배치 대조군; 공식 주문 요청 문서.
- 영향: 주문 조건이 유지되지 않는 요청이 만들어질 수 있다. 2026-09-14 실제 SDK 1.26.0 서버의 stdio 경로에서도 누락을 확인했다. 개별 AI 앱의 입력 검증은 미검증이다.
- 할 일: 도구 스키마→handler→REST 본문까지 지원 조건을 일치시키거나 미지원 조건을 명시적으로 거부한다.
- 완료 기준: 실제 MCP SDK 경로에서도 지원 값은 보존되고 미지원 값은 요청 전 차단된다. 실제 체결 결과를 입증한 것으로 확대하지 않는다.

**2026-09-14 재검사 상세**

- 판정: **검증 강화 — 실제 MCP SDK 1.26.0 + stdio**.
- 재현 입력: initialize → notifications/initialized → tools/list → tools/call 순서로 연결. 각각 post_only, ioc, fok 포함 주문을 전송.
- 실행 경로와 원인: tools/list에 time_in_force가 없지만 서버는 추가 인수를 거부하지 않았다. 실제 tools/call 처리 후 세 요청 모두 조건이 빠진 POST 본문을 만들고 ok=true를 반환했다.
- 해석과 제한: 새 mcp-stdio-results.json이 함수 스텁 검사의 한계를 보완한다. 특정 AI 앱의 별도 검증과 실제 체결은 미검증이다. 같은 SDK 경로의 --read-only는 READ_ONLY_MODE와 요청 0회로 정상 차단됐다.
- 이번 실행 증거: [results-v2.json](./recheck-20260914/results-v2.json)의 `MCP_single_order_drops_time_in_force` 항목.

```json
{
  "test": "MCP_single_order_drops_time_in_force",
  "input": "post_only",
  "sent": {
    "market": "KRW-BTC",
    "side": "bid",
    "order_type": "limit",
    "price": "100000000",
    "volume": "0.001"
  }
}
```

### F05. 배치 주문 전체 실패인데 CLI는 성공 종료·성공 로그 — P1

**오류 위치 — 보관된 0.8.5 배포 코드**

- [cli/package/dist/trade-XUYIIU4K.js:218–228](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/cli/package/dist/trade-XUYIIU4K.js#L218-L228) — cmdBatchPlace: 항목별 실패 판정 없이 결과 출력.
- [cli/package/dist/index.js:99–110](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/cli/package/dist/index.js#L99-L110) — wrapRunnerWithLogger: 정상 반환을 status ok로 기록.

- 실제 동작: 모든 주문 항목이 실패해도 종료 코드 0이며 감사 로그가 성공으로 분류된다.
- 근거: 1차 `all_batch_items_fail`, `failed_batch_audit_log`; 2차 `full_CLI_all_failed_batch`.
- 영향: 셸 스케줄러나 AI가 배치를 성공으로 판단할 수 있다.
- 할 일: 전체 성공·부분 성공·전체 실패를 구분하고 각 주문의 결과를 보존한다. 종료 코드 계약을 문서화한다.
- 완료 기준: 전부 실패는 실패 종료, 부분 성공은 명시된 정책으로 표시. 재시도는 성공 항목까지 다시 보내지 않는다.

**2026-09-14 재검사 상세**

- 판정: **재현 유지 — CLI main 및 로그 wrapper**.
- 재현 입력: 배치 한 건에 insufficient_funds 오류 항목만 들어 있는 모의 응답을 반환.
- 실행 경로와 원인: HTTP 호출 자체의 반환과 개별 주문 성공을 구분하지 않아 결과를 출력한 뒤 종료 코드 0을 유지한다. 예외가 없으므로 wrapper는 status ok를 기록한다.
- 해석과 제한: 이번 입력은 한 항목 전체 실패다. 여러 항목의 혼합 성공·실패와 실제 API 배치 오류 스키마는 별도 회귀 사례로 보강해야 한다.
- 이번 실행 증거: [results-v2.json](./recheck-20260914/results-v2.json)의 `full_CLI_all_failed_batch` 항목.

```json
{
  "test": "full_CLI_all_failed_batch",
  "exitCode": 0,
  "stdout": "{\n  \"batch_orders_response\": [\n    {\n      \"name\": \"insufficient_funds\",\n      \"message\": \"MOCK_ALL_FAILED\"\n    }\n  ]\n}\n"
}
```

### F06. 로그 마스킹이 배열과 일부 키 이름을 놓침 — P1

**오류 위치 — 보관된 0.8.5 배포 코드**

- [cli/package/dist/chunk-Y64A2CTR.js:3199–3219](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/cli/package/dist/chunk-Y64A2CTR.js#L3199-L3219) — redactSensitive: 민감 필드 목록과 배열 재귀 처리 경계.

- 실제 동작: 가짜 비밀값을 배열 또는 `access_key` 형태로 넣으면 남는다. 최상위 일부 secret 필드는 가려진다.
- 근거: 1차 `redaction`.
- 영향: 해당 형태의 민감정보가 입력되면 기록될 수 있다. API가 실제 Secret Key를 반환한다는 증거는 없으며 F01과는 다른 경로다.
- 할 일: 배열·중첩 객체·필드명 변형을 처리하고, 가능하면 기록 허용 필드 목록을 적용한다.
- 완료 기준: 동일 비밀값을 여러 깊이·필드명으로 넣은 테스트에서 전부 제거되고 진단용 비민감 필드는 유지된다.

**2026-09-14 재검사 상세**

- 판정: **재현 유지 — 로그 마스킹 함수**.
- 재현 입력: 최상위 secret 필드, 배열 안 비밀값, access_key 이름을 가진 가짜 데이터를 비교.
- 실행 경로와 원인: 최상위 인식 필드는 가려지지만 배열과 일부 이름에서는 비밀값이 남는다.
- 해석과 제한: 실제 거래소 응답에 Secret Key가 들어 있다는 주장은 하지 않는다. F01은 별도로 실제 CLI 출력까지 확인한 유출 경로다.
- 이번 실행 증거: [results.json](./recheck-20260914/results.json)의 `redaction` 항목.

```json
{
  "test": "redaction",
  "arraySecretUnmasked": true,
  "accessKeyUnmasked": true,
  "topLevelSecretMasked": true
}
```

### F07. 감사 로그 조회 응답을 다시 로그로 기록하여 중첩 증가 — P1

**오류 위치 — 보관된 0.8.5 배포 코드**

- [mcp/package/dist/index.js:1908–1938](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/mcp/package/dist/index.js#L1908-L1938) — readEntries: 로그 전체 읽기·파싱.
- [mcp/package/dist/index.js:1977–1998](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/mcp/package/dist/index.js#L1977-L1998) — system_get_audit_log: 기존 로그 반환.
- [mcp/package/dist/index.js:3308–3316](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/mcp/package/dist/index.js#L3308-L3316) — createServer: 응답 전체를 다시 logTool로 기록.

- 실제 동작: `system_get_audit_log` 응답 전체가 다시 로그에 포함된다. 읽기 전용에서도 발생한다.
- 근거: 2차 기본 limit 20으로 7회 조회한 로그 파일 크기 381→973→2157→4525→9261→18733→37677 bytes; 7번째 응답 73671 bytes.
- 영향: 반복 조회로 디스크·파싱 메모리·AI 입력이 증폭된다. 실제 디스크 고갈/OOM은 시험하지 않았다.
- 할 일: 로그 조회는 메타데이터만 기록하거나 응답 기록에서 제외한다. 읽기 전 파일/행/바이트 제한 및 순환 보관을 적용한다.
- 완료 기준: 반복 조회 증가량이 설정한 상한 내에 있고 과거 로그가 재귀 포함되지 않는다. 작은 limit에 전체 로그를 읽지 않는다.

**2026-09-14 재검사 상세**

- 판정: **재현 유지 — MCP handler와 실제 로그 저장**.
- 재현 입력: 읽기 전용 상태에서 seed 로그를 만든 후 limit=20으로 로그 조회 7회.
- 실행 경로와 원인: 각 조회 결과가 다음 로그에 다시 포함된다. 파일은 381→973→2157→4525→9261→18733→37677 bytes, 마지막 응답은 73671 bytes다.
- 해석과 제한: 1MB 전에 중단하도록 assertion을 두었다. 실제 SDK 통신으로 확대한 검사는 F04에 한정되며 이 로그 사례는 여전히 등록 스텁을 사용한다.
- 이번 실행 증거: [results-v2.json](./recheck-20260914/results-v2.json)의 `MCP_audit_log_recursive_amplification` 항목.

```json
{
  "test": "MCP_audit_log_recursive_amplification",
  "sizes": [
    {
      "iteration": 1,
      "responseBytes": 717,
      "diskBytes": 381
    },
    {
      "iteration": 2,
      "responseBytes": 1617,
      "diskBytes": 973
    },
    {
      "iteration": 3,
      "responseBytes": 3543,
      "diskBytes": 2157
    },
    {
      "iteration": 4,
      "responseBytes": 7647,
      "diskBytes": 4525
    },
    {
      "iteration": 5,
      "responseBytes": 16359,
      "diskBytes": 9261
    },
    {
      "iteration": 6,
      "responseBytes": 34791,
      "diskBytes": 18733
    },
    {
      "iteration": 7,
      "responseBytes": 73671,
      "diskBytes": 37677
    }
  ],
  "readOnlyMode": true
}
```

### F08. 호출 제한을 API 분류 합산 대신 개별 도구로 나눔 — P1

**오류 위치 — 보관된 0.8.5 배포 코드**

- [cli/package/dist/chunk-Y64A2CTR.js:927–970](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/cli/package/dist/chunk-Y64A2CTR.js#L927-L970) — RateLimiter: config.key별 버킷.
- [cli/package/dist/chunk-Y64A2CTR.js:1274–1281](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/cli/package/dist/chunk-Y64A2CTR.js#L1274-L1281) — privateRateLimit: 개별 key로 제한 생성.
- [cli/package/dist/chunk-Y64A2CTR.js:1665–1665](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/cli/package/dist/chunk-Y64A2CTR.js#L1665) — account_get_assets의 독립 key.
- [cli/package/dist/chunk-Y64A2CTR.js:1691–1691](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/cli/package/dist/chunk-Y64A2CTR.js#L1691) — account_get_order_chance의 독립 key.

- 실제 동작: 고정 시각에서 assets 100회 + order chance 100회가 각각 버킷을 통과하여 총 200회가 모의 fetch에 도달했다.
- 계약: 조사 당시 공식 문서는 IP·분류별 제한, Private 기타 초당 140회를 명시했다. 향후 변경 여부 재확인 필요.
- 영향: 툴킷의 제한기를 통과해도 거래소 제한에 걸릴 수 있다. 여러 프로세스·클라이언트 사이 상태 공유도 부족하다.
- 할 일: API 분류별 공유 제한기와 같은 외부 IP를 쓰는 작업자 간 예산을 설계한다. 읽기 재시도와 쓰기 결과 불명 처리를 구분한다.
- 완료 기준: 모의 시계로 합산 한도 검증, 다중 작업자 공유 검증, 429 처리 검증. 실서버 부하 없이 수행한다.

**2026-09-14 재검사 상세**

- 판정: **재현 유지 — 실제 제한기·모의 시계**.
- 재현 입력: Date.now를 고정하고 account_get_assets 100회와 account_get_order_chance 100회 호출.
- 실행 경로와 원인: 분류 공유가 아니라 서로 다른 key의 버킷에서 토큰을 차감하여 같은 시각에 모의 fetch 200회가 통과한다.
- 해석과 제한: 공식 문서에서 IP·분류별 합산 및 Private 기타 140회를 다시 확인했다. HTTP 요청은 실제 거래소로 전송하지 않았고 서버의 구체 차단 시점은 미검증이다.
- 이번 실행 증거: [results-v2.json](./recheck-20260914/results-v2.json)의 `private_other_rate_limit_not_aggregated` 항목.

```json
{
  "test": "private_other_rate_limit_not_aggregated",
  "sameTimestampCalls": 200,
  "officialClassLimit": 140,
  "buckets": [
    "account_get_assets",
    "account_get_order_chance"
  ]
}
```

### F09. 인증 진단 실패도 종료 코드 0 — P1

**오류 위치 — 보관된 0.8.5 배포 코드**

- [cli/package/dist/system-7NJPR4AY.js:32–37](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/cli/package/dist/system-7NJPR4AY.js#L32-L37) — cmdDiagnose: checks 실패를 종료 코드에 반영하지 않음.

- 실제 동작: 인증 거절을 모의 응답으로 주면 `Auth Validity fail`은 표시되지만 종료 코드는 0이다.
- 근거: 2차 진단 CLI 테스트.
- 영향: 종료 코드만 검사하는 사전 점검이 통과할 수 있다. JSON checks를 읽으면 실패는 확인된다.
- 할 일: 필수 진단 실패를 실패 종료로 연결하고 우리 자동화도 구조화된 검사 결과를 확인한다.
- 완료 기준: 필수 검사 실패 시 다음 거래 단계가 실행되지 않는다. 선택적 경고와 필수 실패를 구분한다.

**2026-09-14 재검사 상세**

- 판정: **검증 강화 — HTTP 401 모의 응답**.
- 재현 입력: 기존 검사는 오류 본문과 HTTP 200의 조합이었다. 이번에는 invalid_access_key에 HTTP 401을 반환하고 Auth Validity 자체가 fail인지 확인.
- 실행 경로와 원인: Auth Validity가 실패해도 cmdDiagnose는 결과 출력만 하므로 종료 코드 0을 유지한다. 선택 항목 TOML 실패만으로 판정하지 않도록 assertion도 강화했다.
- 해석과 제한: 정확한 HTTP 401 추가 결과는 http401-results.json에 있다. 실제 계정 인증을 시도한 것은 아니다.
- 이번 실행 증거: [http401-results.json](./recheck-20260914/http401-results.json)의 `diagnose_failed_auth_exit_zero` 항목.

```json
{
  "test": "diagnose_failed_auth_exit_zero",
  "exitCode": 0,
  "checks": [
    {
      "name": "API Reachability",
      "status": "pass",
      "message": "https://api.bithumb.com reachable (HTTP 200)"
    },
    {
      "name": "Authentication",
      "status": "pass",
      "message": "API keys configured (BITHUMB_ACCESS_KEY/BITHUMB_SECRET_KEY env vars or config.toml profile)"
    },
    {
      "name": "TOML Config",
      "status": "fail",
      "message": "Not found: /private/var/folders/2y/j1pg5hzj125cqnyp0c_p42z40000gn/T/bithumb-recheck-frekeyat/fixture-v2-NgyJNF/.bithumb/config.toml (optional — run 'bithumb config init' to create)"
    },
    {
      "name": "Enabled Modules",
      "status": "pass",
      "message": "Active: market, account, trade, twap, withdraw, deposit, system"
    },
    {
      "name": "Auth Validity",
      "status": "fail",
      "message": "API key rejected by server (invalid_access_key: MOCK authentication rejection). Check your access_key and secret_key."
    }
  ]
}
```

### F10. 출금 동의 오류의 consent_url이 사라짐 — P1

**오류 위치 — 보관된 0.8.5 배포 코드**

- [cli/package/dist/chunk-Y64A2CTR.js:1176–1200](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/cli/package/dist/chunk-Y64A2CTR.js#L1176-L1200) — BithumbRestClient: error.name/message만 추출하여 예외로 변환.

- 계약: 공식 출금 문서의 422 `travel_rule_consent_required`는 `consent_url`로 접속해 동의를 완료하도록 안내한다.
- 실제 동작: 오류 변환이 이름·메시지 위주로 필드를 추려 URL을 버린다.
- 근거: 3차 `withdraw_consent_url_discarded`. 정확한 서버 필드 위치를 단정하지 않기 위해 모의 응답의 최상위와 error 안에 모두 URL을 넣었다.
- 한계: 공식 계약 기반 모의 테스트이며 실제 출금 응답 수집은 하지 않았다.
- 할 일: 안전한 구조화 오류 필드와 사용자 조치 상태를 보존한다. 동의 필요 상태는 자동 재시도 대신 사용자 조치 대기로 전환한다.
- 완료 기준: 문서의 실제 응답 스키마를 추가 확인하고 URL이 호출자에게 전달된다. 무관한 민감정보를 통째로 노출하지 않는다.

**2026-09-14 재검사 상세**

- 판정: **재현 유지 — 공식 계약 기반 모의 422**.
- 재현 입력: travel_rule_consent_required와 가짜 consent_url을 최상위·error 내부 양쪽에 넣은 422 응답 사용.
- 실행 경로와 원인: 예외 변환 후 name/message/code/endpoint만 남고 URL은 없다. 동의가 필요한 상태는 전달되지만 다음 조치 정보가 손실된다.
- 해석과 제한: 문서의 동의 안내는 재확인했다. 실제 서버가 URL을 배치하는 정확한 위치와 실출금 응답은 미검증이다.
- 이번 실행 증거: [results-v3.json](./recheck-20260914/results-v3.json)의 `withdraw_consent_url_discarded` 항목.

```json
{
  "test": "withdraw_consent_url_discarded",
  "responseCarriedURL": true,
  "errorCarriedURL": false,
  "error": {
    "name": "BithumbApiError",
    "message": "travel_rule_consent_required: MOCK consent required",
    "properties": {
      "message": "travel_rule_consent_required: MOCK consent required",
      "type": "BithumbApiError",
      "code": "travel_rule_consent_required",
      "endpoint": "POST /v1/withdraws/coin",
      "name": "BithumbApiError"
    }
  }
}
```

### F11. 감사 로그 저장 실패를 조용히 무시함 — P1

**오류 위치 — 보관된 0.8.5 배포 코드**

- [cli/package/dist/chunk-Y64A2CTR.js:3221–3242](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/cli/package/dist/chunk-Y64A2CTR.js#L3221-L3242) — TradeLogger: 로그 디렉터리 생성 오류 무시.
- [cli/package/dist/chunk-Y64A2CTR.js:3276–3283](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/cli/package/dist/chunk-Y64A2CTR.js#L3276-L3283) — TradeLogger.log: appendFileSync 오류 무시.

- 실제 동작: 디렉터리로 사용할 수 없는 로그 경로에서도 로그 미생성, 예외 없음, stderr 없음.
- 근거: 3차 `audit_storage_failure_silent`; TradeLogger의 catch 처리.
- 영향: 기록이 남는다고 믿는 상태에서 장애 추적 자료가 사라질 수 있다.
- 할 일: 로그 상태를 진단·경고로 노출한다. 우리 서비스에서 감사 기록 실패 시 신규 쓰기를 중단할지 정책을 정한다.
- 완료 기준: 저장 실패가 탐지되며 정해진 중단/경고 정책이 작동하고 복구 후 기록이 재개된다.

**2026-09-14 재검사 상세**

- 판정: **재현 유지 — 실제 TradeLogger**.
- 재현 입력: 로그 디렉터리 위치에 일반 파일을 만들어 디렉터리 생성과 append가 실패하게 구성.
- 실행 경로와 원인: 파일 생성 실패가 catch에서 무시되어 logWritten=false, errorThrown=false, stderr 빈 문자열이 된다.
- 해석과 제한: 실제 디스크를 채우거나 시스템 권한을 바꾸지 않았다. 이 검사에서 확인한 것은 실패 미통지이며 거래 중단 정책의 존재를 시험한 것은 아니다.
- 이번 실행 증거: [results-v3.json](./recheck-20260914/results-v3.json)의 `audit_storage_failure_silent` 항목.

```json
{
  "test": "audit_storage_failure_silent",
  "logWritten": false,
  "errorThrown": false,
  "stderr": ""
}
```

## 4. 조건부 위험과 설계 경계

다음은 확인된 코드 동작과 조건부 위험이다. 일괄적으로 보안 우회 취약점이라고 부르지 않는다.

### C01. 주문 결과 불명 상태에 일반적인 재시도 안내 — P0 보완

**오류 위치 — 보관된 0.8.5 배포 코드**

- [cli/package/dist/chunk-Y64A2CTR.js:918–925](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/cli/package/dist/chunk-Y64A2CTR.js#L918-L925) — NetworkError: 일반 재시도 제안.
- [cli/package/dist/chunk-Y64A2CTR.js:1141–1159](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/cli/package/dist/chunk-Y64A2CTR.js#L1141-L1159) — BithumbRestClient: 전송 예외를 NetworkError로 변환.

모의 서버가 주문을 수신한 뒤 응답 전달에서 실패하도록 만들면 `NetworkError`와 재시도 안내가 나오며 주문 조회로 결과를 대조하지 않는다. 테스트 코드가 명시적으로 두 번째 호출을 했을 때 모의 주문 2개가 생성됐다. 킷 자체가 자동 재시도했다는 뜻은 아니다.

우리는 주문 의도 ID와 실행 상태를 영속 저장하고, 응답을 못 받은 주문을 `UNKNOWN`으로 보관해야 한다. 재전송 전에 거래소 조회와 대조한다. 최신 API의 사용자 주문 ID·중복 방지 보장 범위를 먼저 확인한다. 해당 기능이 없으면 완전한 exactly-once 실행을 약속하지 않는다. CLI 실패 후 MCP fallback도 동일한 중복 방지 정책을 적용한다.

**2026-09-14 재검사 상세**

- 판정: **조건부 위험 유지**.
- 재현 입력: 첫 모의 POST는 접수 건수를 증가시킨 뒤 TimeoutError 발생. harness가 같은 주문을 명시적으로 한 번 더 실행.
- 실행 경로와 원인: 모의 접수 2건, client_order_id 없는 요청 2건. 킷 자체의 자동 재시도는 없다.
- 해석과 제한: 공식 주문 문서에 client_order_id가 실제로 존재한다. 문제는 기능 자체의 부재가 아니라 이 경로에서 ID·조회·대조가 자동 적용되지 않는다는 점이다. 서버의 ID 중복 처리 보장은 추가 확인한다.
- 이번 실행 증거: [results-v2.json](./recheck-20260914/results-v2.json)의 `ambiguous_order_timeout` 항목.

```json
{
  "test": "ambiguous_order_timeout",
  "failure": {
    "name": "NetworkError",
    "message": "Failed to call POST /v2/orders.",
    "suggestion": "Check network connectivity and try again."
  },
  "simulatedAcceptedOrdersAfterExplicitSecondCall": 2,
  "requestsHaveClientId": [
    false,
    false
  ],
  "kitAutomaticallyRetried": false
}
```

### C02. 취소 접수를 취소 완료로 표현 — P1 보완

**오류 위치 — 보관된 0.8.5 배포 코드**

- [cli/package/dist/trade-XUYIIU4K.js:134–152](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/cli/package/dist/trade-XUYIIU4K.js#L134-L152) — cmdCancel: 취소 응답 직후 Order cancelled 출력.

모의 취소 접수 응답만으로 CLI가 `Order cancelled`를 출력하며 후속 주문 조회는 없었다. 공식 문서의 취소 접수와 최종 취소 상태를 구분해야 한다. 실제 서버의 상태 전이 시간은 미검증이다.

우리는 `취소 요청 접수`와 `취소 확인`을 구분하고, 부분 체결·취소 경쟁 상태를 조회로 대조한다. 취소 요청 성공만으로 예약 자산을 해제하거나 대체 주문을 중복 생성하지 않는다.

**2026-09-14 재검사 상세**

- 판정: **조건부 위험 유지**.
- 재현 입력: 취소 응답에 order_id와 created_at만 반환.
- 실행 경로와 원인: DELETE 1회 후 Order cancelled를 출력하고 GET 대조가 없다.
- 해석과 제한: 접수와 최종 취소의 시간차·체결 경쟁은 실서버 미검증이다. 메시지와 후속 확인 절차의 차이로 한정한다.
- 이번 실행 증거: [results-v2.json](./recheck-20260914/results-v2.json)의 `cancel_acceptance_reported_as_cancelled` 항목.

```json
{
  "test": "cancel_acceptance_reported_as_cancelled",
  "stdout": "Order cancelled: MOCK_CANCEL\norder_id: MOCK_CANCEL\ncreated_at: 2026-09-11T00:00:00Z\n",
  "requests": [
    {
      "method": "DELETE",
      "url": "https://api.bithumb.com/v2/order?order_id=MOCK_CANCEL"
    }
  ]
}
```

### C03. CLI 읽기 전용 설정과 MCP 설정은 별개 — P0 설정 통제

**오류 위치 — 보관된 0.8.5 배포 코드**

- [mcp/package/dist/index.js:3380–3389](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/mcp/package/dist/index.js#L3380-L3389) — MCP 시작: ignoreToml true.
- [cli/package/dist/chunk-Y64A2CTR.js:3134–3135](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/cli/package/dist/chunk-Y64A2CTR.js#L3134-L3135) — loadConfig: ignoreToml이면 TOML 생략.

MCP 시작 경로는 TOML을 무시하는 설정을 사용한다. CLI 프로필의 read_only가 자동 상속되지 않는다. MCP에 명시한 읽기 전용 차단은 작동했다. 이를 읽기 전용 우회라고 부르지 않는다.

우리는 진입점마다 실제 적용된 계정·권한·모듈·읽기 전용 상태를 검사하고, 설정 차이를 명확히 보여줘야 한다.

**2026-09-14 재검사 상세**

- 판정: **설정 경계 재확인**.
- 재현 입력: CLI TOML에 read_only=true를 저장한 상태와 ignoreToml=true 로드를 비교.
- 실행 경로와 원인: TOML 생략 경로에서는 readOnly가 false다. 그러나 실제 MCP --read-only는 요청을 정상 차단한다.
- 해석과 제한: 보호 우회로 표현하지 않는다. CLI 설정이 별도 MCP 프로세스에 상속된다고 가정하면 안 되는 문제다.
- 이번 실행 증거: [results.json](./recheck-20260914/results.json)의 `mcp_startup_ignores_toml` 항목.

```json
{
  "test": "mcp_startup_ignores_toml",
  "readOnly": false
}
```

### C04. MD의 승인 지침은 코드의 승인 강제와 다름 — P0 설계

**오류 위치 — 보관된 0.8.5 배포 코드**

- [cli/package/dist/chunk-Y64A2CTR.js:3062–3075](https://github.com/realmi-lab/bithumb-ai-trade-kit-audit/blob/62cba4a15302be83241f5a90f976434e4bebf1ba/bithumb-audit-evidence-20260911/cli/package/dist/chunk-Y64A2CTR.js#L3062-L3075) — createToolRunner: 권한 확인 후 handler 호출; 자체 승인 단계 없음.

핵심 runner의 쓰기 호출은 사용자 확인 단계를 자체 강제하지 않는다. AI 클라이언트가 제공하는 승인 기능까지 없다는 뜻은 아니다.

우리는 AI가 제안한 주문을 별도 실행 정책으로 검증한다. 무인 매매를 허용하려면 사용자가 사전 승인한 종목·금액·빈도·손실 한도·기간을 코드로 제한한다. 매 요청 확인이 필요한 운영 방식과 무인 자동매매 정책을 혼동하지 않는다.

**2026-09-14 재검사 상세**

- 판정: **설계 경계 재확인**.
- 재현 입력: 가짜 client와 쓰기 허용 config로 runner에 주문 요청.
- 실행 경로와 원인: runner는 사용자 질문 없이 모의 POST를 호출한다.
- 해석과 제한: runner가 강제하지 않는다는 범위다. AI 앱의 승인 UI 존재 여부를 단정하지 않는다. 무인 매매는 사전 승인된 범위를 별도 실행 정책으로 강제해야 한다.
- 이번 실행 증거: [results.json](./recheck-20260914/results.json)의 `no_confirmation_or_preflight_in_runner` 항목.

```json
{
  "test": "no_confirmation_or_preflight_in_runner",
  "mockPosts": 1,
  "clientOrderIdPresent": false
}
```

### C05. 문서 누락·드리프트와 사용 조건 — P2, 추가 확인

**오류 위치:** 정확한 원문 근거를 재확보하기 전이므로 확정 줄 번호를 지정하지 않는다. F01~F11처럼 재현된 코드 결함으로 분류하지 않는다.

이전 조사에서 일부 참조 문서 누락 및 배치 개수 안내 차이(20/30)가 관찰됐지만 이 문서의 확정 결함 목록에는 넣지 않았다. 정확한 문서 경로·당시 본문·API 계약을 다시 확보한 뒤 보고한다. 구형 `/v1/orders` 및 uuid/uuids를 쓴다는 이유만으로 오류라 판정하지 않는다. 최신 문서에 유지된 계약도 있다.

이전 검토에서 MIT LICENSE와 상업적 사용 관련 DISCLAIMER 문구의 관계가 검토 대상으로 남았다. 서비스 공개 전에 해당 버전의 원문을 다시 읽고 적용 범위를 확인한다. 여기서 법적 허용/금지를 확정하지 않는다.

## 5. 이상이 없었던 대조 검사

- 명시적 read-only 차단은 작동했다.
- 마법사에 안내된 `y` 입력은 읽기 전용을 켰다.
- MCP 배치 주문의 time_in_force는 보존됐다.
- CLI의 미지원 time-in-force 옵션은 거부됐다.
- 출금 수량 `0.123456789012345678`과 보조 주소/태그 `000123`은 문자열로 보존됐다.
- personal 수취인 필수 이름 누락은 요청 전에 차단됐다.

정상 대조군도 유지해야 한다. 보완 때문에 정상 주문·조회가 무조건 실패하는 구현은 통과로 보지 않는다.

## 6. 참고할 공식 문서와 코드

### 공식 자료

| 자료 | 확인할 내용 |
| --- | --- |
| [GitHub](https://github.com/bithumb-official/bithumb-ai-trade-kit) | README, 스킬, 소스, 테스트, 이슈, 릴리스, LICENSE, DISCLAIMER |
| [고정 커밋](https://github.com/bithumb-official/bithumb-ai-trade-kit/tree/2b6304261c81f48256e63b0588db2ca1c44df52f) | 조사 당시 소스 기준점 |
| [거래 스킬](https://github.com/bithumb-official/bithumb-ai-trade-kit/blob/2b6304261c81f48256e63b0588db2ca1c44df52f/skills/bithumb-trade/SKILL.md) | 인증 점검, 쓰기 승인, fallback, 취소 확인 지침 |
| [CLI 안내](https://apidocs.bithumb.com/docs/cli) | 프로필, 설정, 로그, 명령 사용 계약 |
| [MCP 안내](https://apidocs.bithumb.com/docs/mcp) | 실행 옵션, 읽기 전용, 모듈과 도구 노출 |
| [주문 요청](https://apidocs.bithumb.com/reference/주문-요청) | 필드, 주문 유형, time_in_force, 오류, 사용자 주문 식별 지원 여부 |
| [API 요청 수 제한](https://apidocs.bithumb.com/docs/api-요청-수-제한-안내) | IP·API 분류별 합산, 429, 정책 변경 |
| [가상 자산 출금 요청](https://apidocs.bithumb.com/reference/가상-자산-출금-요청) | 수취인 정보, 동의 오류, consent_url, 필수 필드 |
| [출금 리스트](https://apidocs.bithumb.com/reference/출금-리스트-조회) | 상태·페이지·필터 계약 |
| [입금 리스트](https://apidocs.bithumb.com/reference/입금-리스트-조회) | 상태·페이지·필터 계약 |
| [원화 입금 리스트](https://apidocs.bithumb.com/reference/원화-입금-리스트-조회) | 원화 입금 상태·필드 |
| [API 키 리스트](https://apidocs.bithumb.com/reference/api-키-리스트-조회) | 키 관련 응답 범위; Secret Key 재조회 불가 안내 |
| [CLI latest 메타데이터](https://registry.npmjs.org/@bithumb-official/bithumb-cli/latest) | 버전, tarball, 무결성 |
| [MCP latest 메타데이터](https://registry.npmjs.org/@bithumb-official/bithumb-mcp/latest) | 버전, tarball, 무결성 |

문서 링크는 갱신·이동될 수 있다. 재검사 때 접근 일시, 원문 스냅샷, 응답 스키마를 보관한다. 주문 조회·취소 접수·배치 주문·WebSocket·인증 문서는 공식 문서 내 탐색으로 정확한 현재 경로를 추가한다.

### 이번 배포본에서 볼 위치

공통 경로: `bithumb-audit-evidence-20260911/`

| 파일 | 찾을 함수/내용 |
| --- | --- |
| `cli/package/dist/chunk-Y64A2CTR.js` | loadConfig, readFullConfig, BithumbRestClient, RateLimiter, createToolRunner, TradeLogger |
| `cli/package/dist/index.js` | CLI main, 오류 출력·종료 코드 |
| `cli/package/dist/config-FAPUDUEP.js` | runProfileWizard, read_only 입력 처리 |
| `cli/package/dist/trade-XUYIIU4K.js` | 배치 결과, 취소 출력 |
| `cli/package/dist/system-7NJPR4AY.js` | cmdDiagnose |
| `cli/package/dist/withdraw-I3O2NAO6.js` | 출금 입력 처리 |
| `mcp/package/dist/index.js` | registerTradeTools, registerAuditTools, readEntries, createServer, ignoreToml |

번들 파일명은 버전마다 달라진다. 위 파일명을 최신 버전에 그대로 가정하지 말고 함수·기능으로 다시 찾는다.

## 7. 로컬 재현 방법

### 기존 증거 보존 후 별도 복사본에서 실행

아래 명령은 증거 폴더 전체를 새 임시 디렉터리에 복사한다. 원본 결과 JSON을 덮어쓰지 않는다. Node.js가 필요하며 패키지 설치는 필요 없다.

```sh
AUDIT_RUN_DIR="$(mktemp -d -t bithumb-audit-rerun)"
cp -R '/Users/apple/Documents/ChatGPT/개인사이트/bithumb-audit-evidence-20260911/.' "$AUDIT_RUN_DIR/"
cd "$AUDIT_RUN_DIR"
node audit.mjs
node audit-v2.mjs
node audit-v3.mjs
```

이 Mac에서 node가 PATH에 없으면 각 `node` 대신 다음 실행 파일을 사용한다.

```text
/Users/apple/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
```

- 스크립트는 프로세스 내부 os.homedir를 fixture로 대체하고 BITHUMB_* 환경변수를 가짜 값으로 바꾼다. 사용자의 실제 설정을 검사하는 도구가 아니다.
- fetch는 모의 함수로 교체한다. 원래 CLI 명령을 별도로 실계정에서 실행하는 절차가 아니다.
- 기존 스크립트는 **결함이 존재함을 확인하는 재현 코드**다. 수정 후 assertion이 실패한다고 수정이 잘못됐다고 판단하지 않는다. 수정 검증용 기대값은 별도 회귀 테스트로 바꾼다.
- MCP는 실제 SDK 연결 테스트가 아니라 함수 수준 검증이다. SDK·클라이언트 통합 검증을 별도로 추가해야 한다.
- 새 버전은 외부 네트워크 차단이 유지되는지부터 확인한다. fetch 이외 HTTP 클라이언트·소켓이 추가됐으면 동일 harness만으로 격리가 보장되지 않는다.

### 버전 확인과 재현 기록

1. npm latest, GitHub HEAD, 배포 버전·무결성을 다시 확인한다.
2. tarball을 설치 스크립트 실행 없이 내려받아 압축 해제한다.
3. 배포 코드와 해당 소스의 매핑을 확인한다. 소스만 고쳐지고 npm은 미배포인 경우를 구분한다.
4. 패키지 버전, SHA-256, Node 버전, 실행 명령, 실행 시간과 모의 응답을 기록한다.
5. 문제가 발생하는 최소 입력과 정상 대조 입력을 함께 실행한다.
6. CLI/MCP/REST 본문/출력/로그의 어느 단계에서 차이가 생겼는지 적는다.
7. 실제 서버 미검증 범위와 수정 여부를 명시한다.

## 8. 앞으로 허점을 찾는 방법

### 8.1 계약을 표로 만든 뒤 실제 요청과 비교

각 도구에 대해 다음 항목을 수집한다.

`도구명 → 공식 endpoint → 필수/선택 필드 → 타입/단위 → 도구 스키마 → handler → 실제 요청 본문 → 응답 변환 → 로그 → 오류/종료 코드`

문서에 있는 필드가 어느 단계에서 누락되는지, 지원하지 않는 값을 조용히 받아들이는지, 결과가 성공으로 잘못 분류되는지를 비교한다. 문서의 예제만 복사하지 말고 전체 스키마와 오류 표를 읽는다.

### 8.2 설정·권한 경계 검사

- 없는 프로필, 불완전한 키, 빈 값, 환경변수와 TOML 충돌, CLI 옵션 우선순위.
- CLI와 MCP 각각의 read-only 및 모듈 제한.
- 조회 전용 키로 쓰기 도구가 노출되는지와 실제 차단 위치.
- 미등록 도구·알 수 없는 인수·타입 불일치가 명시적으로 거부되는지.
- 승인한 주문 내용이 실행 직전에 변경되어도 탐지하는지.

### 8.3 장애를 단계별로 주입

- 전송 전 실패 / 서버 접수 후 응답 유실 / 응답 파싱 실패를 구분한다.
- 401, 403, 429, 5xx, 잘못된 JSON, 빈 응답, 부분 성공을 모의한다.
- 시간 초과, 재시작, 이중 실행, CLI→MCP fallback을 조합한다.
- 로그 파일 쓰기 실패, 손상된 로그, 긴 응답, 반복 조회를 작은 상한 안에서 시험한다.
- 재시도 횟수뿐 아니라 실제로 생성된 요청·모의 주문 수를 센다.

### 8.4 거래 상태와 수치 경계 검사

- 부분 체결 후 취소, 취소 접수 중 추가 체결, 프로세스 재시작 뒤 주문 복구.
- 최소 주문 금액, 호가 단위, 잔고의 사용 가능/예약 구분, 수수료 반영.
- 소수점·큰 값·0·음수·지수 표기·빈 문자열·잘못된 숫자 검증.
- 거래 중단·상장 폐지·오래된 시세·순서가 바뀐 이벤트 처리.
- WebSocket 재연결, 이벤트 누락·중복과 REST 대조.

위 항목은 앞으로 검사할 목록이며 이미 발견된 결함이 아니다.

### 8.5 민감정보와 AI 입력 경계 검사

- 키·토큰·주소·계정 식별값이 stdout/stderr/예외/로그/MCP 응답에 남는지 확인한다.
- 중첩 객체, 배열, 필드명 변형, TOML 오류 인접 줄을 포함한다.
- 외부 공지·마켓 이름·오류 메시지에 지시문 형태의 텍스트를 넣어도 주문 실행 정책이 바뀌지 않는지 모의 검사한다.
- AI의 자연어 판단과 실제 실행 권한을 분리한다. 모델의 순응만으로 안전성을 판정하지 않는다.

## 9. 우리가 만들어야 할 실행 구조

권장 흐름: `AI/전략의 제안 → 주문 의도 저장 → 결정적인 정책 검사 → 승인된 범위 확인 → 주문 제출 → 결과 대조 → 감사 기록·알림`.

- AI에 거래 키를 직접 다루게 하지 않고 실행 서비스에서 사용한다.
- API 키는 서비스 역할에 필요한 최소 권한으로 구분한다. 자동매매에 출금이 불필요하면 출금 기능을 연결하지 않는다.
- 읽기 전용 기본값과 계정 선택 오류 시 중단 정책을 적용한다.
- 종목 허용 목록, 주문당/일일 금액, 최대 보유·미체결 노출, 손실 한도, 시세 유효 시간과 중단 스위치를 코드로 검사한다.
- 주문 의도와 거래소 주문 ID, 상태, 시도 이력을 영속 저장한다. 메모리만으로 중복 방지를 구현하지 않는다.
- UNKNOWN 주문은 신규 주문과 구분해 복구한다. 재시작 후 잔고·미체결 주문을 대조하기 전 자동매매를 재개하지 않는다.
- 동일 IP/API 분류의 호출 예산을 공유한다.
- 감사 로그는 비밀값 없이 제한된 크기로 기록하고 저장 실패를 감시한다.
- 24시간 운영에는 프로세스 감독, 상태 점검, 시간 동기화, 장애 알림, 복구 절차가 필요하다.

이 구조는 제안이며 현재 구현됐다는 뜻이 아니다. 구체 한도는 서비스 요구와 사용자의 승인 범위를 정한 뒤 적용한다.

## 10. 실행할 작업과 완료 조건

### 단계 A — 증거와 기준 고정

- [x] 1~3차 재현 코드·결과·배포 패키지를 임시 경로 밖에 보관.
- [x] 확인 사실, 조건부 위험, 추가 검사 항목을 구분.
- [ ] 최신 문서 원문·스키마를 접근 시각과 함께 스냅샷으로 보관.
- [x] 실제 MCP SDK 1.26.0 stdio 서버에서 F04의 입력 허용·차단 경로 확인.
- [ ] 실제 사용할 AI 앱의 추가 입력 검증 확인.
- [ ] C05 문서 누락·배치 개수·사용 조건의 원문 근거 재확보.

완료 조건: 제3자가 동일 버전·모의 입력으로 결과를 재현하고 한계를 이해할 수 있다.

### 단계 B — 실거래 연결 전 P0 보호

- [ ] F01 비밀키 오류 출력 차단.
- [ ] F02 명시 프로필 오류 시 중단.
- [ ] F03 읽기 전용 입력 검증.
- [ ] F04 주문 조건 보존 또는 명시적 거부.
- [ ] C01 결과 불명 주문 저장·대조와 중복 방지.
- [ ] C03/C04 권한·승인 범위를 실행 계층에서 강제.

완료 조건: 각 항목의 실패 시 요청 0회 또는 명시적 UNKNOWN 상태, 정상 대조군 통과. 실거래는 아직 필요하지 않다.

### 단계 C — 운영 전 P1 신뢰성

- [ ] F05/F09 실패 종료 코드와 구조화 결과 정리.
- [ ] F06/F07/F11 로그 마스킹·중첩 방지·저장 실패 감지.
- [ ] F08 합산 호출 제한 및 429 처리.
- [ ] F10 동의 필요 오류 전달 및 재시도 중단.
- [ ] C02 취소 접수와 최종 상태 구분.
- [ ] 부분 체결·재시작·중복 작업자·시세 지연 시나리오 검증.

완료 조건: 오류가 성공으로 기록되지 않고, 재실행이 중복 쓰기를 만들지 않도록 처리되며, 자원 사용 상한이 유지된다.

### 단계 D — 수정 검증·공개·운영

- [ ] 수정 대상 checkout과 파일을 정한 뒤 해당 AGENTS.md 확인.
- [ ] 소스 수정 후 새 빌드와 실제 배포 산출물 양쪽에서 회귀 검사.
- [ ] MCP SDK와 실제 사용할 클라이언트 통합 검사.
- [ ] upstream 제보용 최소 재현·영향·수정 제안 정리. 외부 전송은 별도 명시적 요청이 있을 때 수행.
- [ ] 실계정 검증이 필요하면 계정·권한·종목·한도·중단 조건을 별도 확정. 이 문서는 실거래 실행 승인이 아니다.
- [ ] 운영 배포 시 배포 버전 확인, 복구·중단 절차와 제한된 관찰 계획 수립.

## 11. 발견 사항 기록 양식

```markdown
### ID / 제목
- 상태: 후보 / 정적 확인 / 모의 재현 / 통합 재현 / 수정됨 / 배포 확인
- 대상 버전·커밋·파일 해시:
- 공식 계약 URL·확인 일시:
- 코드 위치·함수:
- 기대 동작:
- 실제 동작:
- 필요한 전제:
- 최소 재현 입력·모의 응답:
- 요청 횟수·출력·로그·종료 코드:
- 정상 대조군:
- 영향과 미검증 범위:
- 수정 제안:
- 수정 완료 기준:
- 증거 파일:
```

## 12. 다음 작업자에게 전달할 요청문

> 이 문서와 bithumb-audit-evidence-20260911의 결과·스크립트를 읽고 시작한다. 현재 upstream/npm 버전을 다시 확인하며, 기존 재현 증거를 덮어쓰지 않는다. 실제 키·주문·출금 없이 공식 API 계약과 배포 코드 차이를 검사한다. 우선 실제 MCP SDK 경로의 주문 조건 검증과 결과 불명 주문의 재시작/중복 실행 시나리오를 보강한다. 이미 확인한 F01~F11과 C01~C05는 중복 보고하지 말고 추가 증거 또는 수정 상태를 갱신한다. 새 발견은 정상 대조군과 재현 결과를 함께 기록하고, 정적 추정·모의 재현·실서버 검증을 구분한다. 소스 수정이나 운영 반영을 했다면 각각의 범위를 별도로 보고한다.
