# Security Overview (Phase 1 Scaffold)

This repository contains only scaffolds – no secrets. All runtime credentials must be injected via environment variables sourced from Kubernetes Secrets or GitHub Actions encrypted secrets.

## Principles
- Least privilege DB users (separate app user per service schema)
- No hardcoded secrets; placeholders like `REPLACE_ME` indicate required injection
- Use parameterized queries / ORM abstractions (will be enforced in later phases)
- Add bcrypt hashing for user passwords (Phase 3)
- Implement rate limiting and audit logging (future phase)

## Immediate Actions Before Deploying Beyond Dev
1. Create Kubernetes Secrets for each service credentials.
2. Replace image tags with immutable `${{ github.sha }}` in Helm values (Phase 4).
3. Configure network policies between namespaces.
4. Enable Trivy or Snyk scans in CI (to be added Phase 9).
