import assert from 'node:assert/strict';
import {test} from 'node:test';
import {VaneRemoteProvider} from './remote-provider.ts';

// Isolated handler regressions. These do not establish Runtime admission or a
// real browser/AI result; those are exercised through the formal App journey.
function setup(execute=async()=>null){
  const provider=new VaneRemoteProvider({integration:{registerProvider:async()=>{},pollProvider:()=>new Promise(()=>{})}}, {execute,readResearch:()=>null});
  return {provider,call:(operation,input,owner='consumer-a')=>provider.dispatch(owner,operation,input)};
}
test('document chunks are caller-bound, ordered and complete before indexing',async()=>{
  const indexed=[];const {provider,call}=setup(async(name,input)=>{indexed.push({name,input});return [{fileId:'doc',fileName:'note.txt',fileExtension:'txt'}];});
  try{
    const {id}=await call('documents.upload',{action:'begin',fileName:'note.txt',mimeType:'text/plain',size:5});
    await assert.rejects(call('documents.upload',{action:'append',id,offset:0,data:'aGVsbG8='},'consumer-b'),/unavailable/);
    await assert.rejects(call('documents.upload',{action:'append',id,offset:2,data:'aGU='}),/Invalid/);
    await assert.rejects(call('documents.upload',{action:'index',id}),/Finish uploading/);
    await call('documents.upload',{action:'append',id,offset:0,data:'aGVsbG8='});
    await call('documents.upload',{action:'index',id});
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(indexed.length,1);assert.equal(indexed[0].input.files[0].bytes.toString(),'hello');
    assert.equal((await call('documents.upload',{action:'read',id})).state,'completed');
    await assert.rejects(call('documents.upload',{action:'index',id}),/already being indexed/);
    assert.equal(indexed.length,1);
  }finally{provider.close();}
});
test('oversized or unsupported document input never reaches the research engine',async()=>{
  let calls=0;const {provider,call}=setup(async()=>{calls++;});
  try{
    await assert.rejects(call('documents.upload',{action:'begin',fileName:'bad.exe',mimeType:'application/octet-stream',size:10}),/Choose/);
    await assert.rejects(call('documents.upload',{action:'begin',fileName:'big.txt',mimeType:'text/plain',size:21*1024*1024}),/Choose/);
    assert.equal(calls,0);
  }finally{provider.close();}
});
test('large response chunks preserve the original result and reject another caller',async()=>{
  const {provider,call}=setup();
  try{
    const value={answer:'研究结果'.repeat(20000)};
    const response=await provider.respond('consumer-a',value);
    assert.ok(response.transfer);
    await assert.rejects(call('result.read',{id:response.transfer.id,offset:0},'consumer-b'),/unavailable/);
    const chunks=[];let offset=0;
    while(offset<response.transfer.size){const part=await call('result.read',{id:response.transfer.id,offset});chunks.push(Buffer.from(part.data,'base64'));offset=part.nextOffset;}
    assert.deepEqual(JSON.parse(Buffer.concat(chunks).toString('utf8')),value);
  }finally{provider.close();}
});
test('remote preferences preserve the PC search address and do not expose AI configuration',async()=>{
  let saved;
  const {provider,call}=setup(async(name,input)=>{
    if(name==='settings.get')return {searxngURL:'http://127.0.0.1:8080',systemInstructions:'old'};
    saved=input;return input;
  });
  try{
    assert.equal((await call('settings.get',{})).searxngURL,'configured');
    const result=await call('settings.save',{systemInstructions:'new'});
    assert.equal(saved.searxngURL,'http://127.0.0.1:8080');assert.equal(result.searxngURL,'configured');
    await assert.rejects(call('settings.aiConfig.overwrite',{}),/unavailable/);
    provider.close();await assert.rejects(call('chats.list',{}),/unavailable/);
  }finally{provider.close();}
});
