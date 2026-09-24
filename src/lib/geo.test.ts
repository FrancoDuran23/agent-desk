import assert from "node:assert/strict";
import { describe, it } from "node:test";
import departamentos from "../data/departamentos.json";
import { departamentosDe, resolveLugar, validarLugar } from "./geo";
import { buildRoute } from "./route-plan";
import { scan } from "./assess";

describe("geolocalización a departamento", () => {
  it("resuelve un punto al departamento más cercano y no devuelve coordenadas", () => {
    const concordia = departamentos.find((fila) => fila.id === "30015");
    assert.ok(concordia);
    const lugar = resolveLugar(concordia.lat, concordia.lon);
    assert.equal(lugar?.id, "30015");
    assert.equal(lugar?.departamento, "Concordia");
    assert.equal(lugar?.provincia, "Entre Ríos");
    assert.deepEqual(Object.keys(lugar ?? {}).sort(), ["departamento", "id", "provincia"]);

    const cerca = resolveLugar(concordia.lat + 0.08, concordia.lon - 0.04);
    assert.equal(cerca?.id, "30015");
    assert.equal("lat" in (cerca ?? {}), false);
    assert.equal("lon" in (cerca ?? {}), false);
  });

  it("ubica el centro de Buenos Aires en una comuna y rechaza un punto fuera del país", () => {
    const caba = resolveLugar(-34.6037, -58.3816);
    assert.equal(caba?.provincia, "Ciudad Autónoma de Buenos Aires");
    assert.match(caba?.departamento ?? "", /^Comuna /);

    assert.equal(resolveLugar(0, 0), null);
    assert.equal(resolveLugar(-34.6, -120), null);
    assert.equal(resolveLugar(Number.NaN, -58), null);
  });

  it("valida el par provincia y departamento y arma la oficina local", () => {
    const lugar = validarLugar("entre rios", "concordia");
    assert.equal(lugar?.departamento, "Concordia");
    assert.equal(lugar?.provincia, "Entre Ríos");
    assert.equal(validarLugar("Jujuy", "Concordia"), null);
    assert.ok(departamentosDe("jujuy").some((item) => item.nombre === "Dr. Manuel Belgrano"));

    const route = buildRoute(scan("le pegó en el brazo"), "Entre Ríos", false, "Concordia");
    assert.match(route.authority, /Servicio Local de Protección de Derechos – Concordia/);
    assert.match(route.summary, /Concordia/);

    const caba = buildRoute(scan("falta a clase"), "Ciudad Autónoma de Buenos Aires", false, "Comuna 4");
    assert.match(caba.authority, /Consejo de los Derechos de Niñas, Niños y Adolescentes – Comuna 4/);
  });
});
