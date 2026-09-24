import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scan, whoAtRisk } from "./assess";
import { redact } from "./redact";

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

  it("labels the adult in the household and the child by the nearest role", () => {
    const adult = redact("La madre Marta Gómez le pega al nene.");
    assert.equal(/marta|gómez/i.test(adult.text), false);
    assert.match(adult.text, /un adulto del hogar/);

    const neighbour = redact("El hijo de la vecina Ana Pérez vive en la calle falsa 123.");
    assert.equal(/ana|pérez|falsa|\b123\b/i.test(neighbour.text), false);
    assert.match(neighbour.text, /el hijo de la vecina/i);
    assert.match(neighbour.text, /en \[domicilio omitido\]/);
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
