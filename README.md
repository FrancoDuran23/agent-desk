# Casa de agentes

[![Deploy to Webflow](https://webflow.com/img/deploy-dark.svg)](https://webflow.com/dashboard/cloud/deploy?repo=https://github.com/FrancoDuran23/agent-desk/tree/cursor/casa-de-agentes-abaa)

Un reality / sitcom para el **Webflow Cloud × Nerdearla 2026 App Challenge**.

Cuatro roommates tienen que dejar un sitio Webflow listo antes de que el casero los desaloje. El usuario no es el jefe del crew: es la producción. Puede salvar a alguien, vetar una frase o tirar una bomba de caos. El living de la casa **es** el canvas de Webflow — páginas, secciones, clases, Collection Lists, campos, componentes, assets y variables — y se mueve mientras discuten.

## Para quien evalúa desde Webflow

Usamos la superficie de la plataforma, no un JSON genérico disfrazado:

| Pieza | Qué hace acá |
| --- | --- |
| **Webflow Cloud** | App Next.js 16 lista para GitHub → Cloud. `webflow.json`, `open-next.config.ts`, `wrangler.json`. Sin `basePath` hardcodeado: el mount path lo inyecta Cloud (`COSMIC_MOUNT_PATH`). |
| **Bindings** | **D1 `DB`**: temporada, chat, confesionario, votos y operaciones MCP. **KV `HOUSE`**: snapshot caliente y lock del vivo. **R2 `MEDIA`**: brief, Webflow JSON, playbook y highlights. |
| **Data API v2** | Publisher real: `GET /v2/sites/:id`, `POST /v2/sites/:id/collections`, ítems bulk (con fallback de a uno), `POST .../items/publish`, `POST /v2/pages/:id` para SEO y Open Graph. |
| **MCP v2.1** | El Tryhard emite operaciones con los nombres actuales: `data_cms_tool`, `data_pages_tool`, `data_assets_tool`, `data_component_tool`, `data_element_tool`, `data_variable_tool`. Lo que el Data API puede hacer, se ejecuta. El resto queda como playbook para un agente conectado a `https://mcp.webflow.com/mcp`. |
| **Dry-run** | Sin `WEBFLOW_TOKEN` + `WEBFLOW_SITE_ID` igual se ven los payloads. No inventamos un 200. |

`npm run dev` usa los bindings locales que expone `@opennextjs/cloudflare` (D1, KV y R2). `GET /api/bindings` lo muestra. Si ese runtime no está, la casa sigue en memoria y lo dice en pantalla. `npm run dev:cf` es el preview sobre el runtime de Workers.

## La casa

| Roommate | Quiere |
| --- | --- |
| **Mateo, El Ansioso** | Cerrar y shippear ya. |
| **Lola, La Dramática** | Nombre con arco, plot twist, stakes. |
| **Facu, El Tryhard** | CMS, campos, componentes, clases. Habla en operaciones MCP. |
| **Cami, El Meme** | Matar el slop corporativo. Tacha campos. |
| **Don Hugo, El Casero** | El timer. Si suena, hay desalojo — con el JSON que hayan alcanzado. |

La producción (vos) puede:

- **Salvar** a un roommate cuando el nombre está en empate.
- **Vetar** una frase.
- **Tirar una bomba de caos** (sección nueva, campo Switch, el reloj corre).
- Pausar o adelantar la temporada.

Al final: brief, copy, estructura Webflow, playbook MCP, log de la pelea, highlight reel y publish opcional.

Sin `OPENAI_API_KEY` la temporada es un **simulacro** escrito por la casa (español rioplatense, igual de completo). Con key, el modelo solo condimenta nombres y copy; la mecánica la sigue manejando la casa. Si la API falla, cae a simulacro y lo etiqueta.

## Demo en 30 segundos

1. Abrí la app y entrá con un objetivo (o uno de los chips).
2. Mirá el pasillo y el canvas: el nombre se pelea, aparece una tarea para salvar a alguien.
3. Alguien tacha copy o campos. El Navigator y la página cambian.
4. En Entrega: dry-run de la Data API, descarga del playbook, highlight reel.

## Correr en local

```bash
npm install
npm run dev
```

Abrí `http://localhost:3000`.

Para emular D1, KV y R2 como en Cloud:

```bash
npm run db:setup
npm run dev:cf
```

`db:setup` aplica `drizzle/0001_casa.sql`. El runtime también hace `CREATE TABLE IF NOT EXISTS`, por si la migración todavía no corrió.

## Deploy a Webflow Cloud

El botón de arriba abre el wizard con este repo y esta rama. También se puede hacer a mano:

1. En Webflow: **Create app** / **Apps → Webflow Cloud → Create new app**.
2. Importá el repo de GitHub y esta rama (`cursor/casa-de-agentes-abaa`, o `main` cuando esté mergeada).
3. Elegí un mount path, por ejemplo `/casa`. No hace falta tocar `basePath` en `next.config.ts`: Cloud lo pisa con el mount path.
4. Variables de entorno (todas opcionales salvo que quieras LLM o publish real):

| Variable | Para qué |
| --- | --- |
| `OPENAI_API_KEY` | Condimenta copy. Sin ella: simulacro. |
| `OPENAI_BASE_URL` | Default `https://api.openai.com/v1`. |
| `OPENAI_MODEL` | Default `gpt-4o-mini`. |
| `WEBFLOW_TOKEN` | Site token. Scopes: `sites:read`, `cms:write`, `pages:write`. |
| `WEBFLOW_SITE_ID` | Sitio donde crear la colección. |
| `WEBFLOW_PAGE_ID` | Si está, el publisher actualiza SEO y Open Graph de esa página. |
| `WEBFLOW_COLLECTION_ID` | Si está, no crea colección: lee el schema y manda ítems ahí. |
| `NEXT_PUBLIC_BASE_PATH` | Solo si hace falta forzar el prefijo de `fetch` / SSE. Si Cloud setea `COSMIC_MOUNT_PATH` en el build, `next.config.ts` lo copia solo. |

5. Deploy. Cloud lee `wrangler.json` y aprovisiona `DB`, `HOUSE` y `MEDIA`. Los `database_id` / `id` del archivo son placeholders: en producción Cloud los reemplaza.

El slug de la colección lleva un sufijo de la temporada para no pisar una colección que ya exista.

Node 22. Solo npm.

## Bindings

Declarados en `wrangler.json` y `cloudflare-env.d.ts`:

| Binding | Tipo | Uso |
| --- | --- | --- |
| `DB` | D1 | `runs` (snapshot), `beats` (chat, confesionario, rondas), `votes`, `ops` |
| `HOUSE` | KV | `run:{id}` y `lock:{id}` |
| `MEDIA` | R2 | `runs/{id}/brief.md`, `webflow.json`, `mcp-playbook.json`, `fight-log.json`, `highlights.json`, `copy.json` |

`GET /api/bindings` hace ping (el mismo espíritu que el `binding-status` del starter de Webflow). En local sin Workers responde `local` y la app no se cae.

Si Cloud expone el bucket como `WEBFLOW_CLOUD_MEDIA` en vez de `MEDIA`, el código acepta los dos nombres.

## Playbook MCP

Cada pelea que toca el canvas deja una operación. El playbook final, el que se exporta y el que el Publisher mira, se reconstruye desde el canvas que quedó — no desde los campos que Cami ya tachó.

Tools (MCP v2.1, headless, Data API por debajo):

- `data_sites_tool.get_site`
- `data_cms_tool.create_collection`
- `data_cms_tool.get_collection_details` (si hay `WEBFLOW_COLLECTION_ID`)
- `data_cms_tool.create_collection_items`
- `data_cms_tool.publish_collection_items`
- `data_pages_tool.update_page_settings`
- `data_assets_tool.create_asset_folder` y `update_asset` — playbook, no hay upload de binarios
- `data_component_tool.create_component` — playbook: el Data API público no crea componentes del Designer
- `data_element_tool.set_text` — playbook: el árbol de elementos no se edita por Data API
- `data_variable_tool.create_variable` — playbook

Un agente en Cursor con el [MCP de Webflow](https://developers.webflow.com/mcp/reference/overview) puede tomar `mcp-playbook.json` y ejecutar las operaciones `mcp-only` contra el sitio. El servidor remoto es `https://mcp.webflow.com/mcp`.

## Arquitectura

```
src/lib/draft.ts        objetivo → temporada (evento o producto)
src/lib/season.ts       rondas, chat, votos, confesionario
src/lib/canvas.ts       páginas, elementos, CMS
src/lib/playbook.ts     operaciones MCP + cuerpos Data API
src/lib/engine.ts       avance, salvar / vetar / caos, timer
src/lib/llm.ts          condimento opcional
src/lib/store.ts        D1 + KV + R2, o memoria
src/lib/webflow-api.ts  Publisher
src/app/api/runs        crear, SSE, intervenir, exportar, publicar
src/components          chat, confesionario, canvas, entregables
```

El vivo es SSE (`/api/runs/:id/stream`). Un productor avanza la temporada; otra pestaña solo escucha. El estado se relee después de cada espera, así una intervención no pisa un snapshot viejo.

## Qué no hace

No publica el sitio entero (`/v2/sites/:id/publish` tiene límite de una vez por minuto y es otra decisión). Publica ítems de la colección y, si hay page id, metadata. No sube binarios a Assets. No abre el Designer Bridge: las operaciones de elementos, componentes y variables quedan explícitamente como MCP.
