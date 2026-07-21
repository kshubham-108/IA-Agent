import type { AgentClient } from "./agent-client";
import type { EstimateRequest, EstimateResult } from "./types";

/**
 * Live Eve agent API channel client.
 * Calls the deployed Eve agent HTTP endpoint when AGENT_API_URL is set.
 */
export class LiveAgentClient implements AgentClient {
  constructor(private readonly baseUrl: string) {}

  async estimate(request: EstimateRequest): Promise<EstimateResult> {
    const response = await fetch(`${this.baseUrl}/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Agent estimate failed (${response.status}): ${text}`);
    }

    return response.json() as Promise<EstimateResult>;
  }

  async answerGaps(
    request: EstimateRequest & {
      sessionId: string;
      gapAnswers: Record<string, string>;
    },
  ): Promise<EstimateResult> {
    const response = await fetch(`${this.baseUrl}/gap-answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Agent gap-answer failed (${response.status}): ${text}`);
    }

    return response.json() as Promise<EstimateResult>;
  }
}
