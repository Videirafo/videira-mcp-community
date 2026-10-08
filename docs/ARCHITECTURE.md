# Architecture and trust boundary

PUBLIC (fresh root history):
- Synthetic MCP JSON-RPC stdio server; two read-only tools and typed inputs.
- Tests, allowlist manifest, GitHub-hosted CI without production secrets.
- Four linked methodology ideas; no upstream code vendored.

PRIVATE (not included or connected):
- Real OAuth, GitHub App keys, VPS and root broker.
- Remote devices, data, administrative actions and production releases.

There is NO bridge. This source was independently authored for demonstration and not copied from private Git.

Protocol reference: https://modelcontextprotocol.io/specification/2025-06-18

This sample does not provide authentication, multi-tenant RBAC, hosted HTTP, provider orchestration or deploy authority.
