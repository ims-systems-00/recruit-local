/** Matches `{{name}}` / `{{ name }}`; keys are word characters and dots. */
const PLACEHOLDER = /\{\{\s*([\w.]+)\s*\}\}/g;

/**
 * Lists the placeholders a prompt body references, deduplicated and in order of
 * first appearance. Used to derive a version's `variables` at write time so the
 * declaration cannot drift from the text.
 */
export const extractPromptVariables = (content: string): string[] => {
  const found = new Set<string>();
  for (const match of content.matchAll(PLACEHOLDER)) {
    found.add(match[1]);
  }
  return [...found];
};

/**
 * Substitutes `{{variable}}` placeholders.
 *
 * A placeholder with no supplied value is left in the text verbatim rather than
 * replaced with an empty string. Blanking it would silently delete an
 * instruction from the prompt and be invisible in the model's output; leaving
 * `{{tenantName}}` sitting there is obvious the first time anyone reads a
 * response.
 */
export const renderPrompt = (content: string, variables?: Record<string, string>): string => {
  if (!variables || Object.keys(variables).length === 0) return content;

  return content.replace(PLACEHOLDER, (placeholder, key: string) =>
    Object.prototype.hasOwnProperty.call(variables, key) ? variables[key] : placeholder
  );
};
