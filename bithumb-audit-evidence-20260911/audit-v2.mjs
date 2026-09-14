import fs from 'node:fs';import os from 'node:os';import vm from 'node:vm';
import {syncBuiltinESMExports} from 'node:module';import path from 'node:path';import {resolve} from 'node:path';import assert from 'node:assert/strict';
const fixture=fs.mkdtempSync(resolve('fixture-v2-'));fs.mkdirSync(fixture+'/.bithumb',{recursive:true});
os.homedir=()=>fixture;syncBuiltinESMExports();
for(const k of Object.keys(process.env))if(k.startsWith('BITHUMB_'))delete process.env[k];
process.env.BITHUMB_ACCESS_KEY='FAKE_ACCESS';process.env.BITHUMB_SECRET_KEY='FAKE_SECRET';
// No sockets are opened: all fetch calls are replaced below.
let calls=[];let responder=()=>({order_id:'MOCK_ORDER'});
globalThis.fetch=async(url,opts={})=>{
 if(String(url).includes('registry.npmjs.org'))return new Response('{"version":"0.8.5"}');
 const request={url:String(url),method:opts.method??'GET',body:opts.body?JSON.parse(opts.body):null};calls.push(request);
 return new Response(JSON.stringify(await responder(request)),{status:request.method==='POST'?201:200});
};
const core=await import('./cli/package/dist/chunk-Y64A2CTR.js');
const cfg={accessKey:'FAKE_ACCESS',secretKey:'FAKE_SECRET',hasAuth:true,baseUrl:'https://example.invalid',timeoutMs:100,readOnly:false,modules:['trade','account'],clientType:'audit'};
const src=fs.readFileSync('./mcp/package/dist/index.js','utf8');
const slice=(a,b)=>src.slice(src.indexOf(a),src.indexOf(b,src.indexOf(a)));
class MockServer{handlers=new Map();setRequestHandler(schema,handler){this.handlers.set(schema,handler)}}
const context={Server:MockServer,BithumbRestClient:core.BithumbRestClient,CallToolRequestSchema:'call',ListToolsRequestSchema:'list',Date,SERVER_NAME:'audit',SERVER_VERSION:'0.8.5'};
const code=[slice('var BithumbMcpError =','var RateLimiter ='),slice('function asRecord(','function registerMarketTools('),slice('function registerTradeTools(','var DEFAULT_LOG_DIR ='),'function allToolSpecs(){return registerTradeTools();}',slice('function buildTools(','function configFilePath('),slice('function successResult(','// src/index.ts\nfunction printHelp('),'createServer'].join('\n');
const createMcp=vm.runInNewContext(code,context);
const server=createMcp(cfg);const invoke=(name,args)=>server.handlers.get('call')({params:{name,arguments:args}});
const results=[];
for(const tif of ['post_only','ioc','fok']){
 calls=[];await invoke('trade_place_order',{market:'KRW-BTC',side:'bid',order_type:'limit',price:'100000000',volume:'0.001',time_in_force:tif});
 assert.equal(calls.length,1);assert.equal(calls[0].body.time_in_force,undefined);
 results.push({test:'MCP_single_order_drops_time_in_force',input:tif,sent:calls[0].body});
}
calls=[];await invoke('trade_batch_place',{batch_orders:[{market:'KRW-BTC',side:'bid',order_type:'limit',price:'100000000',volume:'0.001',time_in_force:'post_only'}]});
assert.equal(calls[0].body.batch_orders[0].time_in_force,'post_only');results.push({test:'positive_control_batch_preserves_time_in_force',passed:true});
// Enforced MCP read-only still blocks the write.
calls=[];const readonlyServer=createMcp({...cfg,readOnly:true});const blocked=await readonlyServer.handlers.get('call')({params:{name:'trade_place_order',arguments:{market:'KRW-BTC',side:'bid',order_type:'price',price:'10000'}}});
assert.equal(blocked.isError,true);assert.equal(calls.length,0);results.push({test:'positive_control_MCP_readonly_blocks',passed:true});
// Freeze time, exercise the actual rate limiter with two endpoints in the same official API class.
calls=[];responder=()=>[];const run=core.createToolRunner(new core.BithumbRestClient(cfg),cfg);const originalNow=Date.now;const fixed=Date.now();Date.now=()=>fixed;
try{
 for(let i=0;i<100;i++)await run('account_get_assets',{});
 for(let i=0;i<100;i++)await run('account_get_order_chance',{market:'KRW-BTC'});
 assert.equal(calls.length,200);results.push({test:'private_other_rate_limit_not_aggregated',sameTimestampCalls:calls.length,officialClassLimit:140,buckets:['account_get_assets','account_get_order_chance']});
}finally{Date.now=originalNow}
// Actual CLI entrypoint; capture only fake data output.
const {main}=await import('./cli/package/dist/index.js');
async function cli(argv){const old=process.argv;const out=process.stdout.write;const err=process.stderr.write;let stdout='',stderr='';process.argv=['node','audit',...argv];process.exitCode=0;process.stdout.write=(s)=>{stdout+=s;return true};process.stderr.write=(s)=>{stderr+=s;return true};let thrown;
 try{await main()}catch(e){thrown={name:e.name,message:e.message,suggestion:e.suggestion};process.exitCode=1}finally{process.argv=old;process.stdout.write=out;process.stderr.write=err}
 const result={stdout,stderr,exitCode:process.exitCode,...thrown?{thrown}:{}};process.exitCode=0;return result;
}
calls=[];const cliTif=await cli(['trade','place','--market','KRW-BTC','--side','bid','--order-type','limit','--price','100000000','--volume','0.001','--time-in-force','post_only']);assert.equal(calls.length,0);assert.equal(cliTif.exitCode,1);results.push({test:'positive_control_CLI_rejects_unsupported_tif_flag',...cliTif});
// Healthy reachability but rejected credentials; command incorrectly exits 0.
calls=[];responder=(r)=>{if(r.url.includes('/v1/accounts'))return {error:{name:'invalid_access_key',message:'MOCK authentication rejection'}};return []};
const diagnose=await cli(['system','diagnose','--json']);const diagnosis=JSON.parse(diagnose.stdout);assert(diagnosis.checks.some(c=>c.status==='fail'));assert.equal(diagnose.exitCode,0);results.push({test:'diagnose_failed_auth_exit_zero',exitCode:diagnose.exitCode,checks:diagnosis.checks});
// Only cancellation acceptance returned; no final order-state fetch occurs.
calls=[];responder=()=>({order_id:'MOCK_CANCEL',created_at:'2026-09-11T00:00:00Z'});
const cancelled=await cli(['trade','cancel','--order-id','MOCK_CANCEL']);assert.equal(calls.length,1);results.push({test:'cancel_acceptance_reported_as_cancelled',stdout:cancelled.stdout,requests:calls.map(c=>({method:c.method,url:c.url}))});
// Simulate an exchange accepting a request but losing its response.
calls=[];let accepted=0;responder=()=>{accepted++;if(accepted===1)throw new DOMException('MOCK response lost after acceptance','TimeoutError');return {order_id:'MOCK_SECOND'}};
const timeoutRun=core.createToolRunner(new core.BithumbRestClient(cfg),cfg);let failure;
const order={market:'KRW-BTC',side:'bid',order_type:'price',price:'10000'};
try{await timeoutRun('trade_place_order',order)}catch(e){failure={name:e.name,message:e.message,suggestion:e.suggestion}}
// Deliberate second invocation by the harness, NOT an automatic retry by the kit.
await timeoutRun('trade_place_order',order);
results.push({test:'ambiguous_order_timeout',failure,simulatedAcceptedOrdersAfterExplicitSecondCall:accepted,requestsHaveClientId:calls.map(c=>'client_order_id' in c.body),kitAutomaticallyRetried:false});
// Revalidate older profile/batch findings using the full CLI entrypoint.
fs.writeFileSync(fixture+'/.bithumb/config.toml','default_profile="readonly"\n[profiles.readonly]\naccess_key="FAKE_A"\nsecret_key="FAKE_A_SECRET"\nread_only=true\n');
calls=[];responder=()=>({order_id:'MOCK'});const typo=await cli(['trade','place','--profile','missing','--market','KRW-BTC','--side','bid','--order-type','price','--price','10000','--json']);assert.equal(calls.length,1);results.push({test:'full_CLI_missing_profile_write',requestSent:calls.length,exitCode:typo.exitCode});
fs.writeFileSync('batch-v2.json',JSON.stringify([order]));calls=[];responder=()=>({batch_orders_response:[{name:'insufficient_funds',message:'MOCK_ALL_FAILED'}]});const batch=await cli(['trade','batch-place','--profile','missing','--file',resolve('batch-v2.json'),'--json']);assert.equal(batch.exitCode,0);results.push({test:'full_CLI_all_failed_batch',exitCode:batch.exitCode,stdout:batch.stdout});

