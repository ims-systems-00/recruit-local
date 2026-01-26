import StyleDictionary from 'style-dictionary';

/**
 * Normalize token path to CSS variable name
 * typography.display.sm.weight-base
 * → --typography-display-sm-weight-base
 */
function normalizePath(path) {
  return path.map((p) => p.toLowerCase().replace(/\s+/g, '-')).join('-');
}

/**
 * Strip `px` from font-weight tokens only
 */
function stripPxIfFontWeight(token, value) {
  const pathString = token.path.join('-').toLowerCase();

  const isFontWeight = pathString.includes('weight');

  if (isFontWeight && typeof value === 'string') {
    return value.replace(/px$/, '');
  }

  return value;
}

/**
 * Resolve token value to CSS-compatible string
 */
function resolveTokenValue(token) {
  const modes = token.$extensions?.mode || {};
  let value = token.$value;

  // Prefer light/default mode value if exists
  if (modes.light) {
    value = modes.light;
  }

  // Simple string / number
  if (typeof value === 'string' || typeof value === 'number') {
    return stripPxIfFontWeight(token, value);
  }

  // Array (e.g. box-shadow)
  if (Array.isArray(value)) {
    return value
      .map((v) => {
        if (typeof v === 'string') return v;

        const parts = [
          v.inset ? 'inset' : '',
          v.offsetX || '0px',
          v.offsetY || '0px',
          v.blur || '0px',
          v.spread || '0px',
          v.color || '#000',
        ].filter(Boolean);

        return parts.join(' ');
      })
      .join(', ');
  }

  // Object values
  if (typeof value === 'object' && value !== null) {
    if (value.blur) return `${value.blur}`;
    return Object.values(value).join(' ');
  }

  return value;
}

async function buildTokens() {
  /**
   * Register custom CSS variables format
   */
  StyleDictionary.registerFormat({
    name: 'css/variables-all-tokens',
    format: ({ dictionary }) => {
      const rootVars = [];
      const darkVars = [];

      dictionary.allTokens.forEach((token) => {
        const varName = `--${normalizePath(token.path)}`;
        const modes = token.$extensions?.mode || {};

        // Default / light
        if (modes.light) {
          rootVars.push(
            `${varName}: ${stripPxIfFontWeight(token, modes.light)};`,
          );
        } else {
          rootVars.push(`${varName}: ${resolveTokenValue(token)};`);
        }

        // Dark mode
        if (modes.dark) {
          darkVars.push(
            `${varName}: ${stripPxIfFontWeight(token, modes.dark)};`,
          );
        }
      });

      return `:root {
${rootVars.map((v) => `  ${v}`).join('\n')}
}

.dark {
${darkVars.map((v) => `  ${v}`).join('\n')}
}
`;
    },
  });

  /**
   * Style Dictionary config
   */
  const myStyleDictionary = new StyleDictionary({
    source: ['design-system/final.tokens.json'],
    platforms: {
      css: {
        transformGroup: 'css',
        buildPath: 'design-system/',
        files: [
          {
            destination: 'tokens.css',
            format: 'css/variables-all-tokens',
          },
        ],
      },
    },
  });

  await myStyleDictionary.buildAllPlatforms();
  console.log('✅ All tokens built successfully');
}

buildTokens().catch((err) => {
  console.error('❌ Token build failed');
  console.error(err);
  process.exit(1);
});
