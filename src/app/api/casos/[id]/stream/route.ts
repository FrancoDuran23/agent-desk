import { publicCase } from "@/lib/store";

export const dynamic = "force-dynamic";

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!ID.test(id)) {
    return Response.json({ error: "No encontramos ese caso." }, { status: 404 });
  }
  const existing = await publicCase(id);
  if (!existing) {
    return Response.json({ error: "No encontramos ese caso." }, { status: 404 });
  }

  const encoder = new TextEncoder();
  const signal = request.signal;
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };
      controller.enqueue(encoder.encode(`: ${"ok".repeat(160)}\n\n`));
      try {
        for (let tick = 0; tick < 28 && !signal.aborted; tick += 1) {
          const current = await publicCase(id);
          if (!current) {
            send({ type: "missing" });
            break;
          }
          send({ type: "case", case: current });
          if (current.done) break;
          await delay(420, signal);
        }
      } catch {
        // The client went away.
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
    cancel() {
      // request.signal already aborts the wait.
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}
