import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildTablero, topPorUrgencia, type CasoAgregable, type ConteoAlerta } from "./alerts";

const NOW = Date.parse("2026-09-24T15:00:00.000Z");

describe("agregación de alertas", () => {
  it("suma demostración y casos reales sin conservar el relato", () => {
    const secreto = "Martina Gómez contó un secreto en la calle falsa 123";
    const casos: CasoAgregable[] = [
      {
        provincia: "Entre Ríos",
        departamento: "Concordia",
        departamentoId: "30015",
        severity: "emergencia",
        createdAt: NOW - 60 * 60 * 1000,
      },
      {
        provincia: "Entre Ríos",
        departamento: "Concordia",
        departamentoId: "30015",
        severity: "acompanamiento",
        createdAt: NOW - 2 * 60 * 60 * 1000,
      },
    ];
    const poisoned = casos.map((caso) => ({ ...caso, narrative: secreto, lat: -31.29, lon: -58.23 }));
    const tablero = buildTablero({ now: NOW, rangeId: "7d", province: "entre rios", casos: poisoned });
    const dumped = JSON.stringify(tablero);

    assert.equal(dumped.includes("Martina"), false);
    assert.equal(dumped.includes("secreto"), false);
    assert.equal(dumped.includes("falsa"), false);
    assert.equal(dumped.includes("narrative"), false);
    assert.equal(dumped.includes("-31.29"), false);
    assert.equal(tablero.provincia, "Entre Ríos");
    assert.equal(tablero.incluyeDemostracion, true);

    const concordia = tablero.departamentos.find((item) => item.id === "30015");
    assert.ok(concordia);
    assert.equal(concordia.reales, 2);
    assert.ok(concordia.demostracion >= 1);
    assert.equal(concordia.total, concordia.reales + concordia.demostracion);
    assert.equal(concordia.urgencia, "emergencia");
    assert.equal(concordia.porUrgencia.emergencia, 1);
    assert.equal(concordia.porUrgencia.acompanamiento, 1);
    assert.ok(tablero.departamentos.every((item) => item.provincia === "Entre Ríos"));
    assert.equal(tablero.totales.reales, 2);
  });

  it("recorta por período y deja fuera un caso viejo", () => {
    const viejo: CasoAgregable = {
      provincia: "Santa Fe",
      departamento: "Rosario",
      departamentoId: "82084",
      severity: "urgente",
      createdAt: NOW - 40 * 24 * 60 * 60 * 1000,
    };
    const corto = buildTablero({ now: NOW, rangeId: "24h", province: "", casos: [viejo] });
    const rosario = corto.departamentos.find((item) => item.id === "82084");
    assert.equal(rosario?.reales ?? 0, 0);
    assert.ok((rosario?.demostracion ?? 0) >= 1);

    const largo = buildTablero({ now: NOW, rangeId: "90d", province: "Santa Fe", casos: [viejo] });
    const cell = largo.departamentos.find((item) => item.id === "82084");
    assert.equal(cell?.reales, 1);
    assert.ok(largo.departamentos.every((item) => item.provincia === "Santa Fe"));
  });

  it("ranks departamentos by urgent alerts", () => {
    const cells = [
      fake("a", "A", { urgente: 1 }),
      fake("b", "B", { urgente: 2, emergencia: 2 }),
      fake("c", "C", { preocupacion: 9 }),
      fake("d", "D", { urgente: 3 }),
    ];
    assert.deepEqual(
      topPorUrgencia(cells, 3).map((item) => item.id),
      ["b", "d", "a"],
    );
  });
});

function fake(id: string, departamento: string, counts: Partial<ConteoAlerta["porUrgencia"]>): ConteoAlerta {
  const porUrgencia = { acompanamiento: 0, preocupacion: 0, urgente: 0, emergencia: 0, ...counts };
  const total = porUrgencia.acompanamiento + porUrgencia.preocupacion + porUrgencia.urgente + porUrgencia.emergencia;
  return {
    id,
    provincia: "Buenos Aires",
    departamento,
    total,
    demostracion: total,
    reales: 0,
    porUrgencia,
    urgencia: null,
  };
}
