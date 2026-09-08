"use client";
import {useState} from 'react';
import {FAMILIAR_COMBAT_CAMPAIGN} from '@/lib/famiglioCombatCampaign';
import {FamiglioCampaignNpcCanvas,type CampaignNpcPose} from './FamiglioCampaignNpcCanvas';
import styles from './FamiglioNpcReview.module.css';
const poses: Array<[CampaignNpcPose,string]>=[['idle','Attesa'],['command','Comando'],['cheer','Incoraggiamento'],['anger','Rabbia'],['victory','Vittoria'],['defeat','Sconfitta']];
export function FamiglioNpcReview(){
 const [pose,setPose]=useState<CampaignNpcPose>('idle');
 return <main className={styles.page}><h1>I 20 avversari della campagna</h1><p>Scegli una sequenza per vederla su tutti gli NPC.</p><nav>{poses.map(([id,label])=><button type="button" key={id} aria-pressed={pose===id} onClick={()=>setPose(id)}>{label}</button>)}</nav><div className={styles.grid}>{FAMILIAR_COMBAT_CAMPAIGN.map(level=><article key={level.id}><h2>{level.number}. {level.npc.name}</h2><FamiglioCampaignNpcCanvas src={level.npc.spriteSrc} label={level.npc.name} pose={pose}/><p>{level.npc.title}</p></article>)}</div><a href="/famiglio?preview=combat&test=all&needs=full&attendance=0">Prova nella campagna</a></main>;
}
