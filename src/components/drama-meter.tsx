"use client";

export function DramaMeter({ level, narrator }: { level: number; narrator: string }) {
  const label =
    level > 85 ? "CAOS TOTAL" : level > 65 ? "ALTO" : level > 40 ? "SUBIENDO" : "CALMA TENSA";
  const color = level > 85 ? "#ff1a3c" : level > 65 ? "#ff2d6a" : level > 40 ? "#f5c542" : "#2de2e6";

  return (
    <section className="broadcast-card p-3" aria-label="Medidor de drama">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-[#ff2d6a] uppercase">Drama meter</p>
          <p className="display text-2xl leading-none" style={{ color }}>
            {label}
          </p>
        </div>
        <p className="display text-3xl leading-none" style={{ color }}>
          {level}
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#2a2438]">
        <div className="meter-fill h-full rounded-full" style={{ width: `${level}%`, background: color }} />
      </div>
      <p className="drama mt-3 text-sm leading-snug text-[#e8e0ff]">“{narrator}”</p>
    </section>
  );
}
