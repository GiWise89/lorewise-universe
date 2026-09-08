import fs from 'node:fs';
const b=fs.readFileSync(process.argv[2]);
let p=12,fmt,data;
while(p+8<=b.length){const id=b.toString('ascii',p,p+4),n=b.readUInt32LE(p+4);if(id==='fmt ')fmt={format:b.readUInt16LE(p+8),channels:b.readUInt16LE(p+10),rate:b.readUInt32LE(p+12),bits:b.readUInt16LE(p+22)};if(id==='data')data=b.subarray(p+8,p+8+n);p+=8+n+(n%2);}
console.log(fmt, 'seconds',data.length/(fmt.rate*fmt.channels*fmt.bits/8));
const bytes=fmt.bits/8;
const hop=Math.round(fmt.rate/200),env=[];
for(let i=0;i<data.length/(bytes*fmt.channels);i+=hop){let e=0;for(let j=0;j<hop&&((i+j)*fmt.channels*bytes)<data.length;j++)e+=Math.abs(data.readIntLE((i+j)*fmt.channels*bytes,bytes));env.push(e/hop);}
const raw=env.map((v,i)=>Math.max(0,v-(env[i-1]??v)));
const flux=raw.map((v,i)=>raw.slice(Math.max(0,i-3),i+4).reduce((a,b)=>a+b,0)/7);
const candidates=[];
for(let bpm=70;bpm<=160;bpm+=.1){const step=60*fmt.rate/hop/bpm;let best=0,phase=0;for(let o=0;o<step;o++){let sum=0,count=0;for(let i=o;i<flux.length;i+=step){sum+=flux[Math.round(i)]??0;count++;}if(sum/count>best){best=sum/count;phase=o*hop/fmt.rate;}}candidates.push({bpm:+bpm.toFixed(1),phase,score:best});}
console.log(candidates.sort((a,b)=>b.score-a.score).slice(0,12));
