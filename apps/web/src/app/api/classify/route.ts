import { mockClassifyStream } from "@/lib/classify-client.mock";
import type { ClassifyStreamEvent } from "@/lib/classify-types";

const ACCEPTED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".xlsx"];

function isAcceptedFile(file: File): boolean {
  if (ACCEPTED_TYPES.has(file.type)) return true;
  const lower = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function encodeEvent(event: ClassifyStreamEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const fileId = String(formData.get("fileId") ?? "unknown");

    if (!(file instanceof File)) {
      return Response.json({ error: "File is required" }, { status: 400 });
    }

    if (!isAcceptedFile(file)) {
      return Response.json(
        { error: "Unsupported file type. Upload pdf, docx, or xlsx." },
        { status: 400 },
      );
    }

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of mockClassifyStream(fileId, file)) {
            if (event.type === "checking") {
              controller.enqueue(
                encodeEvent({ type: "checking", fileId }),
              );
            } else {
              controller.enqueue(
                encodeEvent({
                  type: "classified",
                  fileId,
                  result: event.result,
                }),
              );
            }
          }
          controller.close();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Classification failed";
          controller.enqueue(
            encodeEvent({ type: "error", fileId, message }),
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Classification failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
