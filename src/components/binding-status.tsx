"use client";

import { withBase } from "@/lib/paths";
import { useEffect, useState } from "react";

export function BindingStatus() {
  const [text, setText] = useState("Revisando dónde se guarda el caso…");

  useEffect(() => {
    let cancelled = false;
    fetch(withBase("/api/bindings"))
      .then((response) => response.json() as Promise<unknown>)
      .then((data) => {
        if (cancelled) return;
        const driver = data && typeof data === "object" && "driver" in data ? data.driver : undefined;
        if (driver === "d1+kv+r2") {
          setText("Los bindings responden: D1 para el caso reducido, KV para la sesión y R2 para metadatos.");
          return;
        }
        if (driver === "partial") {
          setText("Hay bindings parciales. El caso se guarda en los que respondan.");
          return;
        }
        setText("Sin bindings en este proceso: el caso queda en memoria. En Cloud usa D1, KV y R2.");
      })
      .catch(() => {
        if (!cancelled) setText("No pude verificar los bindings. El caso igual se puede preparar.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <p className="binding-note">{text}</p>;
}
