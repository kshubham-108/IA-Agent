import { NextResponse } from "next/server";

import { createAgentClient } from "@/lib/agent-client";
import type { EstimateRequest, FlowType } from "@/lib/types";

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

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const flow = formData.get("flow") as FlowType | null;
    const yearRaw = formData.get("year");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!isAcceptedFile(file)) {
      return NextResponse.json(
        { error: "Unsupported file type. Upload pdf, docx, or xlsx." },
        { status: 400 },
      );
    }

    if (flow !== "iia" && flow !== "ia") {
      return NextResponse.json({ error: "Flow must be iia or ia" }, { status: 400 });
    }

    const year = Number(yearRaw);
    if (!Number.isInteger(year)) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const estimateRequest: EstimateRequest = {
      flow,
      year,
      file: {
        name: file.name,
        type: file.type,
        size: file.size,
      },
      fileContentBase64: buffer.toString("base64"),
    };

    const client = createAgentClient();
    const result = await client.estimate(estimateRequest);

    return NextResponse.json({
      ...result,
      agentMode: process.env.AGENT_API_URL ? "live" : "mock",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Estimate failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
