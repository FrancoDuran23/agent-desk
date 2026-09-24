import type { Redaction, RedactionKind } from "./types";

const STOP = new Set([
  "de", "del", "la", "el", "los", "las", "un", "una", "que", "con", "por", "sus", "su", "en", "al", "y", "o",
  "se", "me", "te", "le", "les", "hoy", "ayer", "esta", "este", "esa", "ese", "muy", "más", "mas", "cuando",
  "como", "para", "sin", "sobre", "entre", "hasta", "desde", "donde", "qué", "ya", "no", "sí", "si", "lo",
  "mi", "tu", "es", "son", "está", "están", "dijo", "dice", "contó", "conto", "tiene", "tenía", "tenia",
  "llega", "llegó", "llego", "llora", "lloraba", "grado", "año", "años", "segundo", "tercero", "cuarto",
  "primero", "quinto", "sexto", "séptimo", "septimo", "falta", "casa", "vez", "veces",
]);

const PLACES = [
  "buenos aires",
  "santa fe",
  "san juan",
  "san luis",
  "la rioja",
  "la pampa",
  "río negro",
  "rio negro",
  "tierra del fuego",
  "entre ríos",
  "entre rios",
  "santiago del estero",
  "santa cruz",
  "ciudad autónoma",
  "san salvador",
];

const REASONS: Record<RedactionKind, { label: string; reason: string }> = {
  nombre: {
    label: "Nombre",
    reason:
      "En el aviso preliminar el nombre no circula, ni siquiera en iniciales. Si iba en «se llama», «de nombre» o «llamado», se omite esa frase. Si iba junto al rol, queda el rol.",
  },
  dni: {
    label: "Documento o identificador",
    reason:
      "Un documento o legajo identifica de manera directa. No va en el aviso. Si la autoridad lo pide, se aporta por el canal formal.",
  },
  telefono: {
    label: "Teléfono",
    reason: "Un teléfono puede identificar a una familia. No va en el aviso preliminar.",
  },
  email: {
    label: "Correo",
    reason: "Un correo puede identificar a una persona. No va en el aviso preliminar.",
  },
  direccion: {
    label: "Dirección",
    reason: "Una dirección puede ubicar a una niña o un niño. Se omite en el aviso que se envía.",
  },
  escuela: {
    label: "Escuela",
    reason:
      "El nombre o el número de la escuela, en una localidad chica, alcanza para identificar. En el aviso queda «la institución».",
  },
  fecha: {
    label: "Fecha de nacimiento",
    reason: "Una fecha precisa identifica más de lo que este aviso necesita.",
  },
  detalle: {
    label: "Detalle que no se reproduce",
    reason:
      "Había un pasaje que no corresponde reproducir en un aviso que puede circular. Quedó una descripción general y se sostiene la derivación por el canal formal.",
  },
  otro: {
    label: "Otro dato",
    reason: "Se redujo un dato que no hace falta en el aviso preliminar.",
  },
};

const ROLE_SKIP = new Set(["de", "del", "la", "el", "los", "las", "un", "una", "su", "sus", "mi", "mis", "al", "lado"]);

