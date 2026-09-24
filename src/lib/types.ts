export type AgentId = "ansioso" | "dramatica" | "tryhard" | "meme" | "casero" | "vos";

export type FieldType =
  | "PlainText"
  | "RichText"
  | "Image"
  | "Number"
  | "DateTime"
  | "Switch"
  | "Link"
  | "Option"
  | "Email";

export interface WfField {
  slug: string;
  displayName: string;
  type: FieldType;
  helpText: string;
  required?: boolean;
  options?: string[];
}

export interface WfItem {
  name: string;
  slug: string;
  fieldData: Record<string, string | number | boolean>;
}

export interface WfCollection {
  slug: string;
  displayName: string;
  singularName: string;
  fields: WfField[];
  items: WfItem[];
  cuts: { slug: string; displayName: string; type: FieldType; by: AgentId }[];
}

export interface WfElement {
  id: string;
  type:
    | "Section"
    | "Container"
    | "Heading"
    | "Paragraph"
    | "Button"
    | "CollectionList"
    | "Navbar"
    | "Image"
    | "RichText"
    | "Block";
  name: string;
  className: string;
  text?: string;
  tag?: string;
  binding?: string;
  variant?: "hero" | "agenda" | "people" | "faq" | "cta" | "chaos" | "generic" | "nav";
  owner?: AgentId;
  status?: "sketch" | "fought" | "locked";
  children?: WfElement[];
}

export interface WfPage {
  id: string;
  title: string;
  slug: string;
  seo: { title: string; description: string };
  openGraph: { title: string; description: string };
  elements: WfElement[];
}

export interface WfComponent {
  name: string;
  group: string;
  description: string;
  props: { name: string; type: "text" | "richText" | "link" | "image" | "boolean" }[];
}

export interface WfAsset {
  name: string;
  folder: string;
  alt: string;
  kind: "image";
}

export interface WfVariable {
  name: string;
  type: "color";
  value: string;
}

export interface Canvas {
  siteName: string;
  pages: WfPage[];
  collections: WfCollection[];
  components: WfComponent[];
  assets: WfAsset[];
  variables: WfVariable[];
}

export interface SectionPlan {
  id: string;
  name: string;
  className: string;
  variant: NonNullable<WfElement["variant"]>;
  heading: string;
  body: string;
  cta?: string;
  owner: AgentId;
  binding?: string;
  people?: { name: string; role: string }[];
  faqs?: { q: string; a: string }[];
}

export interface SeasonDraft {
  template: "evento" | "producto";
  shipName: string;
  poeticName: string;
  memeName: string;
  slugTitle: string;
  pageSlug: string;
  thesis: string;
  twist: string;
  vibe: string;
  bland: { headline: string; body: string; cta: string };
  good: { headline: string; body: string; cta: string };
  collection: WfCollection;
  bloatedFields: WfField[];
  sections: SectionPlan[];
  components: WfComponent[];
  assets: WfAsset[];
  variables: WfVariable[];
  roast: string;
}

export interface ShowPatch {
  siteName?: string;
  slug?: string;
  seoTitle?: string;
  seoDescription?: string;
  upsertElements?: WfElement[];
  removeElementIds?: string[];
  upsertCollections?: WfCollection[];
  cutField?: { collectionSlug: string; fieldSlug: string };
  upsertComponents?: WfComponent[];
  upsertAssets?: WfAsset[];
  upsertVariables?: WfVariable[];
  lockAll?: boolean;
}

export interface BeatBase {
  id: string;
  delay: number;
  dropMs?: number;
  highlight?: boolean;
}

export interface HumanPrompt {
  id: string;
  kind: "salvar";
  title: string;
  body: string;
}

export type Beat =
  | (BeatBase & { kind: "chat"; agent: AgentId; text: string })
  | (BeatBase & { kind: "confession"; agent: AgentId; text: string })
  | (BeatBase & { kind: "aside"; text: string })
  | (BeatBase & { kind: "round"; title: string; subtitle: string })
  | (BeatBase & {
      kind: "vote";
      topic: string;
      tally: { agent: AgentId; choice: string }[];
      winner: string;
    })
  | (BeatBase & {
      kind: "canvas";
      agent: AgentId;
      caption: string;
      patch: ShowPatch;
      focusId?: string;
      skipIfCopyLocked?: boolean;
    })
  | (BeatBase & { kind: "human"; prompt: HumanPrompt })
  | (BeatBase & { kind: "finale"; verdict: "sobreviven" | "desalojo"; line: string });

export type McpTool =
  | "data_sites_tool"
  | "data_cms_tool"
  | "data_pages_tool"
  | "data_assets_tool"
  | "data_component_tool"
  | "data_element_tool"
  | "data_variable_tool";

export type OpStatus = "proposed" | "vetoed" | "kept" | "dry-run" | "applied" | "error" | "mcp-only";

export interface DataApiCall {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
}

export interface FightOp {
  id: string;
  tool: McpTool;
  action: string;
  agent: AgentId;
  status: OpStatus;
  summary: string;
  execution: "data-api" | "mcp-only";
  arguments: Record<string, unknown>;
  dataApi?: DataApiCall;
  slug?: string;
}

export interface PublishCallResult {
  method: string;
  path: string;
  ok: boolean;
  status: number;
  note: string;
  body?: unknown;
  response?: unknown;
}

export interface PublishResult {
  at: number;
  mode: "dry-run" | "live";
  note: string;
  calls: PublishCallResult[];
  collectionId?: string;
  itemIds?: string[];
}

export interface Run {
  id: string;
  goal: string;
  mode: "simulacro" | "en-vivo";
  modeNote: string;
  status: "live" | "finale" | "evicted";
  createdAt: number;
  updatedAt: number;
  timerMs: number;
  paused: boolean;
  pace: "normal" | "rapido";
  revealedCount: number;
  beats: Beat[];
  canvas: Canvas;
  draft: SeasonDraft;
  awaiting: HumanPrompt | null;
  handledPromptIds: string[];
  locks: { name: boolean; copy: boolean };
  ops: FightOp[];
  highlight: { id: string; agent: AgentId | "casa"; text: string }[];
  round: { title: string; subtitle: string } | null;
  publishResult?: PublishResult;
  opSeq: number;
}

export type Intervention =
  | { type: "salvar"; agent: "ansioso" | "dramatica" | "tryhard" | "meme" }
  | { type: "vetar"; note?: string }
  | { type: "caos" }
  | { type: "timeout" }
  | { type: "pausar" }
  | { type: "seguir" }
  | { type: "pace"; pace: "normal" | "rapido" };

export interface PersistenceInfo {
  driver: "d1+kv+r2" | "d1" | "kv" | "memory";
  bindings: { db: boolean; kv: boolean; media: boolean };
  bindingNames: string[];
  beats: number;
  votes: number;
  ops: number;
  note: string;
}

export interface PublicRun {
  id: string;
  goal: string;
  mode: Run["mode"];
  modeNote: string;
  status: Run["status"];
  timerMs: number;
  paused: boolean;
  pace: Run["pace"];
  revealed: Beat[];
  totalBeats: number;
  canvas: Canvas;
  awaiting: HumanPrompt | null;
  highlight: Run["highlight"];
  fightLog: FightOp[];
  playbook: FightOp[];
  persistence: PersistenceInfo;
  round: Run["round"];
  publishResult?: PublishResult;
  webflow: { configured: boolean; hasPage: boolean; hasCollection: boolean };
  updatedAt: number;
}
