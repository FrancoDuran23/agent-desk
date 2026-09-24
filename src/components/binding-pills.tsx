"use client";

import { useEffect, useState } from "react";
import { withBase } from "@/lib/paths";

interface Service {
  status: "ok" | "absent" | "error";
  latency: number;
  error?: string;
}

interface Status {
  driver: string;
  names: string[];
  services: Record<string, Service>;
}

const LABELS: Record<string, string> = { d1: "D1 DB", kv: "KV HOUSE", r2: "R2 MEDIA" };

export function BindingPills() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    const load = () => {
      fetch(withBase("/api/bindings"))
        .then((response) => response.json() as Promise<Status>)
        .then((data) => setStatus(data))
        .catch(() => setStatus(null));
    };
    load();
    const timer = setInterval(load, 20000);
    return () => clearInterval(timer);
  }, []);

  if (!status) return <p className="text-xs font-semibold">Mirando los bindings…</p>;

  return (
    <div className="flex flex-wrap gap-2" aria-label="Estado de bindings">
      {Object.entries(status.services).map(([key, service]) => (
        <span key={key} className="hard-sm bg-white px-2 py-1 text-[11px] font-bold" title={service.error || status.driver}>
          {LABELS[key] ?? key}{" "}
          <span className={service.status === "ok" ? "text-[#0f9f6e]" : "text-[#9a6b3f]"}>
            {service.status === "ok" ? `${service.latency}ms` : service.status === "absent" ? "local" : "error"}
          </span>
        </span>
      ))}
    </div>
  );
}
