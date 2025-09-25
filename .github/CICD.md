# GetWarped CI/CD Pipeline

This document describes the continuous integration and deployment pipeline for
the GetWarped Electron application.

## Overview

Our CI/CD pipeline is built on GitHub Actions and provides:

- **Automated Testing**: Unit, integration, and E2E tests across multiple
  platforms
- **Security Scanning**: Vulnerability detection, dependency auditing, and
  secrets scanning
- **Code Quality**: Linting, formatting, type checking, and coverage analysis
- **Cross-Platform Builds**: Automated builds for Windows, macOS, and Linux
- **Automated Releases**: Tagged releases with signed binaries
- **Dependency Management**: Automated updates and security patches

## Workflows

### 1. CI Pipeline (`ci.yml`)

**Triggers**: Push to `main`/`develop`, Pull requests  
**Runs on**: Ubuntu, Windows, macOS  
**Node versions**: 18.x, 20.x

**Steps**:

- Code checkout and dependency installation
- Type checking with TypeScript
- Linting with ESLint
- Format checking with Prettier
- Unit and integration tests
- Test coverage upload to Codecov
- Security audit scanning
- Cross-platform application builds
- E2E tests with Playwright
- Artifact uploads

### 2. Release Pipeline (`release.yml`)

**Triggers**: Git tags starting with `v*`  
**Runs on**: Ubuntu, Windows, macOS

**Steps**:

- Automated release creation
- Full test suite execution
- Security auditing
- Cross-platform builds and packaging
- Code signing (Windows/macOS)
- Asset uploads to GitHub releases
- Security report generation

### 3. Security Scanning (`security.yml`)

**Triggers**: Daily schedule, pushes to `main`, pull requests  
**Runs on**: Ubuntu

**Steps**:

- npm audit for known vulnerabilities
- Snyk security scanning
- GitHub CodeQL analysis
- OWASP ZAP baseline security testing
- Dependency review for pull requests
- TruffleHog secrets detection

### 4. Code Quality (`code-quality.yml`)

**Triggers**: Push to `main`/`develop`, Pull requests  
**Runs on**: Ubuntu

**Steps**:

- ESLint analysis with SARIF upload
- Prettier format validation
- TypeScript type checking
- Test coverage analysis
- SonarQube quality gate checks
- Performance test execution

### 5. Deployment (`deploy.yml`)

**Triggers**: Push to `main`/`staging`, manual dispatch  
**Environments**: Staging, Production

**Steps**:

- Environment-specific builds
- Full test suite validation
- Security scanning
- Application signing
- Distribution platform uploads
- Auto-updater feed updates
- Smoke test execution
- Slack notifications
- Rollback procedures

### 6. Dependency Updates (`dependencies.yml`)

**Triggers**: Weekly schedule, manual dispatch  
**Runs on**: Ubuntu

**Steps**:

- Dependency update checking
- Automated updates via npm
- Security fix applications
- Test execution post-update
- Pull request creation
- Renovate integration

## Security Features

### Vulnerability Scanning

- **npm audit**: Built-in npm vulnerability database
- **Snyk**: Commercial vulnerability scanning with GitHub integration
- **CodeQL**: GitHub's semantic code analysis
- **OWASP ZAP**: Dynamic application security testing
- **TruffleHog**: Secrets and credential detection

### Dependency Management

- **Renovate**: Automated dependency updates with custom rules
- **Security alerts**: High-priority vulnerability notifications
- **Dependency review**: PR-based dependency change analysis
- **Pin security packages**: Exact version pinning for security-critical
  packages

### Code Signing

- **Windows**: Authenticode signing with certificates
- **macOS**: Developer ID signing and notarization
- **Verification**: Automated signature validation

## Quality Gates

### Required Checks

- All tests must pass (unit, integration, E2E)
- Security audit must complete without high-severity issues
- Code coverage must meet 80% threshold
- TypeScript type checking must pass
- ESLint rules must pass
- Prettier formatting must be consistent

### Branch Protection

- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date
- Require conversation resolution before merging

## Environment Configuration

### Staging Environment

