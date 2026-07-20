// Shared low-level OpenAI chat-completions caller used by every agent and the aggregator.
// This is infrastructure, not doctrine — sharing it doesn't violate the isolation model
// (agents still hold their own API key, doctrine, and route; this just avoids duplicating
// retry/backoff logic identically in 12 places).
//
// Retries on 429 (rate limit) since a full-roster run fires many agents' calls close
// together and can burst past a low-tier TPM cap even though each individual call is
// well within per-request limits.

export interface OpenAIToolSpec {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: unknown;
  };
}

export interface CallOpenAIToolOptions {
  apiKey: string;
  model: string;
  maxCompletionTokens: number;
  messages: { role: "system" | "user"; content: string }[];
  tool: OpenAIToolSpec;
  /** Used only in error messages, e.g. `Agent "weil"` or "Aggregator". */
  callerLabel: string;
  maxRetries?: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterSeconds(bodyText: string, retryAfterHeader: string | null, attempt: number): number {
  if (retryAfterHeader) {
    const fromHeader = Number(retryAfterHeader);
    if (!Number.isNaN(fromHeader) && fromHeader >= 0) return fromHeader;
  }
  const match = bodyText.match(/try again in ([\d.]+)s/i);
  if (match) return parseFloat(match[1]);
  // Fallback exponential backoff if the API didn't tell us how long to wait.
  return Math.min(2 ** attempt, 20);
}

export async function callOpenAITool(opts: CallOpenAIToolOptions): Promise<any> {
  const maxRetries = opts.maxRetries ?? 4;

  for (let attempt = 0; ; attempt++) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${opts.apiKey}`,
      },
      body: JSON.stringify({
        model: opts.model,
        max_completion_tokens: opts.maxCompletionTokens,
        messages: opts.messages,
        tools: [opts.tool],
        tool_choice: { type: "function", function: { name: opts.tool.function.name } },
      }),
    });

    if (response.status === 429 && attempt < maxRetries) {
      const bodyText = await response.text();
      const waitSeconds = parseRetryAfterSeconds(bodyText, response.headers.get("retry-after"), attempt);
      await sleep(waitSeconds * 1000);
      continue;
    }

    if (!response.ok) {
      throw new Error(`${opts.callerLabel} API call failed: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.find(
      (t: any) => t.function?.name === opts.tool.function.name
    );
    if (!toolCall) {
      throw new Error(`${opts.callerLabel} did not return a ${opts.tool.function.name} tool call`);
    }
    try {
      return JSON.parse(toolCall.function.arguments);
    } catch {
      throw new Error(`${opts.callerLabel} returned malformed tool call arguments`);
    }
  }
}
