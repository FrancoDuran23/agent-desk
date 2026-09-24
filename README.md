# Cuidado

Aviso institucional para maestros, directivos, cuidadores y personal escolar que vieron una situación que involucra a una niña, un niño o un adolescente.

Cuidado no investiga, no juzga y no presenta la denuncia. Ordena un borrador preliminar, reduce datos que identifican y muestra qué canal corresponde. Si hay peligro en curso, la llamada va primero: **911** y la **línea 102**.

Esto no es asesoramiento jurídico. No reemplaza la comunicación del artículo 30 de la [Ley 26.061](https://servicios.infoleg.gob.ar/infolegInternet/anexos/110000-114999/110778/norma.htm) ni la denuncia formal cuando corresponde.

## Recorrido

1. La persona describe lo que vio. Puede elegir provincia (Argentina). Si no elige, la ruta queda en la orientación nacional.
2. Cuatro agentes trabajan a la vista, por SSE:
   - **Escucha** ordena hechos, urgencia y quién está en riesgo, en términos de rol.
   - **Privacidad** reduce nombres, DNI, teléfonos, correos, direcciones, fechas y datos de la escuela. Explica qué se redujo y por qué, sin volver a mostrar el dato original.
   - **Ruta** indica escuela, organismo de niñez, denuncia y emergencia según la jurisdicción.
   - **Aviso** redacta el mensaje con la versión reducida y los pasos.
3. La pantalla deja el aviso, el registro de reducciones, la urgencia y un cartel fijo: esto no reemplaza al 911, a la línea 102 ni a la denuncia.

Enviar el relato en la app no avisa a ninguna autoridad.

## Privacidad

- El relato original no se escribe en D1, KV ni R2. Se guarda la versión reducida.
- La sesión del caso vive en KV (`session:{id}`, binding `HOUSE`).
- El caso durable vive en D1 (`DB`): snapshot reducido, reducciones y pasos.
- Si se adjunta un archivo, no se sube. En R2 (`MEDIA`) solo quedan tipo, tamaño y extensión.
- Si el relato no se puede reproducir, no se envía a un modelo externo.
- Con `OPENAI_API_KEY`, el modelo solo ve texto ya reducido y no puede bajar la urgencia. Si no hay clave, el recorrido es un **simulacro** etiquetado: las mismas reglas locales, sin modelo.
- La interfaz no escribe el relato en la consola del navegador.

## Correr en local

```bash
npm install
npm run dev
```

Abrí `http://localhost:3000`.

Para emular D1, KV y R2:

```bash
npm run db:setup
npm run dev:cf
```

`GET /api/bindings` muestra si los bindings responden. Sin el runtime de Workers, el caso queda en memoria y la pantalla lo dice.

## Variables

Copiá `.env.example` a `.env.local` si hace falta. No commitees secretos.

| Variable | Para qué |
| --- | --- |
| `OPENAI_API_KEY` | Opcional. Sin ella, simulacro. |
| `OPENAI_BASE_URL` | Default `https://api.openai.com/v1`. |
| `OPENAI_MODEL` | Default `gpt-4o-mini`. |
| `NEXT_PUBLIC_BASE_PATH` | Solo si hace falta forzar el prefijo de `fetch` y SSE. Si Cloud setea `COSMIC_MOUNT_PATH` en el build, `next.config.ts` lo copia. |

## Deploy a Webflow Cloud

La app es Next.js con OpenNext. `webflow.json` ya tiene el framework y los ids de la app. No hardcodeamos `basePath`: Cloud lo inyecta con el mount path.

`wrangler.json` declara:

| Binding | Tipo | Uso |
| --- | --- | --- |
| `DB` | D1 | Caso reducido |
| `HOUSE` | KV | Sesión del caso |
| `MEDIA` | R2 | Metadatos de adjunto |

Los ids del archivo son placeholders. En Cloud la plataforma los reemplaza. El nombre `HOUSE` se mantiene para que el namespace ya aprovisionado siga mapeando.

Node 22. Solo npm.

## Build

```bash
npm run build
```
