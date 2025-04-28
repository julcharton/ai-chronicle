/**
 * Prompt versioning utility
 * This enables tracking and management of prompt versions over time.
 */

import { MEMORY_PROMPTS_VERSION } from './memory-prompts';

/**
 * Prompt version history interface
 */
interface PromptVersion {
  version: string;
  lastUpdated: string;
  releaseNotes: string;
  author?: string;
}

/**
 * Prompt category interface
 */
interface PromptCategory {
  name: string;
  description: string;
  versions: PromptVersion[];
  currentVersion: string;
}

/**
 * Collection of prompt version histories
 */
export const promptVersions: Record<string, PromptCategory> = {
  memoryPrompts: {
    name: 'Memory Prompts',
    description: 'Templates for memory capture guidance',
    versions: [MEMORY_PROMPTS_VERSION],
    currentVersion: MEMORY_PROMPTS_VERSION.version,
  },
  // Add other prompt categories here as needed
};

/**
 * Get version history for a prompt category
 * @param category Prompt category name
 * @returns Version history for the category, or undefined if not found
 */
export function getVersionHistory(
  category: string,
): PromptVersion[] | undefined {
  return promptVersions[category]?.versions;
}

/**
 * Get the current version of a prompt category
 * @param category Prompt category name
 * @returns Current version string, or undefined if category not found
 */
export function getCurrentVersion(category: string): string | undefined {
  return promptVersions[category]?.currentVersion;
}

/**
 * Add a new version to the history
 * @param category Prompt category name
 * @param version Version information
 */
export function addVersionToHistory(
  category: string,
  version: PromptVersion,
): void {
  if (!promptVersions[category]) {
    throw new Error(`Prompt category "${category}" not found`);
  }

  promptVersions[category].versions.push(version);
  promptVersions[category].currentVersion = version.version;
}

/**
 * Log prompt usage for analytics
 * @param category Prompt category
 * @param version Version used
 * @param metadata Additional usage metadata
 */
export function logPromptUsage(
  category: string,
  version: string,
  metadata: Record<string, any> = {},
): void {
  // This would typically send data to an analytics service
  // For now, just log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`Prompt usage: ${category} v${version}`, metadata);
  }
}

/**
 * Test if a prompt version has specific features
 * This can be used to conditionally enable features based on prompt version
 * @param category Prompt category
 * @param minVersion Minimum version required
 * @returns Whether the current version meets the minimum requirement
 */
export function hasPromptFeature(
  category: string,
  minVersion: string,
): boolean {
  const currentVersion = getCurrentVersion(category);
  if (!currentVersion) return false;

  // Simple version comparison (assumes semantic versioning)
  const current = currentVersion.split('.').map(Number);
  const required = minVersion.split('.').map(Number);

  for (let i = 0; i < Math.max(current.length, required.length); i++) {
    const a = current[i] || 0;
    const b = required[i] || 0;
    if (a > b) return true;
    if (a < b) return false;
  }

  return true; // Versions are equal
}

/**
 * Register a new prompt category
 * @param categoryKey Key for the category
 * @param category Category information
 */
export function registerPromptCategory(
  categoryKey: string,
  category: PromptCategory,
): void {
  promptVersions[categoryKey] = category;
}
