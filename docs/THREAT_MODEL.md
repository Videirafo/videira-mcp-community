# Threat model

- Private-history exposure: independent repository, no fork/mirror, closed-file allowlist and provenance.
- Credential exposure: no copied secrets, static scan and manual review required.
- CI privilege escalation: GitHub-hosted ubuntu-latest, contents read-only, no privileged runners.
- Unauthorized MCP commands: only two strictly typed offline read-only tools.
- Fake release approval: every plan returns productionReady false and approval NOT_GRANTED.
- Intellectual property: source-available evaluation license and reserved marks.
- Residual risk: software is not guaranteed invulnerable and is not a production authorization system.
