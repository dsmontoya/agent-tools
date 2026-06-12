// Bundle config.yaml loader. Reads a single bundle config and shapes it
// into BundleConfig. Validation rules live in validate-template.ts.

import { join } from "node:path";
import yaml from "js-yaml";
import { fileExists, readTextFile } from "./fs.ts";
import type { BundleConfig } from "./types.ts";

export interface BundleLoadResult {
  bundle_dir: string;
  config_path: string;
  config: BundleConfig | null;
  parse_error: string | null;
}

export function loadBundleConfig(bundleDir: string): BundleLoadResult {
  const configPath = join(bundleDir, "config.yaml");
  if (!fileExists(configPath)) {
    return {
      bundle_dir: bundleDir,
      config_path: configPath,
      config: null,
      parse_error: "config.yaml not found",
    };
  }
  try {
    const parsed = yaml.load(readTextFile(configPath));
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        bundle_dir: bundleDir,
        config_path: configPath,
        config: null,
        parse_error: "config.yaml must be a YAML mapping",
      };
    }
    return {
      bundle_dir: bundleDir,
      config_path: configPath,
      config: parsed as BundleConfig,
      parse_error: null,
    };
  } catch (e) {
    return {
      bundle_dir: bundleDir,
      config_path: configPath,
      config: null,
      parse_error: (e as Error).message,
    };
  }
}