- **URL**: https://staging.getwarped.com
- **Purpose**: Pre-production testing and validation
- **Auto-deployment**: Enabled from `staging` branch
- **Features**: Full feature set with staging data

### Production Environment

- **URL**: https://getwarped.com
- **Purpose**: Live user-facing application
- **Auto-deployment**: Enabled from `main` branch with approval
- **Features**: Production data and full security hardening

## Secrets and Configuration

### Required GitHub Secrets

| Secret                         | Purpose                  | Required For          |
| ------------------------------ | ------------------------ | --------------------- |
| `CODECOV_TOKEN`                | Coverage reporting       | Code quality workflow |
| `SNYK_TOKEN`                   | Security scanning        | Security workflow     |
| `SONAR_TOKEN`                  | SonarQube analysis       | Code quality workflow |
| `SONAR_HOST_URL`               | SonarQube server         | Code quality workflow |
| `WINDOWS_CERTIFICATE`          | Code signing             | Release workflow      |
| `WINDOWS_CERTIFICATE_PASSWORD` | Code signing             | Release workflow      |
| `APPLE_CERTIFICATE`            | macOS code signing       | Release workflow      |
| `APPLE_CERTIFICATE_PASSWORD`   | macOS code signing       | Release workflow      |
| `APPLE_API_KEY`                | macOS notarization       | Release workflow      |
| `SLACK_WEBHOOK_URL`            | Deployment notifications | Deploy workflow       |
| `RENOVATE_TOKEN`               | Dependency updates       | Dependencies workflow |

### Environment Variables

| Variable                | Description                 | Default       |
| ----------------------- | --------------------------- | ------------- |
| `NODE_ENV`              | Node.js environment         | `development` |
| `REACT_APP_ENVIRONMENT` | Application environment     | `development` |
| `CI`                    | Continuous integration flag | `true`        |

## Monitoring and Notifications

### Slack Integration

- Deployment status notifications
- Security alert notifications
- Build failure notifications
- Rollback notifications

### Coverage Tracking

- Codecov integration for coverage trends
- Coverage threshold enforcement (80%)
- Pull request coverage diffs

### Performance Monitoring

- Performance test execution
- Memory usage tracking
- Build time optimization
- Bundle size monitoring

## Local Development

### Running CI Checks Locally

```bash
# Install dependencies
npm ci

# Run linting
npm run lint

# Run type checking
npm run typecheck

# Run format checking
npm run format:check

# Run tests
npm run test:unit
npm run test:integration
npm run test:e2e

# Run security scan
npm run security:scan

# Build application
npm run build

# Package for current platform
npm run package
```

### Pre-commit Hooks

Install pre-commit hooks to run checks before commits:

```bash
npm run prepare
```

This will install:

- ESLint checks
- Prettier formatting
- TypeScript type checking
- Basic security scanning

## Troubleshooting

### Common Issues

1. **Build failures on specific platforms**
   - Check platform-specific dependencies
   - Verify Node.js version compatibility
   - Review platform-specific build scripts

2. **Test failures in CI but not locally**
   - Check for environment-specific test conditions
   - Verify test data and fixtures
   - Review CI environment differences

3. **Security scan failures**
   - Update dependencies with security patches
   - Review and suppress false positives
   - Check for leaked secrets or credentials

4. **Coverage threshold failures**
   - Add missing test cases
   - Review coverage exclusions
   - Update coverage thresholds if appropriate

### Debug Mode

Enable debug output in workflows by setting:

```yaml
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

## Maintenance

### Weekly Tasks

- Review automated dependency update PRs
- Check security scan results
- Monitor build performance metrics
- Review error logs and failure patterns

### Monthly Tasks

- Update workflow dependencies
- Review and update security scanning rules
- Audit CI/CD performance and costs
- Update documentation

### Quarterly Tasks

- Review and update quality gates
- Audit secrets and credentials
- Performance optimization review
- Security posture assessment

## Contributing

When modifying CI/CD workflows:

1. Test changes in a feature branch first
2. Document any new requirements or secrets
3. Update this README with configuration changes
4. Ensure backward compatibility where possible
5. Test across all supported platforms
