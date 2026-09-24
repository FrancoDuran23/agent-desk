import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scan, whoAtRisk } from "./assess";
import { describeJurisdiction, normalizeProvince } from "./jurisdictions";
import { redact } from "./redact";
import { buildRoute } from "./route-plan";

const NEIGHBOUR =
  "La vecina me dijo que su hijo Rodrigo Quintanilla Fernández vive en la calle falsa 123. El teléfono es 11 5555-0199.";

const INITIALS = /\b[A-ZÁÉÍÓÚÑ]\.(?:\s*[A-ZÁÉÍÓÚÑ]\.)+/;

describe("redact", () => {
  it("replaces a full name with a role and never with initials", () => {
    const { text, redactions } = redact(NEIGHBOUR);

    assert.equal(/rodrigo|quintanilla|fernández/i.test(text), false);
    assert.equal(INITIALS.test(text), false);
    assert.match(text, /el niño/);
    assert.match(text, /vecina/);

    const names = redactions.filter((item) => item.kind === "nombre");
    assert.ok(names.length >= 1);
    for (const item of names) {
      assert.equal(INITIALS.test(item.replacement), false);
      assert.equal(item.replacement, "el niño");
    }
  });

  it("keeps the address phrase grammatical and drops the phone", () => {
    const { text, redactions } = redact(NEIGHBOUR);

    assert.match(text, /en \[domicilio omitido\]/);
    assert.equal(/una dirección que se omite/i.test(text), false);
    assert.equal(/la \[domicilio omitido\]/.test(text), false);
    assert.equal(/falsa|\b123\b|5555|0199/.test(text), false);
    assert.ok(redactions.some((item) => item.kind === "direccion" && item.replacement === "[domicilio omitido]"));
    assert.ok(redactions.some((item) => item.kind === "telefono"));
  });

  it("collapses a neighbour named in apposition to a single role", () => {
    const { text } = redact("La vecina Ana Pérez me dijo que el nene llora.");
    assert.equal(/ana|pérez/i.test(text), false);
    assert.equal(INITIALS.test(text), false);
    assert.match(text, /^la vecina me dijo que el nene llora\.$/i);
  });

  it("drops a naming clause instead of rewriting it", () => {
    const aside = redact("El hijo del vecino, se llama Rodrigo Quintanilla Fernández,");
    assert.equal(/rodrigo|quintanilla|fernández|se identifica|una persona/i.test(aside.text), false);
    assert.equal(aside.text, "El hijo del vecino");
    assert.ok(aside.redactions.some((item) => item.kind === "nombre" && item.replacement === "[nombre omitido]"));

    const continued = redact("El hijo del vecino, se llama Rodrigo Quintanilla Fernández, falta a clase.");
    assert.equal(continued.text, "El hijo del vecino falta a clase.");

    const called = redact("Un nene llamado Rodrigo llegó llorando.");
    assert.equal(called.text, "Un nene llegó llorando.");

    const byName = redact("Vi al hijo de nombre Rodrigo Quintanilla Fernández.");
    assert.equal(byName.text, "Vi al hijo.");

    const whose = redact("El hijo del vecino, su nombre es Rodrigo Quintanilla Fernández,");
    assert.equal(whose.text, "El hijo del vecino");

    const bare = redact("Se llama Rodrigo Quintanilla Fernández y falta a clase.");
    assert.equal(/rodrigo|quintanilla|fernández/i.test(bare.text), false);
    assert.match(bare.text, /\[nombre omitido\]/);
  });

  it("labels the adult in the household and the child by the nearest role", () => {
    const adult = redact("La madre Marta Gómez le pega al nene.");
    assert.equal(/marta|gómez/i.test(adult.text), false);
    assert.match(adult.text, /un adulto del hogar/);

    const neighbour = redact("El hijo de la vecina Ana Pérez vive en la calle falsa 123.");
    assert.equal(/ana|pérez|falsa|\b123\b/i.test(neighbour.text), false);
    assert.match(neighbour.text, /el hijo de la vecina/i);
    assert.match(neighbour.text, /en \[domicilio omitido\]/);
  });

  it("replaces dotted and bare initials and keeps the age", () => {
    for (const source of ["M.G. tiene 8 años", "M. G. tiene 8 años", "MG tiene 8 años"]) {
      const { text, redactions } = redact(source);
      assert.equal(/M\.?\s*G/i.test(text), false, source);
      assert.equal(text, "[nombre omitido] tiene 8 años");
      assert.ok(redactions.some((item) => item.kind === "nombre"));
      assert.equal(redactions.some((item) => item.kind === "telefono"), false);
    }

    const beside = redact("La alumna M.G. tiene 8 años.");
    assert.equal(/M\.?\s*G/i.test(beside.text), false);
    assert.match(beside.text, /alumna tiene 8 años/i);

    const spaced = redact("la alumna M. G. me contó");
    assert.equal(/M\.?\s*G/i.test(spaced.text), false);
    assert.match(spaced.text, /alumna me contó/i);

    const object = redact("Vi a MG en el patio.");
    assert.equal(object.text, "Vi a [nombre omitido] en el patio.");
    assert.equal(redact("grado II").text, "grado II");
  });

  it("drops a que-se-llama clause instead of leaving a placeholder", () => {
    const { text, redactions } = redact("una alumna que se llama Lucía Fernández me contó");
    assert.equal(/lucía|lucia|fernández|fernandez/i.test(text), false);
    assert.equal(text, "una alumna me contó");
    assert.ok(redactions.some((item) => item.kind === "nombre" && item.replacement === "[nombre omitido]"));
  });

  it("redacts Argentine phones without eating ages or dates", () => {
    for (const phone of ["351-555-0199", "3515550199", "(0351) 555-0199"]) {
      const { text, redactions } = redact(`Me avisó al ${phone} hoy.`);
      assert.equal(text.includes("351"), false, phone);
      assert.equal(text.includes("0199"), false, phone);
      assert.equal(/\(\s*0?351/.test(text), false, phone);
      assert.ok(redactions.some((item) => item.kind === "telefono"), phone);
    }

    const dated = redact("Tiene 8 años y también 12 años. La reunión fue el 12-03-2018 y el 12/03/2019.");
    assert.match(dated.text, /8 años/);
    assert.match(dated.text, /12 años/);
    assert.equal(dated.redactions.some((item) => item.kind === "telefono"), false);
    assert.ok(dated.redactions.filter((item) => item.kind === "fecha").length >= 2);
    assert.equal(/12-03-2018|12\/03\/2019/.test(dated.text), false);
  });
});

describe("severity", () => {
  it("rates physical violence at urgent and routes it to the protection authority", () => {
    for (const line of ["le pegó en el brazo", "lo golpeó", "la lastimó", "tiene moretones"]) {
      const signals = scan(line);
      assert.equal(signals.physical, true, line);
      assert.equal(signals.severity, "urgente", line);
    }
    assert.equal(scan("le habló en el recreo y tiene 8 años").severity, "acompanamiento");

    const route = buildRoute(scan("le pegó en el brazo"), "cordoba", false);
    assert.equal(route.formalComplaintRequired, true);
    assert.match(route.provinceLabel, /Córdoba/);
    assert.match(route.authority, /Córdoba/);
  });
});

describe("provinces", () => {
  it("accepts slugs and case or accent variants", () => {
    assert.equal(normalizeProvince("buenos-aires"), "Buenos Aires");
    assert.equal(normalizeProvince("buenos aires"), "Buenos Aires");
    assert.equal(normalizeProvince("Tucumán"), "Tucumán");
    assert.equal(normalizeProvince("tucuman"), "Tucumán");
    assert.equal(normalizeProvince("cordoba"), "Córdoba");
    assert.equal(normalizeProvince("jujuy"), "Jujuy");
    assert.equal(normalizeProvince(""), "");
    assert.equal(normalizeProvince("atlantis"), "");

    const buenos = describeJurisdiction("buenos-aires");
    assert.equal(buenos.label, "Argentina · Buenos Aires");
    assert.match(buenos.authority, /Servicio Local/);

    const tucuman = describeJurisdiction("tucuman");
    assert.equal(tucuman.label, "Argentina · Tucumán");
    assert.match(tucuman.authority, /Tucumán/);
    assert.equal(/directorio oficial/i.test(tucuman.note), false);

    assert.equal(describeJurisdiction("").label, "Argentina");
  });
});

describe("whoAtRisk", () => {
  it("reads a neighbour's son from the narrative instead of defaulting to a student", () => {
    assert.equal(whoAtRisk(scan(NEIGHBOUR).childHint), "el hijo de una vecina");
    assert.notEqual(whoAtRisk(scan(NEIGHBOUR).childHint), "un alumno");
  });

  it("keeps an explicit student and falls back when the relationship is unclear", () => {
    const student = "Hoy una alumna de segundo grado me dijo que en su casa le pegan.";
    assert.equal(whoAtRisk(scan(student).childHint), "una alumna");
    assert.equal(whoAtRisk(scan("Vi una situación que me preocupa y no sé cómo seguir.").childHint), "un niño o niña");
  });
});
