import type {
  App,
  AppPreview,
  CreateAppInput,
  CreateAppResult,
  StreamEvent,
} from "./types.js";

export interface CodeInClientOptions {
  /** API base, e.g. https://api.codein.dev or http://localhost:8000 */
  baseUrl?: string;
  /** Optional bearer / API key header */
  apiKey?: string;
  fetch?: typeof fetch;
}

export class CodeInError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "CodeInError";
  }
}

export class CodeInClient {
  readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: CodeInClientOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? "http://localhost:8000").replace(/\/$/, "");
    this.apiKey = opts.apiKey;
    this.fetchImpl = opts.fetch ?? fetch;
  }

  private headers(json = true): HeadersInit {
    const h: Record<string, string> = {};
    if (json) h["Content-Type"] = "application/json";
    if (this.apiKey) h.Authorization = `Bearer ${this.apiKey}`;
    return h;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers: { ...this.headers(init?.body != null), ...init?.headers },
    });
    const text = await res.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    if (!res.ok) {
      const msg =
        typeof data === "object" && data && "detail" in data
          ? String((data as { detail: unknown }).detail)
          : `HTTP ${res.status}`;
      throw new CodeInError(msg, res.status, data);
    }
    return data as T;
  }

  /** Dry-run metadata before minting. */
  preview(idea: string, template = "react-tailwind"): Promise<AppPreview> {
    return this.request<AppPreview>("/apps/preview", {
      method: "POST",
      body: JSON.stringify({ idea, template }),
    });
  }

  /** Confirm launch — queues icon → code → pump.fun → deploy. */
  create(input: CreateAppInput): Promise<CreateAppResult> {
    return this.request<CreateAppResult>("/apps/create", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  getApp(id: string): Promise<App> {
    return this.request<App>(`/apps/${id}`);
  }

  listApps(params?: {
    q?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ items: App[]; total: number; page: number; page_size: number }> {
    const sp = new URLSearchParams();
    if (params?.q) sp.set("q", params.q);
    if (params?.page) sp.set("page", String(params.page));
    if (params?.page_size) sp.set("page_size", String(params.page_size));
    const qs = sp.toString();
    return this.request(`/apps${qs ? `?${qs}` : ""}`);
  }

  /**
   * Subscribe to the live SSE build stream.
   * Returns an abort function.
   */
  stream(
    appId: string,
    onEvent: (event: StreamEvent) => void,
    onError?: (err: Error) => void,
  ): () => void {
    const url = `${this.baseUrl}/apps/${appId}/files/stream`;
    const ctrl = new AbortController();

    void (async () => {
      try {
        const res = await this.fetchImpl(url, {
          headers: this.headers(false),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          throw new CodeInError(`stream failed`, res.status);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const chunks = buf.split("\n\n");
          buf = chunks.pop() ?? "";
          for (const chunk of chunks) {
            const dataLine = chunk
              .split("\n")
              .find((l) => l.startsWith("data:"));
            if (!dataLine) continue;
            const raw = dataLine.slice(5).trim();
            if (!raw || raw === "[DONE]") continue;
            try {
              onEvent(JSON.parse(raw) as StreamEvent);
            } catch {
              /* ignore malformed */
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    })();

    return () => ctrl.abort();
  }
}
