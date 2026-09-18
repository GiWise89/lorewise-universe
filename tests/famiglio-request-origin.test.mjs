import test from 'node:test';
import assert from 'node:assert/strict';
import {isFamiglioRequestOriginAllowed} from '../lib/famiglioRequestOrigin.ts';
const request=(url,origin,extra={})=>new Request(url,{headers:{...(origin?{origin}:{}),...extra}});
test('public Famiglio requests survive Netlify internal URL rewriting',()=>{
  for(const origin of ['https://lorewisenexus.it','https://www.lorewisenexus.it'])
    assert.equal(isFamiglioRequestOriginAllowed(request('http://localhost:3000/api/famiglio/leaderboard',origin)),true);
});
test('unrelated, null and spoofed forwarded origins stay blocked',()=>{
  for(const origin of ['https://attacker.test','https://lorewisenexus.it.attacker.test','http://lorewisenexus.it','null'])
    assert.equal(isFamiglioRequestOriginAllowed(request('http://localhost:3000/api/famiglio/leaderboard',origin,{'x-forwarded-host':'attacker.test','x-forwarded-proto':'https'})),false);
});
test('same-origin LAN trials and requests without Origin remain supported',()=>{
  assert.equal(isFamiglioRequestOriginAllowed(request('http://192.168.1.7:3016/api/famiglio/leaderboard','http://192.168.1.7:3016')),true);
  assert.equal(isFamiglioRequestOriginAllowed(request('https://lorewisenexus.it/api/famiglio/leaderboard')),true);
});
