import { LiveAgentClient } from "./agent-client.live";
import { MockAgentClient } from "./agent-client.mock";
import type { EstimateRequest, EstimateResult } from "./types";

export interface AgentClient {
  estimate(request: EstimateRequest): Promise<EstimateResult>;
  answerGaps(
    request: EstimateRequest & {
      sessionId: string;
      gapAnswers: Record<string, string>;
    },
  ): Promise<EstimateResult>;
}

export function createAgentClient(): AgentClient {
  if (process.env.AGENT_API_URL) {
    return new LiveAgentClient(process.env.AGENT_API_URL);
  }
  return new MockAgentClient();
}
