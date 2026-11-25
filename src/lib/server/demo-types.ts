import type { DemoLeadContext } from '../demo-qualification';

export type LeadPhase = 'capture' | 'capture_sent' | 'captured' | 'rename' | 'rename_sent' | 'work_capture' | 'work_capture_sent' | 'ready' | 'review';
export interface Subscriber {
  uuid: string;
  email: string;
  fields: Record<string, unknown>;
  unsubscribedAt: string | null;
  tags: string[];
}
export interface Lead {
  id: string;
  sessionHash: string;
  captureKey: string;
  email: string;
  context: DemoLeadContext;
  phase: LeadPhase;
  createdAt: number;
  operationStartedAt: number;
  nextAttemptAt: number;
  attempts: number;
  preexisting?: boolean;
  baseline?: Subscriber;
  workEmail?: string;
  workKey?: string;
  reason?: string;
  workTarget?: Subscriber | null;
  identityMethod?: 'renamed' | 'separate_contacts';
}
export interface DemoBento {
  find(query: { email: string } | { uuid: string }): Promise<Subscriber | null>;
  capture(lead: Lead): Promise<void>;
  captureWork(lead: Lead): Promise<void>;
  changeEmail(oldEmail: string, newEmail: string): Promise<void>;
}
export interface DemoStore {
  create(lead: Lead): Promise<Lead>;
  get(id: string): Promise<Lead | null>;
  latest(sessionHash: string): Promise<Lead | null>;
  lock(id: string, owner: string, now: number): Promise<Lead | null>;
  save(lead: Lead, owner: string, now: number): Promise<void>;
  unlock(id: string, owner: string): Promise<void>;
  claimEmail(email: string, leadId: string): Promise<boolean>;
  due(now: number, limit: number): Promise<string[]>;
  rateLimit(key: string, limit: number, expiresAt: number): Promise<boolean>;
  pruneRateLimits(now: number): Promise<void>;
}

export const SESSION_SECONDS = 86400;
export const RECONCILE_WINDOW_MS = 24 * 60 * 60 * 1000;
export const CAPTURE_FIELD = 'dd_demo_capture_id';
export const PERSONAL_FIELD = 'original_personal_email';

export class DemoError extends Error {
  constructor(public code: string, public status = 400) { super(code); }
}
