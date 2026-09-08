export type CloudPlatform = { id:number; x:number; width:number; y:number; gem:boolean; landed:boolean; kind?:'stable'|'moving'|'fragile'|'bonus'; baseY?:number; contact?:number; broken?:boolean };
export type CloudEnemy = {id:number;x:number;y:number;warnedAt:number|null;passed:boolean};
export type CloudRun = { elapsed:number; duration:number; camera:number; y:number; vy:number; grounded:boolean; coyote:number; buffered:number; platforms:CloudPlatform[]; serial:number; score:number; hits:number; misses:number; lives:number; finished:boolean; feedback:string; feedbackUntil:number; enemies:CloudEnemy[]; invulnerableUntil:number };
export const CLOUD_PLAYER_X=160;
export function createCloudRun(duration=40):CloudRun {
  return {elapsed:0,duration:duration*1000,camera:0,y:300,vy:0,grounded:true,coyote:100,buffered:0,platforms:[{id:0,x:0,width:460,y:300,gem:false,landed:true,kind:'stable'}],serial:0,score:0,hits:0,misses:0,lives:3,finished:false,feedback:"Tocca per saltare",feedbackUntil:2200,enemies:[],invulnerableUntil:0};
}
export function jumpCloud(s:CloudRun):CloudRun {
  if(s.finished)return s;
  if(s.grounded || s.coyote>0)return {...s,vy:-390,grounded:false,coyote:0,buffered:0};
  return {...s,buffered:120};
}
export function advanceCloud(previous:CloudRun,delta:number,random=Math.random):CloudRun {
  if(previous.finished)return previous;
  const s={...previous,platforms:previous.platforms.map(p=>({...p})),enemies:previous.enemies.map(e=>({...e}))};
  let remaining=Math.min(250,Math.max(0,delta));
  while(remaining>0 && !s.finished){
    const ms=Math.min(16,remaining),dt=ms/1000;remaining-=ms;s.elapsed+=ms;
    const speed=130+60*Math.min(1,s.elapsed/40000);
    s.camera+=speed*dt;
    let last=s.platforms.filter(p=>p.kind!=='bonus').at(-1)!;
    while(last.x+last.width<s.camera+760){
      const id=++s.serial;
      const kind:CloudPlatform['kind']=id<3?'stable':id%5===0?'fragile':id%4===0?'moving':'stable';
      const baseY=Math.max(285,Math.min(315,(last.baseY??last.y)+(random()-.5)*20));
      const p:CloudPlatform={id,x:last.x+last.width+45+random()*20,width:150+random()*110,y:baseY,baseY,kind,gem:true,landed:false};
      s.platforms.push(p);last=p;
      if(id%5===2&&id>2)s.platforms.push({id:100000+id,x:p.x+p.width-100,width:90,y:baseY-32,baseY:baseY-32,kind:'bonus',gem:true,landed:false});
      if(id%7===6)s.enemies.push({id,x:p.x+p.width*.6,y:baseY-28,warnedAt:null,passed:false});
    }
    s.platforms=s.platforms.filter(p=>p.x+p.width>s.camera-120);
    s.enemies=s.enemies.filter(e=>e.x>s.camera-100);
    for(const p of s.platforms)if(p.kind==='moving') {
      const nextY=(p.baseY??300)+Math.sin(s.elapsed/1200+p.id)*10;
      if(s.grounded&&Math.abs(s.y-p.y)<1&&s.camera+CLOUD_PLAYER_X>=p.x-12&&s.camera+CLOUD_PLAYER_X<=p.x+p.width+12)s.y+=nextY-p.y;
      p.y=nextY;
    }
    const x=s.camera+CLOUD_PLAYER_X,oldY=s.y;
    s.coyote=Math.max(0,s.coyote-ms);s.buffered=Math.max(0,s.buffered-ms);
    s.vy+=900*dt;s.y+=s.vy*dt;s.grounded=false;
    for(const p of s.platforms){
      if(!p.broken && s.vy>=0 && x+12>=p.x && x-12<=p.x+p.width && oldY<=p.y+1 && s.y>=p.y){
        s.y=p.y;s.vy=0;s.grounded=true;s.coyote=100;
        if(!p.landed){p.landed=true;s.score++;s.hits++;s.feedback="Atterraggio! +1";s.feedbackUntil=s.elapsed+650;}
        if(p.kind==='fragile'){p.contact=(p.contact??0)+ms;if(p.contact>900){p.broken=true;s.grounded=false;s.feedback='La nuvola si dissolve!';s.feedbackUntil=s.elapsed+900;}}
        break;
      }
    }
    if(s.grounded && s.buffered>0){s.vy=-390;s.grounded=false;s.coyote=0;s.buffered=0;}
    for(const p of s.platforms){
      if(!p.broken && p.gem && Math.abs(x-(p.x+p.width*.35))<28 && Math.abs((s.y-24)-(p.y-65))<34){const value=p.kind==='bonus'?4:2;p.gem=false;s.score+=value;s.hits++;s.feedback=`Gemma! +${value}`;s.feedbackUntil=s.elapsed+700;}
    }
    for(const enemy of s.enemies){
      if(enemy.passed)continue;
      if(enemy.warnedAt===null && enemy.x-x<330)enemy.warnedAt=s.elapsed;
      const armed=enemy.warnedAt!==null && s.elapsed-enemy.warnedAt>=1100;
      if(armed && Math.abs(enemy.x-x)<25 && Math.abs(enemy.y-(s.y-22))<26 && s.elapsed>=s.invulnerableUntil){
        enemy.passed=true;s.lives=Math.max(0,s.lives-1);s.misses++;s.invulnerableUntil=s.elapsed+1800;s.feedback='Tengu! −1 vita';s.feedbackUntil=s.elapsed+1200;
        if(!s.lives)s.finished=true;
      }
      if(enemy.x<x-35)enemy.passed=true;
    }
    if(s.finished)break;
    if(s.y>460){
      s.lives--;s.misses++;s.feedback="Nel vuoto!";s.feedbackUntil=s.elapsed+1200;
      if(!s.lives)s.finished=true;
      else {const safe=s.platforms.find(p=>p.kind!=='bonus'&&!p.broken&&p.x+p.width>x+40)??s.platforms.filter(p=>p.kind!=='bonus').at(-1)!;safe.broken=false;safe.kind='stable';s.camera=safe.x+30-CLOUD_PLAYER_X;s.y=safe.y;s.vy=0;s.grounded=true;s.coyote=100;s.buffered=0;safe.landed=true;s.invulnerableUntil=s.elapsed+1800;}
    }
  }
  return s;
}
