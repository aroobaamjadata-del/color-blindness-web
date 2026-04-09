# Packaging and Deployment

## Pre-Release Validation

- Confirm `manifest.json` is valid JSON
- Confirm plugin version is updated for the release
- Verify icon path exists (`assets/icons/icon.svg`)
- Run full checklist in `TESTING.md`

## Build and Package

1. Open Adobe UXP Developer Tool.
2. Load plugin and run final smoke tests.
3. Use package option in UXP Developer Tool to create distributable package.

## Release Artifacts

- Source bundle
- Internal test notes (pass/fail matrix)
- Demo walkthrough recording
- Change log for this release

## Marketplace Readiness (If publishing)

- Confirm naming and branding assets
- Verify host compatibility and min versions
- Validate permissions are minimal and justified
- Prepare product description and screenshots
- Submit package to Adobe marketplace workflow
