"use client";

import { useRef } from "react";
import styles from "./TwrGameplayTrailer.module.css";

export function TwrGameplayTrailer({ className, children = "Guarda il gameplay" }: { className?: string; children?: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  function open() {
    dialog.current?.showModal();
    void video.current?.play().catch(() => undefined);
  }
  function close() {
    video.current?.pause();
    dialog.current?.close();
  }
  return <>
    <button className={`${styles.trigger} ${className ?? ""}`} type="button" onClick={open} aria-haspopup="dialog">{children}</button>
    <dialog ref={dialog} className={styles.dialog} aria-label="The Wound Remembers: trailer gameplay" onCancel={close} onClose={() => video.current?.pause()} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <div className={styles.header}><span>THE WOUND REMEMBERS · GAMEPLAY</span><button type="button" onClick={close} aria-label="Chiudi il video">Chiudi ×</button></div>
      <video ref={video} className={styles.video} controls playsInline preload="none" poster="/games/the-wound-remembers/key-art-cover-v2.webp">
        <source src="/games/the-wound-remembers/gameplay-trailer-v1.mp4" type="video/mp4" />
        Il browser non supporta il video. <a href="/games/the-wound-remembers/gameplay-trailer-v1.mp4">Apri il trailer</a>.
      </video>
      <p className={styles.description}>Fusioni, battaglie contro la Nemesi e Scontro dei Patti. <a href="https://thewoundremembers.com/">Gioca ora →</a></p>
    </dialog>
  </>;
}
