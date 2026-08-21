"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";
import { HorizontalScrollHint } from "@/components/HorizontalScrollHint";

export type JournalSection = { id: string; label: string; eyebrow?: string; content: ReactNode };

export function CreativeJournalSections({ sections, label, variant = "dark" }: { sections: JournalSection[]; label: string; variant?: "dark" | "paper" }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const instanceId = useId().replaceAll(":", "");
  const active = sections.find((section) => section.id === activeId) ?? sections[0];

  if (!active) return null;

  return (
    <div className={`journal-switch journal-switch-${variant}`}>
      <HorizontalScrollHint className="journal-scroll-hint" />
      <div className="journal-switch-tabs" role="tablist" aria-label={label}>
        {sections.map((section, index) => (
          <button
            key={section.id}
            id={`tab-${instanceId}-${section.id}`}
            type="button"
            role="tab"
            aria-selected={active.id === section.id}
            aria-controls={`panel-${instanceId}-${section.id}`}
            tabIndex={active.id === section.id ? 0 : -1}
            onClick={() => setActiveId(section.id)}
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const tabs = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? []);
              const currentIndex = tabs.indexOf(event.currentTarget);
              const nextIndex = event.key === "Home"
                ? 0
                : event.key === "End"
                  ? tabs.length - 1
                  : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
              tabs[nextIndex]?.focus();
              if (sections[nextIndex]) setActiveId(sections[nextIndex].id);
            }}
          >
            <span>{section.eyebrow ?? String(index + 1).padStart(2, "0")}</span>{section.label}
          </button>
        ))}
      </div>
      <div id={`panel-${instanceId}-${active.id}`} role="tabpanel" aria-labelledby={`tab-${instanceId}-${active.id}`} className="journal-switch-panel" key={active.id}>
        {active.content}
      </div>
    </div>
  );
}
