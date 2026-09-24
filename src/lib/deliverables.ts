import type { PersistenceInfo, PublicRun, Run, WfElement } from "./types";
import { AGENTS } from "./agents";

export function briefMarkdown(pub: PublicRun): string {
  const page = pub.canvas.pages[0];
  const lines = [
    `# ${pub.canvas.siteName}`,
    "",
    `Objetivo de la casa: ${pub.goal}`,
    "",
    pub.canvas.pages[0]?.seo.description ?? "",
    "",
    "## Página",
    "",
    `- Título SEO: ${page?.seo.title ?? "—"}`,
    `- Slug: /${page?.slug ?? ""}`,
    `- Open Graph: ${page?.openGraph.title ?? "—"}`,
    "",
    "## Secciones",
    "",
  ];
  for (const element of page?.elements ?? []) {
    const heading = findText(element, "Heading");
    lines.push(`- **${element.name}** (${element.type}, .${element.className}) — ${heading || element.text || "sin texto"}`);
  }
  lines.push("", "## CMS", "");
  for (const collection of pub.canvas.collections) {
    lines.push(`### ${collection.displayName} (\`${collection.slug}\`)`);
    lines.push("");
    for (const field of collection.fields) {
      lines.push(`- ${field.displayName} — \`${field.type}\` — ${field.helpText}`);
    }
    if (collection.cuts.length) {
      lines.push("");
      lines.push("Tachados en la temporada:");
      for (const cut of collection.cuts) lines.push(`- ~~${cut.displayName}~~ (${cut.type})`);
    }
    lines.push("");
  }
  lines.push("## Highlight reel", "");
  for (const moment of pub.highlight) {
    const who = moment.agent === "casa" ? "La casa" : AGENTS[moment.agent].aka;
    lines.push(`- **${who}:** ${moment.text}`);
  }
  lines.push("", "_Casa de agentes · Reality en vivo_");
  return lines.join("\n");
}

function findText(element: WfElement, type: string): string {
  if (element.type === type && element.text) return element.text;
  for (const child of element.children ?? []) {
    const found = findText(child, type);
    if (found) return found;
  }
  return "";
}

export function webflowDocument(pub: PublicRun, runId: string): unknown {
  return {
    siteName: pub.canvas.siteName,
    pages: pub.canvas.pages,
    collections: pub.canvas.collections,
    components: pub.canvas.components,
    assets: pub.canvas.assets,
    variables: pub.canvas.variables,
    dataApi: pub.playbook.filter((op) => op.execution === "data-api").map((op) => op.dataApi),
    mcpPlaybook: pub.playbook,
    fightLog: pub.fightLog,
    note: `Payloads alineados a Webflow Data API v2 y MCP v2.1. El slug de colección lleva sufijo ${runId.slice(0, 6)} al publicarse para no pisar una colección existente.`,
  };
}

export function artifactFiles(pub: PublicRun): { name: string; contentType: string; body: string }[] {
  return [
    { name: "brief.md", contentType: "text/markdown; charset=utf-8", body: briefMarkdown(pub) },
    {
      name: "webflow.json",
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify(webflowDocument(pub, pub.id), null, 2),
    },
    {
      name: "mcp-playbook.json",
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ mcp: "https://mcp.webflow.com/mcp", version: "2.1", operations: pub.playbook }, null, 2),
    },
    {
      name: "fight-log.json",
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify(pub.fightLog, null, 2),
    },
    {
      name: "highlights.json",
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify(pub.highlight, null, 2),
    },
    {
      name: "copy.json",
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify(copyPack(pub), null, 2),
    },
  ];
}

export function copyPack(pub: PublicRun) {
  const page = pub.canvas.pages[0];
  return {
    siteName: pub.canvas.siteName,
    seo: page?.seo,
    openGraph: page?.openGraph,
    sections: (page?.elements ?? []).map((element) => ({
      name: element.name,
      className: element.className,
      text: collectText(element),
    })),
  };
}

function collectText(element: WfElement): string[] {
  const texts = element.text ? [element.text] : [];
  for (const child of element.children ?? []) texts.push(...collectText(child));
  return texts;
}

export function artifactByName(pub: PublicRun, doc: string): { name: string; contentType: string; body: string } | null {
  const aliases: Record<string, string> = {
    brief: "brief.md",
    webflow: "webflow.json",
    playbook: "mcp-playbook.json",
    fight: "fight-log.json",
    highlights: "highlights.json",
    copy: "copy.json",
  };
  const name = aliases[doc] ?? doc;
  return artifactFiles(pub).find((file) => file.name === name) ?? null;
}

export type { Run, PersistenceInfo };
