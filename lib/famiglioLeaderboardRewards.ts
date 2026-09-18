import {getDatabase} from '@netlify/database';
import {creditCompetitionAwards,ensureCompetition,type CompetitionDb} from './famiglioLeaderboardStore';
export async function syncCompetitionRewards(customerId:string){
  const client=await getDatabase().pool.connect();
  try{const db=client as unknown as CompetitionDb;await ensureCompetition(db);return await creditCompetitionAwards(db,customerId);}
  finally{client.release();}
}