function labelForRoleWord(word: string): string | null {
  const clean = word.toLocaleLowerCase("es-AR").replace(/^[¿¡"'«»]+|[.,;:!?)"'»]+$/g, "");
  if (/^(?:alumnas?)$/.test(clean)) return "la alumna";
  if (/^(?:alumnos?)$/.test(clean)) return "el alumno";
  if (/^(?:hijas?|niñas?|nenas?)$/.test(clean)) return "la niña";
  if (/^(?:hijos?|niños?|nenes?|menores?)$/.test(clean)) return "el niño";
  if (clean === "vecina" || clean === "vecinas") return "la vecina";
  if (clean === "vecino" || clean === "vecinos") return "el vecino";
  if (/^(?:madre|mamá|mama|madrastra|padre|papá|papa|padrastro|tía|tia|tío|tio|abuela|abuelo)$/.test(clean)) {
    return "un adulto del hogar";
  }
  return null;
}

function roleFromSide(fragment: string, direction: "before" | "after"): string | null {
  const clause =
    direction === "before"
      ? (fragment.split(/[.!?\n]/).pop() ?? fragment).slice(-180)
      : (fragment.split(/[.!?\n]/)[0] ?? "").slice(0, 90);
  const tokens = clause.replace(/[,:;()]+/g, " ").trim().split(/\s+/).filter(Boolean);
  const ordered = direction === "before" ? [...tokens].reverse() : tokens;
  let skipped = 0;
  for (const raw of ordered) {
    if (skipped > 6) break;
    const word = raw.toLocaleLowerCase("es-AR");
    if (ROLE_SKIP.has(word)) {
      skipped += 1;
      continue;
    }
    return labelForRoleWord(word);
  }
  return null;
}

function roleForName(before: string, after: string): string {
  return roleFromSide(before, "before") ?? roleFromSide(after, "after") ?? "una persona";
}

function triggerMatchesLabel(trigger: string, label: string): boolean {
  const word = trigger.toLocaleLowerCase("es-AR");
  if (word === "vecina") return label === "la vecina";
  if (word === "vecino") return label === "el vecino";
  if (/^alumna$/.test(word)) return label === "la alumna";
  if (/^alumno$/.test(word)) return label === "el alumno";
  if (/^(?:hija|niña|nena)$/.test(word)) return label === "la niña";
  if (/^(?:hijo|niño|nene|menor)$/.test(word)) return label === "el niño";
  if (/^(?:madre|mamá|mama|madrastra|padre|papá|papa|padrastro|tía|tia|tío|tio|abuela|abuelo)$/.test(word)) {
    return label === "un adulto del hogar";
  }
  return false;
}

function readName(rest: string, mode: "capital" | "any"): { name: string; length: number } | null {
  let index = 0;
  while (index < rest.length && /[\s,;:]/.test(rest[index] ?? "")) index += 1;
  const kept: string[] = [];
  while (kept.length < 4 && index < rest.length) {
    const word = /^[A-Za-zÁÉÍÓÚáéíóúÑñ'’-]+/.exec(rest.slice(index));
    if (!word) break;
    const clean = word[0];
    if (STOP.has(clean.toLocaleLowerCase("es-AR"))) break;
    const capital = /^[A-ZÁÉÍÓÚÑ]/.test(clean);
    if (!capital && mode === "capital") break;
    kept.push(clean);
    index += clean.length;
    if (kept.length === 4) break;
    const space = /^\s+/.exec(rest.slice(index));
    if (!space) break;
    const next = /^[A-Za-zÁÉÍÓÚáéíóúÑñ'’-]+/.exec(rest.slice(index + space[0].length));
    if (!next || STOP.has(next[0].toLocaleLowerCase("es-AR"))) break;
    if (mode === "capital" && !/^[A-ZÁÉÍÓÚÑ]/.test(next[0])) break;
    index += space[0].length;
  }
  if (!kept.length) return null;
  return { name: kept.join(" "), length: index };
}

function sub(text: string, pattern: RegExp, fn: (match: RegExpMatchArray) => string): string {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const expression = new RegExp(pattern.source, flags);
  let out = "";
  let last = 0;
  for (const match of text.matchAll(expression)) {
    const index = match.index ?? 0;
    out += text.slice(last, index);
    out += fn(match);
    last = index + match[0].length;
  }
  return out + text.slice(last);
}

export function redact(input: string): { text: string; redactions: Redaction[] } {
  const redactions: Redaction[] = [];
  const push = (kind: RedactionKind, replacement: string) => {
    const copy = REASONS[kind];
    redactions.push({
      id: `r${redactions.length + 1}`,
      kind,
      label: copy.label,
      replacement,
      reason: copy.reason,
    });
    return replacement;
  };

  let text = input.normalize("NFC");

  text = sub(text, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, () => push("email", "un correo que se omite"));

  text = sub(
    text,
    /\b(?:dni|documento|doc\.?|cuil|cuit|legajo)\s*[:nº°.\-]?\s*\d[\d.\-]{5,16}\d\b/gi,
    () => push("dni", "un identificador que se omite"),
  );
  text = sub(text, /\b\d{1,2}\.\d{3}\.\d{3}\b/g, () => push("dni", "un identificador que se omite"));
  text = sub(text, /\b\d{2}-\d{7,8}-\d\b/g, () => push("dni", "un identificador que se omite"));

  text = sub(text, /\+\s*54\s*(?:9\s*)?(?:\d[\s().-]*){8,16}\d/g, () => push("telefono", "un teléfono que se omite"));
  text = sub(text, /\b0?\d{2,4}[\s.-]*15[\s.-]*\d{3,4}[\s.-]*\d{4}\b/g, () => push("telefono", "un teléfono que se omite"));
  text = sub(text, /\b0?\d{2,4}\s+\d{4}[\s.-]\d{4}\b/g, () => push("telefono", "un teléfono que se omite"));
  text = redactLoosePhones(text, push);
  text = sub(
    text,
    /\b(?:tel(?:efono|éfono)?|celular|cel\.?|whatsapp|wsp\.?|telefono)\s*[:.]?\s*\+?\d[\d\s().-]{6,20}\d/gi,
    () => push("telefono", "un teléfono que se omite"),
  );

  text = sub(
    text,
    /(?:\b(?:en|por)\s+)?(?:\b(?:la|el|los|las)\s+)?(?:calle|avda\.?|av\.?|avenida|pasaje|pje\.?|barrio|manzana|mz\.?|ruta)\s+[^\d,;\n.]{0,48}\d{1,6}(?:\s*bis)?\b/gi,
    (match) => {
      const lead = /^(?:en|por)\b/i.test(match[0]) ? `${match[0].slice(0, match[0].search(/\s/)).toLowerCase()} ` : "";
      return `${lead}${push("direccion", "[domicilio omitido]")}`;
    },
  );

  text = sub(
    text,
    /\b(?:nacid[oa]\s+el|fecha\s+de\s+nacimiento|fnac\.?)\s*[:.]?\s*\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}/gi,
    () => push("fecha", "una fecha que se omite"),
  );
  text = sub(text, /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{4}\b/g, () => push("fecha", "una fecha que se omite"));

  text = sub(
    text,
    /\b(?:escuela|colegio|jardín(?:\s+de\s+infantes)?|jardin(?:\s+de\s+infantes)?|instituto)(?:\s+(?:primaria|secundaria|especial|técnica|tecnica|inicial|de|del|la|las|los|san|santa))*\s+(?:n[º°.]?\s*|nro\.?\s*|número\s+|numero\s+)?(?:\d{1,4}|[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚáéíóúÑñ0-9'’.-]+(?:\s+[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚáéíóúÑñ0-9'’.-]+){0,3})/gi,
    () => push("escuela", "la institución"),
  );

  text = redactTriggeredNames(text, push);
  text = redactLooseInitials(text, push);
  text = redactCapitalPairs(text, push);
  text = tidyRoles(text);
  text = text.replace(/\b(del|al|el|la)\s+la institución\b/gi, (_match, article: string) => {
    const word = article.toLowerCase();
    if (word === "del") return "de la institución";
    if (word === "al") return "a la institución";
    return "la institución";
  });

  return {
    text: text.replace(/[ \t]{2,}/g, " ").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim(),
    redactions,
  };
}

const PERSON_NOUN =
  /\b(?:alumnas|alumnos|alumna|alumno|estudiantes|estudiante|nenas|nenes|nena|nene|niñas|niños|niña|niño|menores|menor|hijas|hijos|hija|hijo|vecinas|vecinos|vecina|vecino|adolescentes|adolescente|chicas|chicos|chica|chico|compañeras|compañeros|compañera|compañero|madres|madre|padres|padre|mamá|mama|papá|papa)\b/i;

const ROLE_TAIL =
  /(?:\b(?:la|el|una|un|las|los|su|sus)\s+)?(alumnas|alumnos|alumna|alumno|estudiantes|estudiante|nenas|nenes|nena|nene|niñas|niños|niña|niño|menores|menor|hijas|hijos|hija|hijo|vecinas|vecinos|vecina|vecino|madres|madre|padres|padre|mamá|mama|papá|papa)\s+$/i;

const NAME_FOLLOW =
  /^\s*,?\s*(?:tiene|tenía|tenia|dijo|dice|vive|vivía|vivia|llora|lloraba|falta|llegó|llego|llega|contó|conto|vino|está|esta|estaba|iba|va|fue|es|son)\b/i;

const NAME_BEFORE = /\b(?:a|al|de|del|con|para|por)\s+$/i;

const ROMAN = new Set([
  "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX",
]);

const INITIAL_BLOCK = new Set([
  "DNI", "CUIL", "CUIT", "CABA", "AMBA", "ONG", "OK", "SOS", "IVA", "UF", "SA", "SRL", "EEUU", "ONU", "PAMI", "AFIP",
  "AM", "PM", "ES", "EL", "LA", "UN", "SE", "ME", "SU", "YO", "LO", "AL", "NO", "SI", "YA", "HOY",
  ...ROMAN,
]);

function lettersOf(token: string): string {
  return token.normalize("NFD").replace(/\p{M}/gu, "").replace(/[^A-Za-z]/g, "").toUpperCase();
}

function readInitialToken(rest: string): { name: string; length: number } | null {
  let index = 0;
  while (index < rest.length && /[\s,;:]/.test(rest[index] ?? "")) index += 1;
  const slice = rest.slice(index);
  const dotted = /^[A-ZÁÉÍÓÚÑ](?:\.\s*[A-ZÁÉÍÓÚÑ])+\.?/.exec(slice);
  if (dotted && !INITIAL_BLOCK.has(lettersOf(dotted[0]))) {
    return { name: dotted[0], length: index + dotted[0].length };
  }
  const bare = /^[A-ZÁÉÍÓÚÑ]{2,3}(?![A-Za-zÁÉÍÓÚáéíóúÑñ])/.exec(slice);
  if (bare && !INITIAL_BLOCK.has(bare[0]) && !ROMAN.has(bare[0])) {
    return { name: bare[0], length: index + bare[0].length };
  }
  return null;
}

function replacementForInitial(
  before: string,
  after: string,
  push: (kind: RedactionKind, replacement: string) => string,
): string {
  const role = ROLE_TAIL.exec(before);
  if (role?.[1]) {
    push("nombre", labelForRoleWord(role[1]) ?? "[nombre omitido]");
    return "";
  }
  const guessed = roleForName(before, after);
  return push("nombre", guessed === "una persona" ? "[nombre omitido]" : guessed);
}

function redactLooseInitials(text: string, push: (kind: RedactionKind, replacement: string) => string): string {
  const dotted = sub(text, /(?<![A-Za-zÁÉÍÓÚáéíóúÑñ])[A-ZÁÉÍÓÚÑ](?:\.\s*[A-ZÁÉÍÓÚÑ])+\.?/g, (match) => {
    if (INITIAL_BLOCK.has(lettersOf(match[0]))) return match[0];
    const before = (match.input ?? "").slice(0, match.index ?? 0);
    const after = (match.input ?? "").slice((match.index ?? 0) + match[0].length);
    return replacementForInitial(before, after, push);
  });
  return sub(dotted, /(?<![A-Za-zÁÉÍÓÚáéíóúÑñ])[A-ZÁÉÍÓÚÑ]{2,3}(?![A-Za-zÁÉÍÓÚáéíóúÑñ])/g, (match) => {
    const token = match[0];
    if (INITIAL_BLOCK.has(token) || ROMAN.has(token)) return token;
    const before = (match.input ?? "").slice(0, match.index ?? 0);
    const after = (match.input ?? "").slice((match.index ?? 0) + token.length);
    if (!ROLE_TAIL.test(before) && !NAME_FOLLOW.test(after) && !NAME_BEFORE.test(before)) return token;
    return replacementForInitial(before, after, push);
  });
}

function isCalendarNumber(raw: string): boolean {
  const compact = raw.replace(/[()\s]/g, "");
  const dmy = /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/.exec(compact);
  if (dmy) {
    const left = Number(dmy[1]);
    const right = Number(dmy[2]);
    if (left >= 1 && left <= 31 && right >= 1 && right <= 12) return true;
  }
  const ymd = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(compact);
  if (ymd) {
    const month = Number(ymd[2]);
    const day = Number(ymd[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) return true;
  }
  return /^(?:19|20)\d{2}-(?:19|20)\d{2}$/.test(compact);
}

function redactLoosePhones(text: string, push: (kind: RedactionKind, replacement: string) => string): string {
  return sub(text, /(?<![\d/])\(?\d(?:[\d\s()-]{0,4}\d){6,14}\)?(?![\d/])/gu, (match) => {
    const raw = match[0];
    const digits = raw.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) return raw;
    if (!/[\s()-]/.test(raw) && digits.length < 10) return raw;
    if (isCalendarNumber(raw)) return raw;
    const before = (match.input ?? "").slice(0, match.index ?? 0);
    const after = (match.input ?? "").slice((match.index ?? 0) + raw.length);
    if (/^\s*años?\b/i.test(after) || /\baños?\s*$/i.test(before)) return raw;
    return push("telefono", "un teléfono que se omite");
  });
}

function redactTriggeredNames(
  text: string,
  push: (kind: RedactionKind, replacement: string) => string,
): string {
  const triggers =
    /\b(?:me llamo|se llama|se llaman|llamad[oa]|de nombre|cuyo nombre es|(?:su|sus|el|la|un|una)\s+nombre es|nombre es|soy)\b|\b(?:alumnos|alumnas|alumno|alumna|estudiantes|estudiante|nenes|nenas|nene|nena|niños|niñas|niño|niña|menores|menor|hijos|hijas|hijo|hija|vecina|vecino|madre|padre|mamá|mama|papá|papa|madrastr[ao]|padrastr[ao]|tía|tia|tío|tio|abuela|abuelo)\b/gi;
  let out = "";
  let cursor = 0;
  while (cursor < text.length) {
    triggers.lastIndex = cursor;
    const match = triggers.exec(text);
    if (!match || match.index < cursor) {
      out += text.slice(cursor);
      break;
    }
    const trigger = match[0];
    const nameStart = match.index + trigger.length;
    const callsName = /me llamo|se llama|se llaman|llamad|de nombre|cuyo nombre|nombre es/i.test(trigger);
    const rest = text.slice(nameStart);
    const found = readInitialToken(rest) ?? readName(rest, callsName ? "any" : "capital");
    if (!found) {
      out += text.slice(cursor, nameStart);
      cursor = nameStart;
      continue;
    }
    const end = nameStart + found.length;
    const label = roleForName(text.slice(0, nameStart), text.slice(end));
    out += text.slice(cursor, match.index);
    if (/^me llamo$/i.test(trigger)) {
      out += `me identifico como ${push("nombre", "quien reporta")}`;
      cursor = end;
    } else if (/^soy$/i.test(trigger)) {
      out += `soy ${push("nombre", "quien reporta")}`;
      cursor = end;
    } else if (callsName) {
      const token = push("nombre", "[nombre omitido]");
      const omitted = omitNamingClause(out, text.slice(end));
      if (omitted) {
        out = omitted.text;
        cursor = end + omitted.skipAfter;
      } else {
        out += token;
        cursor = end;
      }
    } else if (triggerMatchesLabel(trigger, label)) {
      out = out.replace(/(?:\b(?:su|sus|mi|mis|la|el|los|las|una|un)\s+)?$/i, "");
      out += push("nombre", label);
      cursor = end;
    } else {
      out += `${trigger} ${push("nombre", label)}`;
      cursor = end;
    }
  }
  return out;
}

function omitNamingClause(before: string, after: string): { text: string; skipAfter: number } | null {
  let head = before.replace(/[ \t]+$/g, "").replace(/,[ \t]*$/g, "").replace(/[ \t]+$/g, "");
  const que = /^(.*)\s+(?:que|quien|quién)$/i.exec(head);
  if (que && PERSON_NOUN.test(que[1] ?? "")) {
    head = (que[1] ?? "").replace(/[ \t]+$/g, "").replace(/,[ \t]*$/g, "").replace(/[ \t]+$/g, "");
  }
  const last = (head.split(/[.!?\n]/).pop() ?? "").trim().split(/\s+/).pop() ?? "";
  if (/^(?:que|quien|quién|como|porque|cuando|donde|dónde|y|e|o|u|pero|de|a|al|su|sus|el|la|un|una)$/i.test(last)) {
    return null;
  }
  const comma = /^[ \t]*,[ \t]*/.exec(after);
  const skipAfter = comma?.[0].length ?? 0;
  const next = after.slice(skipAfter);
  const nextWords = next.trimStart();
  if (!head.trim() && (!nextWords || /^(?:y|e|o|u|pero|porque|que)\b/i.test(nextWords))) return null;
  const glue = head && /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9¿¡]/.test(next) ? " " : "";
  return { text: `${head}${glue}`, skipAfter };
}

function redactCapitalPairs(
  text: string,
  push: (kind: RedactionKind, replacement: string) => string,
): string {
  return sub(text, /\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ'’-]{2,}(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ'’-]{2,}){1,3}\b/g, (match) => {
    const value = match[0];
    const lower = value.toLocaleLowerCase("es-AR");
    if (PLACES.some((place) => lower === place || lower.startsWith(`${place} `))) return value;
    if (/^(ministerio público|ministerio publico|policía federal|policia federal)$/i.test(lower)) return value;
    if (STOP.has(lower.split(/\s+/)[0] ?? "")) return value;
    const before = (match.input ?? "").slice(0, match.index ?? 0);
    const after = (match.input ?? "").slice((match.index ?? 0) + value.length);
    return push("nombre", roleForName(before, after));
  });
}

