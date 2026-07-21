import { NextResponse } from "next/server";

import { createAgentClient } from "@/lib/agent-client";
import type { EstimateRequest, FlowType } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      sessionId?: string;
      flow?: FlowType;
      year?: number;
      file?: EstimateRequest["file"];
      gapAnswers?: Record<string, string>;
    };

    const { sessionId, flow, year, file, gapAnswers } = body;

    if (!sessionId || !file || !gapAnswers || !flow || !year) {
      return NextResponse.json(
        { error: "sessionId, flow, year, file, and gapAnswers are required" },
        { status: 400 },
      );
    }

    if (flow !== "iia" && flow !== "ia") {
      return NextResponse.json({ error: "Flow must be iia or ia" }, { status: 400 });
    }

    const client = createAgentClient();
    const result = await client.answerGaps({
      flow,
      year,
      file,
      sessionId,
      gapAnswers,
    });

    return NextResponse.json({
      ...result,
      agentMode: process.env.AGENT_API_URL ? "live" : "mock",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gap answer failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
