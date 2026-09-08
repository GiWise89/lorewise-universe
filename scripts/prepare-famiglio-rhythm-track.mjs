// Adapt the locally owned music pack to a short, lightweight in-game WAV.
import fs from 'node:fs';
const source=fs.readFileSync('tmp/rhythm-audio/fields-of-hope.wav');
let p=12,data;
while(p+8<source.length){const n=source.readUInt32LE(p+4);if(source.toString('ascii',p,p+4)==='data')data=source.subarray(p+8,p+8+n);p+=8+n+(n%2);}
const rate=44100,frames=40*rate,out=Buffer.alloc(44+frames*2);
out.write('RIFF');out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);out.writeUInt32LE(rate,24);out.writeUInt32LE(rate*2,28);out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);out.write('data',36);out.writeUInt32LE(frames*2,40);
for(let i=0;i<frames;i++){const sample=(data.readIntLE(i*6,3)+data.readIntLE(i*6+3,3))/512;const fade=Math.min(1,(frames-i)/(rate*.4));out.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(sample*fade))),44+i*2);}
fs.mkdirSync('public/famiglio/rebuild/audio/minigames',{recursive:true});
fs.writeFileSync('public/famiglio/rebuild/audio/minigames/fields-of-hope-rhythm-v1.wav',out);
