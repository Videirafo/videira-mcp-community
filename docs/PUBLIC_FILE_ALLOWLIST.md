# Source-first public file manifest

The original source was created for this sample, not forked, mirrored or copied from the private Videira MCP repository.

manifest/public-files.json pins SHA-256 for each expected file. The CI checker rejects unknown, changed or missing files.

The full Git object history is scanned by `scripts/verify-public-history.mjs` on each CI run. It rejects foreign Git roots, unexpected historical file paths, binary/oversized history blobs and credential patterns. CI fetches full history (`fetch-depth: 0`). The safe pending public branch `chore/material-icon-theme-20261008` includes `.vscode/extensions.json` with only the public VS Code Material Icon Theme recommendation; its path is explicitly permitted in `historicalAllowedPaths` for complete-ref scanning without merging the branch. Formerly tracked, intentionally retired public paths must be added to `historicalAllowedPaths` only after manual review; never silently delete files to hide disclosures.

Any change to the allowlist requires independent review of copyright, privacy, credentials, endpoints, CI scopes and behavior. Never import backups, access logs, key files, release broker or device control from the private project.
