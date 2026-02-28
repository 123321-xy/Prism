/**
 * Stream-JSON event parser for Claude Code CLI output.
 * Parses the JSONL stream format emitted by `claude --output-format stream-json`
 */

export type ParsedEvent =
  | { kind: "text_delta"; text: string }
  | { kind: "tool_start"; id: string; name: string }
  | { kind: "tool_input_delta"; id: string; partial: string }
  | { kind: "tool_complete"; id: string; result: string }
  | { kind: "usage"; inputTokens: number; outputTokens: number }
  | { kind: "message_start" }
  | { kind: "message_stop" }
  | { kind: "error"; message: string }
  | { kind: "unknown"; raw: string };

/**
 * Parse a single JSONL line from Claude Code's stream output
 */
export function parseLine(line: string): ParsedEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  try {
    const obj = JSON.parse(trimmed);
    return parseEvent(obj);
  } catch {
    return { kind: "unknown", raw: trimmed };
  }
}

function parseEvent(obj: Record<string, unknown>): ParsedEvent {
  const type = obj.type as string;

  switch (type) {
    case "message_start": {
      const msg = obj.message as { usage?: { input_tokens: number } };
      if (msg?.usage?.input_tokens) {
        return { kind: "usage", inputTokens: msg.usage.input_tokens, outputTokens: 0 };
      }
      return { kind: "message_start" };
    }

    case "content_block_start": {
      const block = obj.content_block as { type: string; id?: string; name?: string };
      if (block?.type === "tool_use" && block.id && block.name) {
        return { kind: "tool_start", id: block.id, name: block.name };
      }
      return { kind: "message_start" };
    }

    case "content_block_delta": {
      const delta = obj.delta as { type: string; text?: string; partial_json?: string };
      if (delta?.type === "text_delta" && delta.text) {
        return { kind: "text_delta", text: delta.text };
      }
      if (delta?.type === "input_json_delta" && delta.partial_json) {
        // Tool input is streamed as partial JSON — we need a tool ID from context
        return { kind: "text_delta", text: "" };
      }
      return { kind: "unknown", raw: JSON.stringify(obj) };
    }

    case "message_delta": {
      const usage = obj.usage as { output_tokens?: number };
      if (usage?.output_tokens) {
        return { kind: "usage", inputTokens: 0, outputTokens: usage.output_tokens };
      }
      return { kind: "unknown", raw: JSON.stringify(obj) };
    }

    case "message_stop":
      return { kind: "message_stop" };

    case "tool_result": {
      const toolUseId = obj.tool_use_id as string;
      const content = Array.isArray(obj.content)
        ? (obj.content as Array<{ text?: string }>).map((c) => c.text ?? "").join("")
        : String(obj.content ?? "");
      return { kind: "tool_complete", id: toolUseId, result: content };
    }

    case "error": {
      return { kind: "error", message: String(obj.error ?? obj.message ?? "Unknown error") };
    }

    default:
      return { kind: "unknown", raw: JSON.stringify(obj) };
  }
}

/**
 * Parse a stream of lines into events
 */
export function* parseStream(text: string): Generator<ParsedEvent> {
  for (const line of text.split("\n")) {
    const event = parseLine(line);
    if (event) yield event;
  }
}

/**
 * Format token count for display
 */
export function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

/**
 * Estimate cost in USD
 */
export function estimateCost(inputTokens: number, outputTokens: number): string {
  const cost = (inputTokens / 1_000_000) * 3.0 + (outputTokens / 1_000_000) * 15.0;
  if (cost < 0.001) return "<$0.001";
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(3)}`;
}
