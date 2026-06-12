// Shared TypeScript types for the PRD skill family's deterministic scripts.

// ---------------------------------------------------------------------------
// .prd.yaml — repo-root routing config (SKILL_DESIGN.md §4.2, §17.9)
// ---------------------------------------------------------------------------

export interface PrdConfigRaw {
  root?: string;
  template?: string;
  read_only?: string[];
}

export interface ResolvedConfig {
  root: string;
  template: TemplateRef;
  read_only: string[];
  defaulted: boolean;
  config_path: string;
  config_present: boolean;
}

export interface TemplateRef {
  scope: "builtin" | "custom";
  name: string;
  version: string | null;
}

// ---------------------------------------------------------------------------
// Template bundle config.yaml (SKILL_DESIGN.md §17.3)
// ---------------------------------------------------------------------------

export interface BundleConfig {
  name: string;
  version: string;
  artifacts: Record<string, ArtifactDecl>;
}

export type ArtifactDecl = SingletonArtifact | PerInstanceArtifact;

export interface SingletonArtifact {
  template: string;
  storage: "singleton";
  path: string;
  description?: string;
}

export interface PerInstanceArtifact {
  template: string;
  storage: "per_instance";
  path_pattern: string;
  description?: string;
  roles?: RoleMap;
  soft_roles?: Record<string, string>;
}

export interface RoleMap {
  problem: string;
  users: string;
  success: string;
  capability: string;
}

// ---------------------------------------------------------------------------
// Proposals (SKILL_DESIGN.md §3, §8)
// ---------------------------------------------------------------------------

export interface ProposalSummary {
  slug: string;
  path: string;
  archived: boolean;
  archived_date: string | null;
  last_touched: string;
  intent_present: boolean;
  tasks_present: boolean;
  research_present: boolean;
  counts: TaskCounts;
}

export interface TaskCounts {
  total: number;
  done: number;
  pending: number;
  superseded: number;
  applied_superseded: number;
  pending_superseded: number;
}

// ---------------------------------------------------------------------------
// Template validation (SKILL_DESIGN.md §17.8)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Corpus listing (SKILL_DESIGN.md §17.4, §4)
// ---------------------------------------------------------------------------

export interface CorpusEntry {
  artifact_id: string;
  storage: "singleton" | "per_instance";
  slug: string | null;
  path: string;
  present: boolean;
  last_touched: string;
}

// ---------------------------------------------------------------------------
// Template validation (SKILL_DESIGN.md §17.8)
// ---------------------------------------------------------------------------

export interface TemplateValidation {
  bundle: string;
  scope: "builtin" | "custom";
  version: string;
  valid: boolean;
  errors: ValidationFinding[];
  warnings: ValidationFinding[];
}

export interface ValidationFinding {
  code: string;
  message: string;
  artifact?: string;
  role?: string;
  section?: string;
}

// ---------------------------------------------------------------------------
// Script result envelope (every script returns this shape as JSON)
// ---------------------------------------------------------------------------

export interface ScriptResult<T> {
  ok: boolean;
  data?: T;
  error?: ScriptError;
}

export interface ScriptError {
  code: string;
  message: string;
  detail?: unknown;
}
