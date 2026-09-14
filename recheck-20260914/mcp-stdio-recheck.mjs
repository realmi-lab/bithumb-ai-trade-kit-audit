import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import readline from 'node:readline';
import assert from 'node:assert/strict';
const root=process.cwd();
const sdkDir=path.resolve(process.argv[2]);
const source=path.join(root,'bithumb-audit-evidence-20260911/mcp/package/dist/index.js');
const target=path.join(sdkDir,'audit-server');fs.cpSync(path.dirname(path.dirname(source)),target,{recursive:true});
const entry=path.join(target,'dist/index.js');
const results=[];
async function check(readOnly){
 const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'bithumb-stdio-'));
 const capture=path.join(fixture,'requests.jsonl');const preload=path.join(fixture,'preload.mjs');
 fs.writeFileSync(preload,`import fs from 'node:fs';import os from 'node:os';import {syncBuiltinESMExports} from 'node:module';
 os.homedir=()=>${JSON.stringify(fixture)};syncBuiltinESMExports();
 globalThis.fetch=async(url,opts={})=>{if(String(url).includes('registry.npmjs.org'))return new Response('{"version":"0.8.5"}');
 fs.appendFileSync(${JSON.stringify(capture)},JSON.stringify({method:opts.method,url:String(url),body:opts.body?JSON.parse(opts.body):null})+'\\n');
 return new Response(JSON.stringify({order_id:'MOCK_ONLY'}),{status:201});};`);
 const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>!k.startsWith('BITHUMB_')));
 Object.assign(env,{BITHUMB_ACCESS_KEY:'FAKE_ACCESS',BITHUMB_SECRET_KEY:'FAKE_SECRET',BITHUMB_API_BASE_URL:'https://example.invalid'});
 const proc=spawn(process.execPath,['--import',preload,entry,'--modules','trade','--no-log',...(readOnly?['--read-only']:[])],{env,stdio:['pipe','pipe','pipe']});
 let stderr='';proc.stderr.on('data',b=>stderr+=b);let next=1;const pending=new Map();
 readline.createInterface({input:proc.stdout}).on('line',line=>{let msg;try{msg=JSON.parse(line)}catch{return}const p=pending.get(msg.id);if(p){clearTimeout(p.timer);pending.delete(msg.id);p.resolve(msg)}});
 const request=(method,params)=>new Promise((resolve,reject)=>{const id=next++;const timer=setTimeout(()=>reject(Error('RPC timeout '+method+' '+stderr)),10000);pending.set(id,{resolve,timer});proc.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n')});
 try{
  const init=await request('initialize',{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'audit',version:'1'}});assert(init.result);
  proc.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');
  const listed=await request('tools/list',{});const spec=listed.result.tools.find(x=>x.name==='trade_place_order');assert(spec);
  for(const tif of (readOnly?['post_only']:['post_only','ioc','fok'])){
   const response=await request('tools/call',{name:'trade_place_order',arguments:{market:'KRW-BTC',side:'bid',order_type:'limit',price:'100000000',volume:'0.001',time_in_force:tif}});
   const calls=fs.existsSync(capture)?fs.readFileSync(capture,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse):[];
   if(readOnly){assert(response.result?.isError);assert.equal(calls.length,0)}else{assert(!response.error);assert(!response.result?.isError);assert.equal(calls.at(-1).body.time_in_force,undefined)}
   results.push({test:readOnly?'real_stdio_readonly_blocks':'real_stdio_drops_tif',sdk:'1.26.0',readOnly,input:tif,advertisesTimeInForce:!!spec.inputSchema.properties.time_in_force,requestCount:calls.length,lastRequest:calls.at(-1)??null,response});
  }
 }finally{proc.kill();for(const p of pending.values())clearTimeout(p.timer)}
}
await check(false);await check(true);
fs.writeFileSync(path.join(root,'recheck-20260914/mcp-stdio-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
