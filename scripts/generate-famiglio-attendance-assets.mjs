import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve("public/famiglio/rebuild/attendance");
const palettes = [
  ["#071629", "#17335f", "#315ba6", "#65d5e8", "#d4fbff", "#ffe36d", "#ffffff"],
  ["#102113", "#23522d", "#3e8540", "#86d45a", "#d7f58a", "#f1c45c", "#fff3c4"],
  ["#24150d", "#59341b", "#9b6124", "#e8a33c", "#ffd96a", "#6b4a90", "#fff0ba"],
  ["#160d2c", "#37205b", "#67398c", "#a85dc7", "#e395f0", "#42b6c8", "#ffe77a"],
];

function rgba(hex) { const value = Number.parseInt(hex.slice(1), 16); return [(value >> 16) & 255, (value >> 8) & 255, value & 255, 255]; }
function canvas(size) { return { size, pixels: Buffer.alloc(size * size * 4) }; }
function px(c, x, y, color) { if (x < 0 || y < 0 || x >= c.size || y >= c.size) return; const i = (y * c.size + x) * 4; c.pixels.set(rgba(color), i); }
function rect(c, x, y, w, h, color) { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) px(c, xx, yy, color); }
function line(c, x0, y0, x1, y1, color) { let dx=Math.abs(x1-x0), sx=x0<x1?1:-1, dy=-Math.abs(y1-y0), sy=y0<y1?1:-1, err=dx+dy; while(true){px(c,x0,y0,color);if(x0===x1&&y0===y1)break;const e=2*err;if(e>=dy){err+=dy;x0+=sx}if(e<=dx){err+=dx;y0+=sy}} }
function diamond(c,cx,cy,r,color){for(let y=-r;y<=r;y++){const w=r-Math.abs(y);rect(c,cx-w,cy+y,w*2+1,1,color)}}
function ring(c,cx,cy,r,color){for(let a=0;a<360;a+=5){const q=a*Math.PI/180;px(c,Math.round(cx+Math.cos(q)*r),Math.round(cy+Math.sin(q)*r),color)}}

function reward(index) {
  const c=canvas(32), season=Math.floor(index/13), variant=index%13, p=palettes[season];
  diamond(c,16,17,10,p[1]); diamond(c,16,16,8,p[2]);
  const shape=variant%6;
  if(shape===0){ring(c,16,15,6,p[5]);diamond(c,16,15,3,p[4])}
  if(shape===1){rect(c,10,11,12,11,p[5]);rect(c,12,9,8,3,p[4]);rect(c,14,14,4,5,p[0]);px(c,15,15,p[6])}
  if(shape===2){diamond(c,16,14,7,p[4]);diamond(c,16,14,3,p[6]);rect(c,15,20,3,4,p[5])}
  if(shape===3){ring(c,16,15,7,p[4]);line(c,16,8,16,22,p[5]);line(c,9,15,23,15,p[5]);diamond(c,16,15,2,p[6])}
  if(shape===4){rect(c,9,12,14,8,p[5]);rect(c,11,10,10,3,p[4]);rect(c,12,15,8,5,p[0]);rect(c,14,17,4,2,p[6])}
  if(shape===5){line(c,9,21,22,9,p[5]);line(c,11,22,24,11,p[4]);diamond(c,22,10,3,p[6]);diamond(c,10,21,2,p[3])}
  const marks=(variant%4)+1; for(let i=0;i<marks;i++) diamond(c,7+i*6,6+(i%2)*2,1,p[6]);
  // Firma binaria visibile solo come micro-incisione: rende ciascuno dei 13
  // premi stagionali un raster realmente distinto senza introdurre testo.
  for(let bit=0;bit<4;bit++) if((variant>>bit)&1) rect(c,10+bit*3,26,2,2,p[6]);
  return c;
}

function daily(kind) { const c=canvas(24), p=palettes[kind]; diamond(c,12,12,8,p[2]); if(kind===0){diamond(c,12,11,5,p[5]);rect(c,10,15,5,2,p[6])} else {rect(c,7,9,10,8,p[5]);rect(c,9,7,6,3,p[4]);diamond(c,12,13,3,p[6])} return c; }
function cover(season){const c=canvas(32),p=palettes[season];for(let y=0;y<32;y++)for(let x=0;x<32;x++)px(c,x,y,((x+y)%8<4)?p[0]:p[1]);for(let y=4;y<32;y+=8)for(let x=4;x<32;x+=8)diamond(c,x+(y%16?2:0),y,2,p[3]);return c}
async function save(c,file){await sharp(c.pixels,{raw:{width:c.size,height:c.size,channels:4}}).png({palette:true,colors:16,compressionLevel:9}).toFile(file)}

await mkdir(path.join(root,"rewards"),{recursive:true}); await mkdir(path.join(root,"daily"),{recursive:true}); await mkdir(path.join(root,"covers"),{recursive:true});
for(let i=0;i<52;i++) await save(reward(i),path.join(root,"rewards",`${String(i+1).padStart(2,"0")}.png`));
await save(daily(0),path.join(root,"daily","coins.png")); await save(daily(1),path.join(root,"daily","supplies.png"));
for(const [i,name] of ["lunare","bosco","arcano","crepuscolo"].entries()) await save(cover(i),path.join(root,"covers",`${name}.png`));
console.log("Creati 52 premi, 2 icone giornaliere e 4 cover in pixel art nativa.");
