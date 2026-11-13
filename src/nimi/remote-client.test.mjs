import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createRemoteVane} from './remote-client.ts';

test('repeated progress snapshots notify completion once and never restart research',async()=>{
  const controller=new AbortController();const calls=[];let reads=0;
  const client=await createRemoteVane({signal:controller.signal,viewKey:'test',client:{integration:{
    listCatalog:async()=>[{integrationId:'vane.research.v1',available:true,permittedOperations:['chats.list'],targetRef:'workspace'}],
    invoke:async input=>{calls.push(input.operation);const updates=[{type:'researchComplete',reason:'budget'},...(++reads>=3?[{type:'messageEnd'}]:[])];return {status:'completed',resultJson:JSON.stringify({ok:true,value:input.operation==='research.read'?{updates}:{}})};}
  }}});
  const received=[];let finished;const done=new Promise(resolve=>{finished=resolve;});
  const stop=await client.research.start({runId:'run',chatId:'chat',messageId:'message',query:'test',sources:[],fileIds:[],mode:'speed',rewrite:false},update=>{received.push(update);if(update.type==='messageEnd')finished();});
  await done;stop();controller.abort();
  assert.equal(calls.filter(name=>name==='research.start').length,1);
  assert.equal(received.filter(update=>update.type==='researchComplete').length,1);
  assert.equal(received.at(-1).type,'messageEnd');
});
test('an unconfirmed write is surfaced without a second invocation',async()=>{
  let writes=0;
  const client=await createRemoteVane({signal:new AbortController().signal,viewKey:'test',client:{integration:{
    listCatalog:async()=>[{integrationId:'vane.research.v1',available:true,permittedOperations:['chats.list'],targetRef:'workspace'}],
    invoke:async()=>{writes++;throw new Error('Connection lost after submission');}
  }}});
  await assert.rejects(client.research.start({runId:'run'},()=>{}),/Connection lost/);
  assert.equal(writes,1);
});
