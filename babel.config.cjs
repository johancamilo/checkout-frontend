module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
  // Vite exposes env vars via `import.meta.env.*` (used in src/services/api.js).
  // Jest compiles everything to CommonJS, which has no `import.meta` — this
  // plugin rewrites `import.meta.env.X` to `process.env.X` before that
  // transform runs, so the file compiles cleanly under Jest without touching
  // the source code itself.
  plugins: ['babel-plugin-transform-vite-meta-env'],
};
