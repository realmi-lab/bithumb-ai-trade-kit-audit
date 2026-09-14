// Run from the audit repository root. Fake credentials and fetch only; no live exchange requests.
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {syncBuiltinESMExports} from 'node:module';import assert from 'node:assert/strict';
const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'bithumb-md-'));os.homedir=()=>fixture;syncBuiltinESMExports();
for(const k of Object.keys(process.env))if(k.startsWith('BITHUMB_'))delete process.env[k];
Object.assign(process.env,{BITHUMB_ACCESS_KEY:'FAKE_ACCESS',BITHUMB_SECRET_KEY:'FAKE_SECRET',BITHUMB_API_BASE_URL:'https://example.invalid'});
let calls=[];let answer=[];
globalThis.fetch=async(url,opts={})=>{if(String(url).includes('registry.npmjs.org'))return new Response('{"version":"0.8.5"}');assert.equal(opts.method,'GET','Only documented read commands may execute');calls.push({url:String(url),method:opts.method});return new Response(JSON.stringify(answer),{status:200})};
const {main}=await import('../bithumb-audit-evidence-20260911/cli/package/dist/index.js');
async function run(argv,data=[]){calls=[];answer=data;let stdout='',stderr='',error=null;const args=process.argv,out=process.stdout.write,err=process.stderr.write;process.argv=['node','audit',...argv,'--json'];process.stdout.write=x=>{stdout+=x;return true};process.stderr.write=x=>{stderr+=x;return true};process.exitCode=0;try{await main()}catch(e){error=e.message}finally{process.argv=args;process.stdout.write=out;process.stderr.write=err}const result={command:'bithumb '+argv.join(' '),requests:calls,stdout,stderr,error,exitCode:process.exitCode};process.exitCode=0;return result}
const rows=[];
// MD table explicitly suggests wait,watch. Capture query; invalidity comes from official API contract, not a mock server rejection.
rows.push(await run(['trade','list','--states','wait,watch']));
// MD post-write checks: empty wait list cannot distinguish a done order from a cancelled or absent one.
rows.push(await run(['trade','list','--state','wait']));
rows.push(await run(['trade','list']));
// MD network discovery command, as written, omits --net-type.
rows.push(await run(['withdraw','chance','--currency','BTC']));
// MD latest-one withdrawal query has no operation ID. Different later operation is a modeled fixture, not observed exchange behavior.
rows.push(await run(['withdraw','list','--currency','BTC','--limit','1'],[{uuid:'MOCK_OTHER_LATER_WITHDRAWAL',currency:'BTC',state:'DONE'}]));
assert(rows[0].requests[0].url.includes('watch'));assert(!rows[2].requests[0].url.includes('state='));assert(!rows[4].requests[0].url.includes('uuids'));
fs.writeFileSync('md-review-20260914/command-results.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(rows,null,2));
