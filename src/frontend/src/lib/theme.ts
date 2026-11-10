/**
 * Apply a theme's CSS variable payload to the document root.
 *
 * The backend stores a theme as a raw CSS declaration string, e.g.
 * `--primary: 0.62 0.24 300; --accent: 0.6 0.2 265;`. We parse it into
 * individual custom properties and set them on `document.documentElement`
 * so the whole app re-skins instantly.
 */

const APPLIED_THEME_ATTR = "data-applied-theme";

/** Parse a `--name: value;` declaration string into a property map. */
export function parseThemeVariables(
  cssVariables: string,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const declaration of cssVariables.split(";")) {
    const trimmed = declaration.trim();
    if (!trimmed) continue;
    const separator = trimmed.indexOf(":");
    if (separator === -1) continue;
    const name = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!name.startsWith("--") || !value) continue;
    result[name] = value;
  }
  return result;
}

/** Apply a theme's variables to the document root. */
export function applyThemeVariables(
  themeId: string,
  cssVariables: string,
): void {
  const root = document.documentElement;
  const variables = parseThemeVariables(cssVariables);
  for (const [name, value] of Object.entries(variables)) {
    root.style.setProperty(name, value);
  }
  root.setAttribute(APPLIED_THEME_ATTR, themeId);
}

/** Remove any applied theme overrides, restoring the default palette. */
export function clearThemeVariables(): void {
  const root = document.documentElement;
  const applied = root.getAttribute(APPLIED_THEME_ATTR);
  if (!applied) return;
  root.removeAttribute(APPLIED_THEME_ATTR);
  // Only the variables we set are cleared; the base tokens in index.css remain.
  for (const name of Array.from(root.style)) {
    if (name.startsWith("--")) root.style.removeProperty(name);
  }
}
