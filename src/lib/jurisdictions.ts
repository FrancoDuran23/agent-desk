export const PROVINCES = [
  "Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Ciudad Autónoma de Buenos Aires",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;

export interface Jurisdiction {
  label: string;
  authority: string;
  note: string;
}

const SPECIFIC: Record<string, Pick<Jurisdiction, "authority" | "note">> = {
  Jujuy: {
    authority: "Secretaría de Niñez, Adolescencia y Familia de Jujuy",
    note: "Es la autoridad de aplicación del sistema provincial de protección integral. También hay oficinas locales de protección de derechos. El nombre del área y la sede cambian: confirmá el canal vigente en el gobierno de Jujuy antes de enviar.",
  },
  "Ciudad Autónoma de Buenos Aires": {
    authority: "Consejo de los Derechos de Niñas, Niños y Adolescentes de la Ciudad",
    note: "Confirmá el circuito vigente del organismo de protección de derechos de la Ciudad.",
  },
  "Buenos Aires": {
    authority: "Servicio Local de Promoción y Protección de Derechos del municipio",
    note: "En la provincia de Buenos Aires el primer nivel suele ser el Servicio Local, con apoyo del Servicio Zonal y del organismo provincial. Confirmá cuál corresponde a la localidad.",
  },
};

function provinceSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("es-AR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const PROVINCE_BY_SLUG = new Map<string, (typeof PROVINCES)[number]>(
  PROVINCES.map((province) => [provinceSlug(province), province]),
);

export function normalizeProvince(value: string): (typeof PROVINCES)[number] | "" {
  if (!value.trim()) return "";
  return PROVINCE_BY_SLUG.get(provinceSlug(value)) ?? "";
}

export function isProvince(value: string): boolean {
  return normalizeProvince(value) !== "";
}

export function describeJurisdiction(province: string): Jurisdiction {
  const canonical = normalizeProvince(province);
  if (!canonical) {
    return {
      label: "Argentina",
      authority: "Autoridad local de protección de derechos de niñas, niños y adolescentes",
      note: "Sin provincia, la referencia queda en la línea 102 y en la autoridad de aplicación de tu localidad. Si sabés la provincia, elegila: el nombre del organismo es más preciso.",
    };
  }
  const specific = SPECIFIC[canonical];
  if (specific) {
    return { label: `Argentina · ${canonical}`, ...specific };
  }
  return {
    label: `Argentina · ${canonical}`,
    authority: `Autoridad de protección de derechos de niñas, niños y adolescentes de ${canonical}`,
    note: `Confirmá en el gobierno de ${canonical} cuál es el área vigente y cómo recibe comunicaciones.`,
  };
}
