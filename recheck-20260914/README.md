# 2026-09-14 재검사

주 문서의 F01~F11, C01~C04를 다시 검사한 결과다. C05의 문서 누락·사용 조건과 미래 검사 목록 전체를 완료한 것은 아니다. 제품 코드는 수정하지 않았다.

## 실행한 검사

1. `audit.mjs`, `audit-v2.mjs`, `audit-v3.mjs`를 기존 증거의 새 임시 복사본에서 실행. 모두 종료 코드 0. 각 결과 JSON은 이번 실행 결과다. assertion은 결함 존재를 확인하도록 작성되어 있다.
2. npm latest CLI/MCP 0.8.5 및 GitHub main SHA를 확인. tarball SHA-512 무결성과 압축 내 모든 파일을 보관된 패키지와 대조해 일치 확인. `package-comparison.json` 참조.
3. MCP SDK 1.26.0을 별도 임시 폴더에 `--ignore-scripts`로 설치하고 원래 MCP 패키지를 복사하여 stdio 통신 검사. tools/list, tools/call 모두 실제 SDK 처리. fetch만 모의 응답으로 바꿨으며 요청 본문만 기록하고 인증 헤더는 저장하지 않았다.
4. F09 검사를 보강해 HTTP 401과 `Auth Validity`의 fail을 명시적으로 검증. `http401-results.json` 참조. 기존 스크립트는 HTTP 200에 오류 본문을 반환하던 한계가 있었다.

## 실제 MCP 검사에서 확인한 것

- SDK 서버가 tools/list에 time_in_force를 노출하지 않는다.
- 직접 보낸 tools/call의 post_only/ioc/fok를 추가 인수라는 이유로 거부하지 않는다.
- 요청 본문에서 조건은 빠지지만 tools/call 응답은 ok=true다.
- 동일 경로에서 --read-only는 READ_ONLY_MODE 오류, 모의 요청 0회로 차단한다.
- 특정 AI 앱이 미등록 인수를 보내지 않거나 별도로 차단할 가능성은 남는다. 실제 체결과 거래소 응답은 시험하지 않았다.

초기 harness는 단일 번들 파일만 복사해 상대경로 ../package.json을 찾지 못했다. 이를 제품 결함으로 세지 않았다. 패키지 전체 구조를 보존하도록 harness를 수정한 뒤 최종 검사가 통과했다.

## 재실행

저장소 루트에서 실행한다. Node/npm이 필요하다. npm 설치는 SDK 의존성 다운로드만 하며 거래소에 요청하지 않는다. 정확한 의존성 재현을 위해 저장한 lockfile을 사용한다.

```sh
TASK_SDK_DIR="$(mktemp -d -t bithumb-sdk-check)"
cp recheck-20260914/sdk-package-lock.json "$TASK_SDK_DIR/package-lock.json"
printf '{"private":true,"dependencies":{"@modelcontextprotocol/sdk":"^1.26.0"}}\n' > "$TASK_SDK_DIR/package.json"
npm ci --prefix "$TASK_SDK_DIR" --ignore-scripts --no-audit --no-fund
node recheck-20260914/mcp-stdio-recheck.mjs "$TASK_SDK_DIR"
```

위 명령은 `mcp-stdio-results.json`을 갱신한다. 기존 증거를 보존하려면 저장소 전체의 임시 복사본에서 실행한다. 현재 모의 차단은 fetch 대상이며 향후 코드가 다른 네트워크 경로를 사용하면 격리 방식을 먼저 보완한다.

HTTP 401 보강 검사는 기존 증거 폴더를 임시 복사한 뒤 `audit-v2-http401.mjs`를 그 폴더에 복사하고 해당 폴더를 현재 디렉터리로 하여 Node로 실행한다. 결과 파일명은 `results-v2.json`이다. 이번에 보관한 `http401-results.json`은 그중 인증 사례만 추린 결과다.

이 Mac에서 node/npm을 찾지 못하면 다음 경로를 PATH 앞에 추가한다.

```sh
export PATH="/Users/apple/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
```

## 공식 계약 재확인

- [주문 요청](https://apidocs.bithumb.com/reference/주문-요청): time_in_force 값과 limit/best별 지원 조건, client_order_id 존재 확인. ID가 존재한다는 사실만으로 서버의 모든 중복 방지 보장을 추정하지 않는다.
- [출금 요청](https://apidocs.bithumb.com/reference/가상-자산-출금-요청): travel_rule_consent_required의 사용자 동의 절차 확인. 모의 URL 필드의 실제 서버 배치는 미확인.
- [요청 제한](https://apidocs.bithumb.com/docs/api-요청-수-제한-안내): IP·API 분류별 합산 기준과 Private 기타 140회 확인. 이는 개별 도구마다 140회라는 뜻이 아니다.

웹 읽기는 성공했지만 직접 `.md` 다운로드는 HTTP 403이었다. `verification.json`에 실패를 보존했다. 전체 문서 스냅샷이 있다고 주장하지 않는다.

## 파일 설명

- `verification.json`: 실제 확인 시각·버전·실행 종료 코드. 임시 경로는 당시 실행 위치다.
- `cli-metadata.json`, `mcp-metadata.json`, `github-metadata.json`: 공개 배포 및 소스 메타데이터.
- `package-comparison.json`: 새 tarball과 기존 증거의 전체 파일 비교 결과.
- `results*.json`: 기존 3개 스크립트의 재실행 결과.
- `mcp-stdio-recheck.mjs`, `mcp-stdio-results.json`: 실제 SDK stdio 검증 코드·결과.
- `sdk-package-lock.json`: 실제 설치한 SDK 및 전이 의존성 고정 정보.
- `audit-v2-http401.mjs`, `http401-results.json`: 인증 실패 판정 보강 코드·결과.
- `*.stderr.txt`: 기존 스크립트의 표준 오류 출력. 빈 파일은 오류 출력이 없었다는 뜻이다.
