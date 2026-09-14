# 빗썸 공식 MD 지침 자체의 오류 검토

검사일: 2026-09-14

## 이번 검사의 대상과 이전 검사 정정

**대상은 빗썸 공식 SKILL.md와 references/*.md에 적힌 안내다.** AI가 문서를 그대로 따라갈 때 명령이 실패하거나 잘못된 확인을 하게 되는지를 검사했다. 임의 설정 오타를 만들거나 SDK 내부 구현의 결함을 찾아 MD 오류라고 분류하지 않는다.

이전 `빗썸-AI-트레이드킷-검증과-개선계획.md`의 F01~F11은 주로 배포 코드 검사였다. 특히 `read_only=tru`는 검사자가 넣은 재현 입력이지 빗썸 MD 원문에 있는 값이 아니다. 그 결과는 별도 참고 기록이며 **공식 MD 오류 목록으로 사용하지 않는다.** 이번 문서가 사용자가 요청한 범위의 주 문서다.

공식 기준 커밋: `2b6304261c81f48256e63b0588db2ca1c44df52f`. 아래 오류 위치는 우리 복사본이 아니라 **빗썸 공식 GitHub의 해당 MD 줄**로 연결된다.

공식 저장소의 MD 23개 목록·내용 해시를 확보하고 상대 파일 링크를 검사했다. 상세 의미 검토는 거래·입금·출금·계정·시스템 스킬과 거래 참조 문서를 중심으로 수행했다. 전체 23개 문서의 모든 지침을 검증했다는 뜻은 아니다.

## 결과 구분

| ID | 내용 | 판정 | 우선순위 |
| --- | --- | --- | --- |
| MD01 | 필수 참조 MD 4개 누락, 깨진 참조 8곳 | 공식 트리와 링크 대조로 확인 | 높음 |
| MD02 | 네트워크를 알아내라는 명령에 필수 네트워크 인수가 없음 | 문서대로 실행 시 CLI가 즉시 실패 | 높음 |
| MD03 | 예제 상태 조합 wait,watch가 API 금지 조합 | MD 내부 모순 + API 계약 위반 | 중간 |
| MD04 | 취소·배치 검증을 미체결 목록만으로 수행 | API 상태 필터와 검증 목적 불일치 | 높음 |
| MD05 | 출금 검증에 해당 출금 ID 대신 최신 1건 조회 | 동시 작업 시 다른 건을 볼 수 있는 지침 공백 | 높음 |
| MD06 | 동일하다고 안내한 출금 체크리스트 내용이 다름 | MD 간 불일치 확인 | 중간 |
| MD07 | 배치 생성 최대 20건 안내와 API 최대 30건 차이 | 문서 범위/버전 차이; 보수적 제한일 가능성 | 낮음 |
| R01 | CLI 실패 시 MCP 전환의 실패 종류 구분이 없음 | 조건부 위험, 다른 재시도 금지 지침과 함께 해석 필요 | 높음 |

## MD01. AI가 필수로 열어야 하는 참조 파일이 없다

### 공식 오류 위치

- [출금 SKILL.md 40줄](https://github.com/bithumb-official/bithumb-ai-trade-kit/blob/2b6304261c81f48256e63b0588db2ca1c44df52f/skills/bithumb-withdraw/SKILL.md#L40): 명령별 상세 참조.
- [출금 SKILL.md 73줄](https://github.com/bithumb-official/bithumb-ai-trade-kit/blob/2b6304261c81f48256e63b0588db2ca1c44df52f/skills/bithumb-withdraw/SKILL.md#L73): 출금 종류별 필수 인수 확인 단계.
- [입금 SKILL.md 34줄](https://github.com/bithumb-official/bithumb-ai-trade-kit/blob/2b6304261c81f48256e63b0588db2ca1c44df52f/skills/bithumb-deposit/SKILL.md#L34): 명령별 상세 참조.
- [입금 SKILL.md 46줄](https://github.com/bithumb-official/bithumb-ai-trade-kit/blob/2b6304261c81f48256e63b0588db2ca1c44df52f/skills/bithumb-deposit/SKILL.md#L46): 읽기 전용 gate 참조.

없는 파일:

```text
skills/bithumb-withdraw/references/withdraw-commands.md
skills/bithumb-withdraw/references/withdrawal-type-params.md
skills/bithumb-deposit/references/deposit-commands.md
skills/bithumb-deposit/references/read-only-gate.md
```

검사 방법: 공식 커밋의 전체 Git tree에서 MD 상대경로를 해석해 실제 파일 존재 여부를 대조했다. 위 4개 파일을 향하는 링크가 총 8곳이다. 임시 다운로드 폴더의 누락만으로 판단하지 않고 공식 tree로 확인했다.

AI가 그대로 따라갈 때: 참조 문서를 열 수 없어 전체 파라미터·수취인 유형별 필수 값·입금 gate 상세 규칙을 읽지 못한다. 본문에 일부 요약이 있으므로 안전 지침이 전부 없다는 뜻은 아니다. 다만 필수 참조를 읽었다고 할 수 없다.

수정안: 해당 파일을 제공하거나 실제 존재하는 문서로 연결하고, 필수 표를 참조 파일 또는 본문에 완결되게 제공한다. 파일이 없을 때 AI가 인수를 추정하지 않도록 중단/공식 API 확인 경로를 명시한다.

완료 기준: 저장소 기준 상대 파일 링크 검사 0건. 각 스킬 단독 설치본에서도 참조가 존재한다.

근거: [깨진 링크 전체](./md-review-20260914/missing-links.json), [재검사 스크립트](./md-review-20260914/check-links.py).

## MD02. 네트워크 발견 안내의 명령이 그대로 실행되지 않는다

### 공식 오류 위치

- [입금 SKILL.md 47줄](https://github.com/bithumb-official/bithumb-ai-trade-kit/blob/2b6304261c81f48256e63b0588db2ca1c44df52f/skills/bithumb-deposit/SKILL.md#L47), [56줄](https://github.com/bithumb-official/bithumb-ai-trade-kit/blob/2b6304261c81f48256e63b0588db2ca1c44df52f/skills/bithumb-deposit/SKILL.md#L56), [72줄](https://github.com/bithumb-official/bithumb-ai-trade-kit/blob/2b6304261c81f48256e63b0588db2ca1c44df52f/skills/bithumb-deposit/SKILL.md#L72): net_type을 먼저 알아내는 방법 중 하나로 currency만 넘기는 출금 가능 조회를 안내.
- [출금 SKILL.md 46줄](https://github.com/bithumb-official/bithumb-ai-trade-kit/blob/2b6304261c81f48256e63b0588db2ca1c44df52f/skills/bithumb-withdraw/SKILL.md#L46): `--net-type`을 선택 인수처럼 표시.

MD의 통화 자리만 BTC로 채워 실행한 명령:

```sh
bithumb withdraw chance --currency BTC
```

실제 CLI 0.8.5 출력:

```text
Error: --currency and --net-type required. Example: bithumb withdraw chance --currency BTC --net-type BTC
```

종료 코드 1, 네트워크 요청 0회. 잘못된 입력을 새로 고안한 것이 아니라 **MD가 제시한 명령의 <c>에 정상 통화 코드를 넣은 검사**다. 공식 [출금 가능 정보 API](https://apidocs.bithumb.com/reference/출금-가능-정보)도 currency와 net_type을 모두 필수로 정한다.

영향: net_type을 모르는 사용자에게 net_type이 있어야 실행되는 명령으로 이를 알아내라고 안내하는 순서 문제가 생긴다. 대안으로 함께 적힌 deposit addresses까지 실패한다고 검증한 것은 아니다.

수정안: 이미 확인된 주소·네트워크 자료에서 net_type을 먼저 얻고 해당 값으로 chance를 호출한다. 출금 가능 조회가 네트워크 목록 탐색용이라는 안내는 제거한다. 아직 등록 주소가 없는 최초 사용자에게도 실행 가능한 별도 발견 경로를 공식 계약으로 검증해 제공한다.

완료 기준: 네트워크를 모르는 초기 조건에서 안내대로 시작해 유효한 네트워크를 확인하거나, 정보가 없음을 명시하고 멈춘다. 임의 네트워크 추정은 하지 않는다.

## MD03. 파라미터 표의 wait,watch 예제가 다른 지침과 API에 모순된다

### 공식 오류 위치

- [order-commands.md 152줄](https://github.com/bithumb-official/bithumb-ai-trade-kit/blob/2b6304261c81f48256e63b0588db2ca1c44df52f/skills/bithumb-trade/references/order-commands.md#L152): `--states` 사용 예로 `wait,watch`를 기재.
- 반대 지침: [trade SKILL.md 42줄](https://github.com/bithumb-official/bithumb-ai-trade-kit/blob/2b6304261c81f48256e63b0588db2ca1c44df52f/skills/bithumb-trade/SKILL.md#L42)은 watch를 일반 상태와 섞지 말라고 안내.

표의 예제를 적용한 명령:

```sh
bithumb trade list --states wait,watch
```

실제 CLI가 생성한 모의 요청:

```text
GET /v1/orders?states[]=wait&states[]=watch
```

공식 [주문 리스트 API](https://apidocs.bithumb.com/reference/주문-리스트-조회)는 watch와 wait/done/cancel의 혼합을 금지한다. 따라서 문서 표의 예시가 계약에 맞지 않는다.

검증 한계: 요청 생성은 배포 CLI로 확인했고 금지 조건은 공식 API 문서로 확인했다. 실제 거래소가 반환하는 오류 코드·문구는 호출하지 않았다. 저장된 모의 응답의 `[]`는 실제 서버가 이를 허용했다는 증거가 아니다.

수정안: 예시를 `wait,done,cancel`로 고치고 watch는 별도 조회하도록 표 자체에 적는다.

## MD04. 취소·배치 성공 여부를 wait 목록만으로 확인하라고 한다

### 공식 오류 위치

- [trade SKILL.md 90–94줄](https://github.com/bithumb-official/bithumb-ai-trade-kit/blob/2b6304261c81f48256e63b0588db2ca1c44df52f/skills/bithumb-trade/SKILL.md#L90-L94): 취소 및 배치 후 ID·상태 지정 없는 목록 조회로 검증 안내.
- [batch-commands.md 141줄](https://github.com/bithumb-official/bithumb-ai-trade-kit/blob/2b6304261c81f48256e63b0588db2ca1c44df52f/skills/bithumb-trade/references/batch-commands.md#L141): 배치 작업 후 wait 상태 조회를 실제 상태 확인으로 안내.
- [batch-commands.md 150줄](https://github.com/bithumb-official/bithumb-ai-trade-kit/blob/2b6304261c81f48256e63b0588db2ca1c44df52f/skills/bithumb-trade/references/batch-commands.md#L150): 부분 실패 후 성공한 주문 확인도 wait 목록으로 안내.

문서의 조회 명령은 다음 두 가지다.

```sh
bithumb trade list
bithumb trade list --state wait
```

실제 CLI는 첫 명령에 상태 필터를 추가하지 않고, 두 번째에는 wait만 보낸다. 공식 [주문 리스트 API](https://apidocs.bithumb.com/reference/주문-리스트-조회)의 기본 상태도 wait다.

논리 검증: 주문 A가 체결 완료인 경우, 취소된 경우, 아예 생성되지 않은 경우 모두 wait 목록에서 빠질 수 있다. 따라서 목록에 없다는 사실만으로 성공·실패·취소 완료를 구분할 수 없다. 문서가 지원하는 시장가 주문에도 해당할 수 있으며 신규 주문 유형만의 문제가 아니다. ID 필터가 없으면 다른 주문이 섞이고 페이지 밖 대상도 놓친다.

수정안:

```sh
# 단일 작업: 응답에서 얻은 실제 주문 ID로 확인
bithumb trade get --order-id <확인할-ID>

# 배치 작업: 성공 응답의 ID 집합을 보존해 상태를 함께 확인
bithumb trade list --order-ids <ID1,ID2> --states wait,done,cancel
```

watch는 따로 조회한다. 실패 항목은 원래 배치 응답의 오류를 기준으로 판단하고 목록에서 빠졌다는 이유로 재주문하지 않는다.

한계: 상태별 조회 의미와 요청 본문을 검증했다. 실제 체결·취소를 실행하거나 AI가 이미 오판하는 모습을 관찰한 것은 아니다. MD의 다른 부분에는 ID 조회를 잘 안내하는 내용도 있지만 해당 후속 확인 단계에는 반영되지 않았다.

## MD05. 특정 출금 검증을 최신 1건으로 대신한다

### 공식 오류 위치

- [출금 SKILL.md 76–80줄](https://github.com/bithumb-official/bithumb-ai-trade-kit/blob/2b6304261c81f48256e63b0588db2ca1c44df52f/skills/bithumb-withdraw/SKILL.md#L76-L80).
- [계정 SKILL.md 109줄](https://github.com/bithumb-official/bithumb-ai-trade-kit/blob/2b6304261c81f48256e63b0588db2ca1c44df52f/skills/bithumb-account/SKILL.md#L109)에도 같은 방식이 반복된다.

문서 명령:

```sh
bithumb withdraw list --currency BTC --limit 1
```

실제 생성 요청에는 currency와 limit만 있고 출금 ID는 없다. 공식 [출금 리스트 API](https://apidocs.bithumb.com/reference/출금-리스트-조회)는 최신순이 기본이며 출금 ID 필터도 지원한다.

반례: 확인 대상 출금 A 다음에 같은 통화의 출금 B가 생기면 최신 1건은 B일 수 있다. 테스트에서는 B를 모의 응답으로 넣어 CLI가 이를 그대로 표시함을 확인했다. A 상태를 확인한 것이 아니다.

수정안: 제출 응답의 식별자를 저장하고 해당 ID로 개별 조회한다. 응답이 유실되어 ID가 없다면 결과 불명으로 두고 계정·통화·금액·주소·시각으로 대조하는 별도 절차를 둔다. 최신 1건을 자동으로 해당 작업이라 간주하지 않는다.

한계: 동시 출금은 가능한 조건으로 만든 반례다. 실제 출금 B가 발생했다는 보고가 아니다.

## MD06. 동일한 출금 체크리스트라고 하지만 복사된 내용이 다르다

### 공식 오류 위치

- [계정 SKILL.md 97–112줄](https://github.com/bithumb-official/bithumb-ai-trade-kit/blob/2b6304261c81f48256e63b0588db2ca1c44df52f/skills/bithumb-account/SKILL.md#L97-L112): 전체 사전 점검이라고 소개하고 출금 스킬과 동일하게 유지된다고 설명.
- [출금 SKILL.md 63–78줄](https://github.com/bithumb-official/bithumb-ai-trade-kit/blob/2b6304261c81f48256e63b0588db2ca1c44df52f/skills/bithumb-withdraw/SKILL.md#L63-L78): 실제 전체 점검.

대조 결과:

| 점검 | 출금 SKILL | 계정 Cross-Skill 예제 |
| --- | --- | --- |
| read-only gate | 명시 | 해당 순서표에 없음 |
| 출금 종류 분류 | 별도 단계 | 없음 |
| 외부 출금 exchange_name 확인 | 명시 | 확인 목록에 없음 |
| CODE 수취인 정보 확인 | 명시 | 확인 목록에 없음 |

영향: 계정 문서의 흐름만 완전한 점검이라고 받아들이면 필수 확인 범위가 축소된다. 다만 예제에 출금 스킬 이름이 있으므로 AI가 그 스킬 전체를 다시 읽으면 누락을 보완할 수 있다. 보호를 반드시 우회한다는 주장은 하지 않는다.

수정안: 예제를 전체 점검이라 부르지 말고 공식 단일 체크리스트로 이동하도록 명시하거나, 두 문서를 함께 생성·검사해 동일성을 보장한다.

## MD07. 배치 생성 최대 수량이 최신 API와 다르게 안내된다

### 공식 오류 위치

- [trade SKILL.md 35줄](https://github.com/bithumb-official/bithumb-ai-trade-kit/blob/2b6304261c81f48256e63b0588db2ca1c44df52f/skills/bithumb-trade/SKILL.md#L36).
- [batch-commands.md 13줄](https://github.com/bithumb-official/bithumb-ai-trade-kit/blob/2b6304261c81f48256e63b0588db2ca1c44df52f/skills/bithumb-trade/references/batch-commands.md#L13), [137줄](https://github.com/bithumb-official/bithumb-ai-trade-kit/blob/2b6304261c81f48256e63b0588db2ca1c44df52f/skills/bithumb-trade/references/batch-commands.md#L137).

MD는 생성 최대 20건을 안내하지만 공식 [다건 주문 요청 API](https://apidocs.bithumb.com/reference/다건-주문-요청)는 요청당 최대 30건을 명시한다.

판정: 문서의 지원 범위와 API 한도의 차이는 확인했다. 툴킷이 의도적으로 더 낮은 한도를 두었을 가능성이 있으므로 20건 안내 자체를 위험한 주문 결함이라 부르지 않는다. API 상한과 툴킷 자체 상한을 구분하지 않은 설명 문제다. 21건의 실주문을 보내 검사하지 않았다.

수정안: API는 최대 30건, 해당 툴킷 버전은 최대 몇 건인지 따로 적고 실제 구현·도구 스키마와 맞춘다. 처리량 차이와 불필요한 분할이 주요 영향이며 자금 손실이 재현된 항목은 아니다.

## R01. CLI 실패 뒤 MCP 전환 안내에 결과 불명 상태가 빠져 있다

### 공식 오류 위치

- [trade SKILL.md 12줄](https://github.com/bithumb-official/bithumb-ai-trade-kit/blob/2b6304261c81f48256e63b0588db2ca1c44df52f/skills/bithumb-trade/SKILL.md#L12).
- [입금 SKILL.md 12줄](https://github.com/bithumb-official/bithumb-ai-trade-kit/blob/2b6304261c81f48256e63b0588db2ca1c44df52f/skills/bithumb-deposit/SKILL.md#L12).
- [출금 SKILL.md 14줄](https://github.com/bithumb-official/bithumb-ai-trade-kit/blob/2b6304261c81f48256e63b0588db2ca1c44df52f/skills/bithumb-withdraw/SKILL.md#L14).

문서는 CLI를 우선 사용하되 사용할 수 없거나 실패하면 MCP로 전환할 수 있게 안내한다. 설치되지 않은 CLI와 제출 후 응답이 유실된 쓰기 실패는 다른 상황인데, 이 문단은 둘을 구분하지 않는다.

조건부 위험: 접수 여부가 불명확한 주문·입출금에서 같은 작업을 MCP로 다시 실행하면 이중 제출 가능성이 생긴다. 이미 사용자 승인이 있었더라도 첫 작업이 실행됐는지는 별도로 확인해야 한다.

반대 근거도 함께 반영: 배치와 TWAP 참조 문서는 자동 재시도를 금지하고, 인증 실패도 중단하라고 한다. 따라서 MD 전체가 무조건 재시도를 지시한다고 단정할 수 없다. 핵심은 공통 routing 규칙에 예외 범위를 명확히 적지 않은 것이다.

수정안: 전환 가능 상황을 실행 파일 부재 등 제출 전 실패로 제한하고, 쓰기 결과 불명 상태에서는 어떤 도구로도 재제출하기 전에 해당 작업을 조회·대조하도록 명시한다.

## 확정 오류로 넣지 않은 항목

- [order-commands.md 197줄](https://github.com/bithumb-official/bithumb-ai-trade-kit/blob/2b6304261c81f48256e63b0588db2ca1c44df52f/skills/bithumb-trade/references/order-commands.md#L197)은 동일 client_order_id 재전송 시 기존 주문을 반환한다고 단정한다. 이번에 확인한 단일 주문 API 본문만으로 그 보장까지 입증하지 못했다. 배치 내부 중복이 실패한다는 계약을 단일 주문 재전송과 혼동하여 반증하지도 않는다. 추가 계약 확인 대상으로 둔다.
- 응답의 uuid/order_id와 ord_type/order_type은 v1 조회와 v2 생성에 따라 다를 수 있다. 문서가 이를 일반화한 부분은 endpoint별 응답 스키마를 확보하기 전 확정하지 않는다.
- 호가 표가 오래됐다고 추측만으로 오류 처리하지 않는다. 최신 공식 호가 정책과 자산별 예외 검증이 더 필요하다.
- MD에 없는 `tru` 입력, 로그 마스킹, SDK 구현상 필드 누락은 이번 MD 결함 개수에 넣지 않는다.

## 재검사 방법과 증거

- [공식 MD 목록·커밋·해시](./md-review-20260914/official-md-metadata.json).
- [누락 참조 결과](./md-review-20260914/missing-links.json).
- [문서 명령의 로컬 실행 결과](./md-review-20260914/command-results.json).
- [명령 검사 코드](./md-review-20260914/check-doc-commands.mjs).

저장소 루트에서:

```sh
python3 md-review-20260914/check-links.py
node md-review-20260914/check-doc-commands.mjs
```

첫 검사는 공개 GitHub 문서와 파일 목록을 조회한다. 두 번째는 가짜 자격증명·독립 임시 설정·모의 fetch만 사용한다. 문서의 읽기 명령 5개를 실행하며 GET 이외 요청은 assertion으로 거부한다. 실제 주문·취소·입출금이나 실계정 조회는 수행하지 않는다.

두 번째 검사에서 `[]`와 MOCK 접두어 데이터는 문서의 확인 절차를 검사하기 위한 모의 값이다. 거래소 실제 데이터가 아니며 실제 서버의 성공·오류 응답을 증명하지 않는다. MD02의 인수 누락 오류는 모의 서버 응답이 아니라 실제 CLI가 요청 전에 출력한 오류다.

## 앞으로 수정·검증할 순서

1. 누락 참조 4개 복구 또는 링크 교정.
2. net_type 발견 절차와 잘못된 states 예제 교정.
3. 주문·출금 확인을 실제 작업 ID 기준으로 교정.
4. 중복된 체크리스트를 하나로 통합하고 실패 후 도구 전환 규칙을 명확히 작성.
5. 배치 상한과 endpoint별 응답 필드, client_order_id 재요청 계약을 별도로 확인.
6. 공식 MD의 명령 예제를 모의 환경에서 자동 검사하고 참조 링크 검사를 CI에 추가.

이번 작업은 공식 문서를 수정한 것이 아니라 문제 위치와 교정안을 우리 감사 저장소에 기록한 것이다. upstream 제보·수정 PR은 수행하지 않았다.
