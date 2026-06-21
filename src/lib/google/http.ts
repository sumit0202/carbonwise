/**
 * Shared HTTP helper for Google clients.
 *
 * Every external call goes through here so they all share the same timeout
 * (via AbortController), error normalization and JSON parsing. URLs are always
 * hardcoded constants in the calling client — never built from user input.
 */

import { REQUEST_TIMEOUT_MS } from "@/lib/google/config";
import { GoogleApiError, normalizeError, safeMessage } from "@/lib/google/errors";

export interface FetchJsonOptions {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
}

export async function fetchJson<T>(
  url: string,
  options: FetchJsonOptions = {},
): Promise<T> {
  const { method = "GET", headers = {}, body, timeoutMs = REQUEST_TIMEOUT_MS } =
    options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!response.ok) {
      throw new GoogleApiError("upstream", safeMessage("upstream"), 502);
    }

    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(timer);
    throw normalizeError(error);
  }
}
