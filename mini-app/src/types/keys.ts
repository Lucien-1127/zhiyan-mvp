import type { ID } from './common';

export interface KeyItem {
  id: ID;
  platform: string;
  label: string;
  prefix: string;
  added_at: string;
  tested: boolean;
  valid: boolean | null;
  last_tested?: string;
  test_result?: { status: string; http_code?: number };
  env_file?: string;
}

export interface AddKeyPayload {
  platform: string;
  label: string;
  key: string;
}

export interface ReplaceKeyPayload {
  id: ID;
  key: string;
  label?: string;
}
