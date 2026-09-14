import {spawnSync} from 'node:child_process';import fs from 'node:fs';import os from 'node:os';import assert from 'node:assert/strict';import {resolve} from 'node:path';import {syncBuiltinESMExports} from 'node:module';
const fixture=fs.mkdtempSync(resolve('fixture-v3-'));fs.mkdirSync(fixture+'/.bithumb');os.homedir=()=>fixture;syncBuiltinESMExports();
for(const k of Object.keys(process.env))if(k.startsWith('BITHUMB_'))delete process.env[k];process.env.BITHUMB_ACCESS_KEY='FAKE_ENV';process.env.BITHUMB_SECRET_KEY='FAKE_ENV_SECRET';
let calls=[];let responder=()=>({status:200,data:[]});
globalThis.fetch=async(url,options={})=>{if(String(url).includes('registry.npmjs.org'))return new Response('{"version":"0.8.5"}');calls.push({url:String(url),method:options.method,body:options.body?JSON.parse(options.body):null});const r=responder();return new Response(JSON.stringify(r.data),{status:r.status})};
const core=await import('./cli/package/dist/chunk-Y64A2CTR.js');const {handleConfigCommand}=await import('./cli/package/dist/config-FAPUDUEP.js');
const results=[];const configPath=fixture+'/.bithumb/config.toml';
// Parser errors include adjacent source lines, including plaintext secrets.
fs.writeFileSync(configPath,'default_profile="test"\n[profiles.test]\naccess_key="FAKE_ACCESS"\nsecret_key="FAKE_SECRET_MUST_NOT_APPEAR"\nread_only=tru\n');
let configError;
try{core.loadConfig({profile:'test'})}catch(e){configError=e.message}
assert(configError.includes('FAKE_SECRET_MUST_NOT_APPEAR'));results.push({test:'malformed_config_discloses_secret_in_error',secretVisible:true,error:configError});

const preload=fixture+'/preload.mjs';fs.writeFileSync(preload,`import os from 'node:os';import {syncBuiltinESMExports} from 'node:module';os.homedir=()=>${JSON.stringify(fixture)};syncBuiltinESMExports();globalThis.fetch=async()=>{throw Error('NETWORK_DISABLED')};`);
const child=spawnSync(process.execPath,['--import',preload,resolve('cli/package/dist/index.js'),'account','assets'],{encoding:'utf8'});
assert.equal(child.status,1);assert(child.stderr.includes('FAKE_SECRET_MUST_NOT_APPEAR'));
results.push({test:'full_CLI_stderr_leaks_adjacent_valid_secret',exitCode:child.status,stderr:child.stderr});

// Existing read-only profile edited through the actual wizard.
core.writeFullConfig({default_profile:'test',profiles:{test:{access_key:'FAKE_A',secret_key:'FAKE_S',read_only:true}}});
const answers=['','','true',''];const prompts=[];let output='';const out=process.stdout.write;process.stdout.write=(s)=>{output+=s;return true};
try{await handleConfigCommand('set',[],{profile:'test'},{prompt:async q=>{prompts.push(q);return answers.shift()}})}finally{process.stdout.write=out}
const afterTrue=core.loadConfig({profile:'test'});assert.equal(afterTrue.readOnly,false);results.push({test:'wizard_true_disables_readonly',readOnlyBefore:true,answer:'true',readOnlyAfter:afterTrue.readOnly,prompt:prompts[2],output});
// Positive control: documented y correctly enables read-only.
const good=['','','y',''];process.stdout.write=()=>true;try{await handleConfigCommand('set',[],{profile:'test'},{prompt:async()=>good.shift()})}finally{process.stdout.write=out}
assert.equal(core.loadConfig({profile:'test'}).readOnly,true);results.push({test:'positive_control_wizard_y',readOnlyAfter:true});
const cfg={accessKey:'FAKE_A',secretKey:'FAKE_S',hasAuth:true,baseUrl:'https://example.invalid',timeoutMs:100,readOnly:false,modules:['withdraw','trade'],clientType:'audit'};
// The required next-step consent URL is discarded by generic API-error handling.
responder=()=>({status:422,data:{error:{name:'travel_rule_consent_required',message:'MOCK consent required',consent_url:'https://example.invalid/MOCK_CONSENT'} ,consent_url:'https://example.invalid/MOCK_CONSENT'}});
let consentError;try{await core.createToolRunner(new core.BithumbRestClient(cfg),cfg)('withdraw_coin',{currency:'BTC',net_type:'BTC',amount:'0.001',address:'FAKE_ADDRESS',exchange_name:'FAKE_EXCHANGE'})}catch(e){consentError={name:e.name,message:e.message,properties:Object.fromEntries(Object.getOwnPropertyNames(e).filter(k=>k!=='stack').map(k=>[k,e[k]]))}}
assert(!JSON.stringify(consentError).includes('MOCK_CONSENT'));results.push({test:'withdraw_consent_url_discarded',responseCarriedURL:true,errorCarriedURL:false,error:consentError});
// Audit storage failure is swallowed, without even a stderr warning.
const badLogDir=fixture+'/not-a-directory';fs.writeFileSync(badLogDir,'FIXTURE');let warnings='';const err=process.stderr.write;process.stderr.write=s=>{warnings+=s;return true};let thrown=false;
try{const logger=new core.TradeLogger({logDir:badLogDir,emitToStderr:true});logger.logTool('info','trade_place_order',{market:'KRW-BTC'},{order_id:'MOCK'},0)}catch(e){thrown=true}finally{process.stderr.write=err}
assert.equal(thrown,false);assert.equal(warnings,'');results.push({test:'audit_storage_failure_silent',logWritten:false,errorThrown:thrown,stderr:warnings});
// Verify complete receiver fields and decimal amount survive the actual request builder.
responder=()=>({status:200,data:{uuid:'MOCK_WITHDRAW'}});calls=[];await core.createToolRunner(new core.BithumbRestClient(cfg),cfg)('withdraw_coin',{currency:'XRP',net_type:'XRP',amount:'0.123456789012345678',address:'FAKE_ADDRESS',secondary_address:'000123',exchange_name:'FAKE_EXCHANGE',receiver_type:'personal',receiver_ko_name:'FAKE_KO',receiver_en_name:'FAKE_EN'});assert.equal(calls[0].body.amount,'0.123456789012345678');assert.equal(calls[0].body.secondary_address,'000123');results.push({test:'positive_control_withdraw_decimal_and_tag_preserved',passed:true});
// Actual receiver validation blocks missing names before sending.
calls=[];let receiverBlocked=false;try{await core.createToolRunner(new core.BithumbRestClient(cfg),cfg)('withdraw_coin',{currency:'BTC',net_type:'BTC',amount:'1',address:'FAKE_ADDRESS',receiver_type:'personal'})}catch(e){receiverBlocked=true}assert(receiverBlocked&&calls.length===0);results.push({test:'positive_control_receiver_required_names',passed:true});
fs.writeFileSync('results-v3.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
