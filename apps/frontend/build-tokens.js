import StyleDictionary from 'style-dictionary';

// Helper: flatten token value to CSS-compatible string
function resolveTokenValue(token) {
  const modes = token.$extensions?.mode || {};
  if (modes.light) return modes.light;

  const value = token.$value;

  // Simple string / number
  if (typeof value === 'string' || typeof value === 'number') return value;

  // Array (shadow arrays)
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
        ].filter(Boolean); // remove empty
        return parts.join(' ');
      })
      .join(', ');
  }

  // Object (e.g., blur)
  if (typeof value === 'object' && value !== null) {
    if (value.blur) return `${value.blur}`;
    return Object.values(value).join(' ');
  }

  return value;
}

// Helper: normalize path for CSS variable name
function normalizePath(path) {
  return path.map((p) => p.toLowerCase().replace(/\s+/g, '-')).join('-');
}

async function buildTokens() {
  // Register format
  StyleDictionary.registerFormat({
    name: 'css/variables-all-tokens',
    format: ({ dictionary }) => {
      const rootVars = [];
      const darkVars = [];

      dictionary.allTokens.forEach((token) => {
        const varName = `--${normalizePath(token.path)}`;
        const modes = token.$extensions?.mode || {};

        // Light / default
        if (modes.light) {
          rootVars.push(`${varName}: ${modes.light};`);
        } else {
          rootVars.push(`${varName}: ${resolveTokenValue(token)};`);
        }

        // Dark
        if (modes.dark) {
          darkVars.push(`${varName}: ${modes.dark};`);
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

  // Create instance
  const myStyleDictionary = new StyleDictionary({
    source: ['design-system/design.tokens.json'],
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

  // Build
  await myStyleDictionary.buildAllPlatforms();
  console.log('✅ All tokens built successfully');
}

buildTokens().catch((err) => {
  console.error('❌ Token build failed');
  console.error(err);
  process.exit(1);
});
