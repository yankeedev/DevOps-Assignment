# Security Findings

Short record of CI and Git workflow security findings and fixes.

## Findings and fixes

1. **Frontend and backend dependencies were not both audited.** the project has separate `package.json` and lockfiles, so auditing from only one folder missed the other app. **Fixed:** CI runs `npm ci` and `npm audit --audit-level=high` in both app folders using a matrix.

2. **Dependency changes could leave lockfiles out of sync.** this can make clean CI installs fail or differ from local installs. **Fixed:** Updated each app's manifest and its matching lockfile together when changing dependencies.

3. **The production image included extra runtime tools.** the global frontend server and package manager files increased the image contents. **Fixed:** Serve frontend assets from the app, start Node directly, remove npm/npx/corepack from the runtime image, and run as a non-root user.

4. **Dependency checks did not cover the container and Terraform.** **Addressed:** Added Trivy image scanning and a tfsec workflow step.





## Reporting

Report security issues privately to the repository maintainers with the affected component, or raise an issue on github
