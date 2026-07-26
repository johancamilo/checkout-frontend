// Runs before the test framework is installed. src/services/api.js reads
// `import.meta.env.VITE_API_URL` (rewritten to `process.env.VITE_API_URL`
// by babel-plugin-transform-vite-meta-env, see babel.config.cjs). The actual
// value doesn't matter for the current test suite — every test that touches
// the API mocks '@/services/checkout.service' entirely — but it needs to be
// defined so the module evaluates without throwing.
process.env.VITE_API_URL = 'http://localhost:3000';