function tidyRoles(text: string): string {
  const labels = [
    "el niño",
    "la niña",
    "el alumno",
    "la alumna",
    "la vecina",
    "el vecino",
    "un adulto del hogar",
    "una persona",
    "quien reporta",
  ];
  let out = text;
  for (const label of labels) {
    const repeated = new RegExp(`(?:${label}\\s*,?\\s*){2,}`, "gi");
    out = out.replace(repeated, `${label} `);
  }
  out = out.replace(/\b(la|el)\s+\1\b/gi, "$1");
  return out;
}

const GRAPHIC_SENTENCE =
  /\b(sangre|sangrando|desangr\w*|cuchill\w*|arma de fuego|un arma|dispar\w*|degoll\w*|herida abierta|se desmay\w*|convulsion\w*|convulsión\w*)\b/i;

export function softenGraphic(text: string, redactions: Redaction[]): { text: string; redactions: Redaction[] } {
  const parts = text.split(/(?<=[.!?])\s+|\n+/);
  let changed = false;
  const next = parts.map((part) => {
    if (!part.trim() || !GRAPHIC_SENTENCE.test(part)) return part;
    changed = true;
    return "Se relató una situación de violencia que este aviso no describe.";
  });
  if (!changed) return { text, redactions };
  const copy = REASONS.detalle;
  return {
    text: next.join(" ").replace(/[ ]{2,}/g, " ").trim(),
    redactions: [
      ...redactions,
      {
        id: `r${redactions.length + 1}`,
        kind: "detalle",
        label: copy.label,
        replacement: "descripción general",
        reason: copy.reason,
      },
    ],
  };
}

export const OMITTED_NARRATIVE =
  "El relato refiere una posible vulneración de la integridad de una niña, niño o adolescente. Este aviso no reproduce ese contenido. Corresponde comunicarlo de inmediato al organismo de protección de derechos y hacer la denuncia ante la autoridad competente.";
