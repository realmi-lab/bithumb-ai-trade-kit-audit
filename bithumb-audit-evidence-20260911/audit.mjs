import fs from 'node:fs';
import os from 'node:os';
import vm from 'node:vm';
import {syncBuiltinESMExports} from 'node:module';
import {resolve} from 'node:path';
const fixture=resolve('fixture');fs.mkdirSync(fixture+'/.bithumb',{recursive:true});
os.homedir=()=>fixture;syncBuiltinESMExports();
for(const k of Object.keys(process.env)) if(k.startsWith('BITHUMB_')) delete process.env[k];
process.env.BITHUMB_ACCESS_KEY='FAKE_ENV_ACCOUNT_B';process.env.BITHUMB_SECRET_KEY='FAKE_SECRET';
globalThis.fetch=async()=>{throw Error('Network disabled for audit')};
const core=await import('./cli/package/dist/chunk-Y64A2CTR.js');
fs.writeFileSync(fixture+'/.bithumb/config.toml','default_profile = "view"\n[profiles.view]\naccess_key = "FAKE_ACCOUNT_A"\nsecret_key = "FAKE_SECRET_A"\nread_only = true\n[profiles.incomplete]\naccess_key = "FAKE_ACCOUNT_C"\n');
const results=[];
for(const profile of ['view','typo_missing','incomplete']){
 try { const c=core.loadConfig({profile});results.push({test:'profile',profile,usedAccount:c.accessKey,readOnly:c.readOnly}); }
 catch(e){results.push({test:'profile',profile,error:e.message})}
}
results.push({test:'mcp_startup_ignores_toml',readOnly:core.loadConfig({ignoreToml:true,clientType:'mcp'}).readOnly});
const calls=[];
const fakeClient={privatePost:async(path,body)=>{calls.push({path,body});return {endpoint:'MOCK',data:{order_id:'FAKE_ORDER'}}}};
const cfg=core.loadConfig({profile:'typo_missing'});
await core.createToolRunner(fakeClient,cfg)('trade_place_order',{market:'KRW-BTC',side:'bid',order_type:'price',price:'10000'});
results.push({test:'no_confirmation_or_preflight_in_runner',mockPosts:calls.length,clientOrderIdPresent:'client_order_id' in calls[0].body});
try{await core.createToolRunner(fakeClient,{...cfg,readOnly:true})('trade_place_order',{market:'KRW-BTC',side:'bid',order_type:'price',price:'10000'})}catch(e){results.push({test:'positive_control_readonly',blocked:true})}
const {handleTradeCommand}=await import('./cli/package/dist/trade-XUYIIU4K.js');
fs.writeFileSync('batch-fixture.json',JSON.stringify([{market:'KRW-BTC',side:'bid',order_type:'price',price:'10000'}]));
process.exitCode=0;
await handleTradeCommand(async()=>({data:{batch_orders_response:[{name:'insufficient_funds',message:'FAKE_REJECTION'}]}}),'batch-place',{file:resolve('batch-fixture.json')},true);
results.push({test:'all_batch_items_fail',exitCode:process.exitCode});
const logger=new core.TradeLogger({logDir:fixture+'/logs',emitToStderr:false});
logger.logTool('info','account_get_api_keys',{}, {data:[{access_key:'FAKE_ACCESS_KEY',secret_key:'FAKE_SECRET_IN_ARRAY'}]},1);
logger.info('object_mask_test',{access_key:'FAKE_ACCESS_KEY',secret_key:'FAKE_SECRET_TOP'});
const log=fs.readFileSync(fixture+'/logs/'+fs.readdirSync(fixture+'/logs')[0],'utf8');
results.push({test:'redaction',arraySecretUnmasked:log.includes('FAKE_SECRET_IN_ARRAY'),accessKeyUnmasked:log.includes('FAKE_ACCESS_KEY'),topLevelSecretMasked:!log.includes('FAKE_SECRET_TOP')});
const src=fs.readFileSync('./cli/package/dist/index.js','utf8');
const fn=src.slice(src.indexOf('function wrapRunnerWithLogger('),src.indexOf('async function main()'));
const wrap=vm.runInNewContext(fn+'\nwrapRunnerWithLogger',{Date});
const entries=[];
await wrap(async()=>({data:{batch_orders_response:[{name:'insufficient_funds'}]}}),{logTool:(...args)=>entries.push(args)})('trade_batch_place',{});
results.push({test:'failed_batch_audit_log',level:entries[0][0],result:entries[0][3]});
fs.writeFileSync('results.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