// Repeated audit queries are themselves logged with their full nested responses.
const auditDir=fs.mkdtempSync(resolve('audit-recursion-'));
const auditCtx={...context,fs,os,path,AUDIT_DIR:auditDir};
const auditCode=[slice('var BithumbMcpError =','var RateLimiter ='),slice('function asRecord(','function registerMarketTools('),slice('var DEFAULT_LOG_DIR =','async function checkAuthLive('),'function allToolSpecs(){return registerAuditTools(AUDIT_DIR);}',slice('function buildTools(','function configFilePath('),slice('function successResult(','// src/index.ts\nfunction printHelp('),'createServer'].join('\n');
const auditFactory=vm.runInNewContext(auditCode,auditCtx);
const auditLogger=new core.TradeLogger({logDir:auditDir,emitToStderr:false});
auditLogger.info('seed',{note:'FAKE_DATA'});
const auditServer=auditFactory({...cfg,modules:['system'],readOnly:true},auditLogger);
const auditSizes=[];
for(let i=0;i<7;i++){
 const r=await auditServer.handlers.get('call')({params:{name:'system_get_audit_log',arguments:{limit:20}}});
 const total=fs.readdirSync(auditDir).reduce((n,f)=>n+fs.statSync(path.join(auditDir,f)).size,0);
 auditSizes.push({iteration:i+1,responseBytes:Buffer.byteLength(JSON.stringify(r)),diskBytes:total});
 assert(total<1000000,'Bounded experiment must stay under 1 MB');
}
assert(auditSizes[6].diskBytes>auditSizes[0].diskBytes*30);
results.push({test:'MCP_audit_log_recursive_amplification',sizes:auditSizes,readOnlyMode:true});

fs.writeFileSync('results-v2.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
