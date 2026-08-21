"use client";

import { useEffect, useState } from "react";

type Availability = { total: number; reserved: number; remaining: number };

export function CommissionAvailability() {
  const [availability, setAvailability] = useState<Availability>({ total: 10, reserved: 0, remaining: 10 });

  useEffect(() => {
    let active = true;
    fetch("/api/commission-availability", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<Availability> : null)
      .then((result) => { if (active && result) setAvailability(result); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  return (
    <div className="commission-launch-offer" aria-label={`${availability.remaining} disponibilità di lancio rimaste su ${availability.total}`}>
      <span>Disponibilità di lancio</span>
      <strong>{availability.remaining}<small> / {availability.total}</small></strong>
      <p>{availability.remaining > 0 ? "posti ancora disponibili alle tariffe iniziali" : "posti iniziali attualmente esauriti"}</p>
    </div>
  );
}
