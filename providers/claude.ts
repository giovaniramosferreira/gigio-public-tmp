import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import { withRetry, withTimeout } from "./retry";
import {
  ProviderError,
  type LLMGenerateInput,
  type LLMGenerateResult,
  type LLMProvider,
  type ProviderHealth,
} from "./types";

export class ClaudeProvider implements LLMProvider {
  readonly name = "claude";
  readonly capability = "llm" as const;

  private client: Anthropic | null = null;

  isConfigured(): boolean {
    return !!env.ANTHROPIC_API_KEY;
  }

  private getClient(): Anthropic {
    if (!this.client) {
      this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    }
    return this.client;
  }

  async generate(input: LLMGenerateInput): Promise<LLMGenerateResult> {
    if (!this.isConfigured()) {
      throw new ProviderError(
        "PROVIDER_NOT_CONFIGURED",
        "Claude provider is not configured: ANTHROPIC_API_KEY is missing",
      );
    }

    const client = this.getClient();

    const response = await withRetry(() =>
      withTimeout(
        client.messages.create({
          model: env.ANTHROPIC_MODEL,
          max_tokens: input.maxTokens ?? 4096,
          temperature: input.temperature,
          system: input.system,
          messages: input.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        60000,
        "claude.generate",
      ),
    );

    const text = response.content
      .filter(
        (block): block is Extract<typeof block, { type: "text" }> =>
          block.type === "text",
      )
      .map((block) => block.text)
      .join("");

    return {
      text,
      model: response.model,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      raw: response,
    };
  }

  async healthCheck(): Promise<ProviderHealth> {
    const checkedAt = new Date().toISOString();

    if (!this.isConfigured()) {
      return {
        capability: this.capability,
        provider: this.name,
        configured: false,
        healthy: false,
        message: "ANTHROPIC_API_KEY is missing",
        checkedAt,
      };
    }

    try {
      await this.generate({
        messages: [{ role: "user", content: "ping" }],
        maxTokens: 8,
      });
      return {
        capability: this.capability,
        provider: this.name,
        configured: true,
        healthy: true,
        checkedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        capability: this.capability,
        provider: this.name,
        configured: true,
        healthy: false,
        message: error instanceof Error ? error.message : String(error),
        checkedAt: new Date().toISOString(),
      };
    }
  }
}

export const claudeProvider = new ClaudeProvider();
