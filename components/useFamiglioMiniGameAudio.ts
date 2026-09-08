"use client";
import { useCallback, useEffect, useRef, useState } from "react";
type Sound="collect"|"error"|"jump"|"light"|"rune";
export function useFamiglioMiniGameAudio(active:boolean,quietMelody=false){
  const context=useRef<AudioContext|null>(null),nodes=useRef(new Set<OscillatorNode>());
  const [muted,setMuted]=useState(false);
  const note=useCallback((frequency:number,start:number,duration:number,gain:number,type:OscillatorType="triangle")=>{
    const ctx=context.current;if(!ctx||ctx.state!=="running")return;
    const oscillator=ctx.createOscillator(),envelope=ctx.createGain();oscillator.type=type;oscillator.frequency.value=frequency;
    envelope.gain.setValueAtTime(0,start);envelope.gain.linearRampToValueAtTime(gain,start+.015);envelope.gain.exponentialRampToValueAtTime(.0001,start+duration);
    oscillator.connect(envelope);envelope.connect(ctx.destination);nodes.current.add(oscillator);
    oscillator.onended=()=>{nodes.current.delete(oscillator);oscillator.disconnect();envelope.disconnect();};oscillator.start(start);oscillator.stop(start+duration+.02);
  },[]);
  const unlock=useCallback(()=>{try{context.current??=new AudioContext();void context.current.resume().catch(()=>{});}catch{/* Audio unavailable: gameplay still works. */}},[]);
  const sound=useCallback((kind:Sound,pad=0)=>{
    if(muted)return;const ctx=context.current;if(!ctx)return;const now=ctx.currentTime;
    if(kind==="rune"){note([261.63,329.63,392,523.25][pad%4],now,.34,.075,"sine");return;}
    if(kind==="error"){note(146.83,now,.16,.035);return;}
    const tones=kind==="light"?[880,1318.51]:kind==="jump"?[392,523.25]:[659.25,987.77];
    tones.forEach((f,i)=>note(f,now+i*.065,.15,.035));
  },[muted,note]);
  useEffect(()=>{
    const playingNodes=nodes.current;
    if(!active||muted){for(const n of playingNodes){try{n.stop();}catch{}}return;}
    let beat=0,next=0;
    // Original short major-key chiptune, independent from scoring and input.
    const melody=[72,76,79,76,74,77,81,77,76,79,84,79,74,79,76,72];
    const roots=[48,53,55,48];
    const tick=()=>{const ctx=context.current;if(!ctx||ctx.state!=="running")return;if(next<ctx.currentTime)next=ctx.currentTime+.025;while(next<ctx.currentTime+.15){const midi=melody[beat%melody.length],root=roots[Math.floor(beat/4)%4];note(440*2**((midi-69)/12),next,.2,quietMelody?.012:.023);if(beat%2===0)note(440*2**((root-69)/12),next,.35,quietMelody?.012:.022,"sine");next+=.25;beat++;}};
    tick();const timer=window.setInterval(tick,80);
    return()=>{clearInterval(timer);for(const n of playingNodes){try{n.stop();}catch{}}};
  },[active,muted,note,quietMelody]);
  useEffect(()=>()=>{void context.current?.close().catch(()=>{});},[]);
  return {unlock,sound,muted,toggle:()=>{unlock();setMuted(v=>!v);}};
}
