export type AppStatus = "building" | "reviewing" | "shipped" | "failed";

export interface AppPreview {
  idea: string;
  template: string;
  name: string;
  ticker: string;
  description: string;
  icon_prompt: string;
  icon_url?: string | null;
  mock: boolean;
  will_launch_coin: boolean;
  will_generate_code: boolean;
  will_deploy: boolean;
}

export interface CreateAppInput {
  idea: string;
  template?: string;
  owner_wallet?: string | null;
  name?: string;
  ticker?: string;
  description?: string;
}

export interface CreateAppResult {
  id: string;
  name: string;
  ticker: string;
  status: AppStatus;
  status_detail: string;
}

export interface App {
  id: string;
  name: string;
  ticker: string;
  description: string;
  idea: string;
  template: string;
  status: AppStatus;
  status_detail: string;
  icon_url: string | null;
  owner_wallet: string | null;
  pumpfun_signature: string | null;
  pumpfun_mint: string | null;
  vercel_deployment_url: string | null;
  created_at: string;
  updated_at: string;
}

export type StreamEvent =
  | { type: "status"; status: AppStatus; message?: string }
  | { type: "file"; path: string; content?: string }
  | { type: "done"; app: App }
  | { type: "error"; message: string };
