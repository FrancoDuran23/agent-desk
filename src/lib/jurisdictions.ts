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
    note: "Confirmá el circuito vigente. Un protocolo escolar no reemplaza al organismo de protección ni a la denuncia.",
  },
  "Buenos Aires": {
    authority: "Servicio Local de Promoción y Protección de Derechos del municipio",
    note: "En la provincia de Buenos Aires el primer nivel suele ser el Servicio Local, con apoyo del Servicio Zonal y del organismo provincial. Confirmá cuál corresponde a la localidad.",
  },
};

export function isProvince(value: string): boolean {
  return (PROVINCES as readonly string[]).includes(value);
}

export function describeJurisdiction(province: string): Jurisdiction {
  if (!province || !isProvince(province)) {
    return {
      label: "Argentina",
      authority: "Autoridad local de protección de derechos de niñas, niños y adolescentes",
      note: "Sin provincia, la referencia queda en la línea 102 y en la autoridad de aplicación de tu localidad. Si sabés la provincia, elegila: el nombre del organismo es más preciso.",
    };
  }
  const specific = SPECIFIC[province];
  if (specific) {
    return { label: `Argentina · ${province}`, ...specific };
  }
  return {
    label: `Argentina · ${province}`,
    authority: `Autoridad de protección de derechos de niñas, niños y adolescentes de ${province}`,
    note: `Confirmá en el gobierno de ${province} cuál es el área vigente y cómo recibe comunicaciones. Esta ficha no es un directorio oficial.`,
  };
}
