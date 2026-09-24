"use client";

import { useEffect, useState } from "react";
import { withBase } from "@/lib/paths";
import type { Intervention, PublicRun } from "@/lib/types";

export function useSeason(id: string) {
  const [run, setRun] = useState<PublicRun | null>(null);
  const [error, setError] = useState("");
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSnapshot() {
      try {
        const response = await fetch(withBase(`/api/runs/${id}`));
        const data = (await response.json()) as PublicRun | { error?: string };
        if (cancelled || !("id" in data)) return;
        setRun((prev) => ({
          ...data,
          publishResult: data.publishResult ?? prev?.publishResult,
        }));
        setBooting(false);
      } catch {
        /* stream still tries */
      }
    }

    void loadSnapshot();

    const source = new EventSource(withBase(`/api/runs/${id}/stream`));
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { type?: string; run?: PublicRun; message?: string };
        if (data.type === "error") setError(data.message || "Se cortó la temporada.");
        if (data.run) {
          setRun((prev) =>
            data.run
              ? { ...data.run, publishResult: data.run.publishResult ?? prev?.publishResult }
              : prev,
          );
          setBooting(false);
        }
      } catch {
        setError("Llegó un mensaje que no pude leer.");
      }
    };
    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) {
        setError((current) => current || "Se cortó el vivo.");
      }
    };

    return () => {
      cancelled = true;
      source.close();
    };
  }, [id]);

  async function act(action: Intervention) {
    const response = await fetch(withBase(`/api/runs/${id}/intervene`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action),
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error || "La intervención no entró.");
    }
  }

  async function publish(confirm: boolean) {
    const response = await fetch(withBase(`/api/runs/${id}/publish`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm, publishItems: true }),
    });
    const data = (await response.json()) as PublicRun | { error?: string };
    if (!response.ok || !("id" in data)) {
      setError("error" in data ? data.error || "No se pudo publicar." : "No se pudo publicar.");
      return;
    }
    setRun(data);
  }

  return { run, error, booting, act, publish };
}
