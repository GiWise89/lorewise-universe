import {FAMILIAR_ATTENDANCE_COLLECTIBLES} from './famiglioAttendanceYear.ts';
export function albumRewardDate(launchDate:string,week:number){
  const date=new Date(`${launchDate}T00:00:00Z`);date.setUTCDate(date.getUTCDate()+week*7-1);
  return new Intl.DateTimeFormat('it-IT',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(date);
}
export function albumSeasonProgress(seasonId:string,owned:readonly string[]){
  const items=FAMILIAR_ATTENDANCE_COLLECTIBLES.filter(item=>item.seasonId===seasonId);
  const count=items.filter(item=>owned.includes(item.id)).length;
  return {items,count,missing:items.length-count,complete:count===items.length&&items.length>0};
}
