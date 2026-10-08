# Videira MCP Community — source-available preview

An educational, offline, read-only MCP server. This is NOT the operational Videira MCP. It cannot access production, credentials, remote devices, paid providers, tenant data or GitHub write operations.

Premium showcase: https://videirafo.github.io/videira-mcp-showcase/

## Local demonstration (Node 22+)

Run npm test and node src/server.mjs. The stdio server expects newline-delimited JSON-RPC. Example tools/call JSON:

    {"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"videira_example_plan","arguments":{"kind":"security"}}}

Tools: videira_example_capabilities and videira_example_plan. Supported kinds: research, design, code, security. Results remain SIMULATED_ONLY, productionReady=false, providerCalls=0.

## Four public methodologies

- https://github.com/obra/superpowers — tests and review.
- https://github.com/multica-ai/andrej-karpathy-skills — minimal changes and assumptions.
- https://github.com/ayghri/i-have-adhd — concrete next actions.
- https://github.com/nyldn/claude-octopus — disagreement and human review.

These are conceptual references only. No upstream source is copied.

## Security boundary

Zero runtime dependencies, no network, shell, hardware, storage, credentials or production OAuth. Hosted CI only. No private operational Git history or code. This educational sample is not a production service.

Read SECURITY.md, docs/ARCHITECTURE.md, and LICENSE. Source-available for evaluation, NOT an OSI-approved open-source distribution. Videira branding and the operational server remain protected.
