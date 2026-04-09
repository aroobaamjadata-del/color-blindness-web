# Testing Checklist

## Environment

- Adobe UXP Developer Tool installed
- Photoshop running (required)
- Illustrator running (optional, for host parity checks)

## Smoke Tests (Photoshop)

- Panel loads without errors
- Mode selector changes between Simulate/Correct
- Type selector updates among 3 CVD types
- Intensity slider updates value label

## Simulation Tests

- Click `Apply Fix` in Simulate mode
- Verify a Channel Mixer adjustment layer is added
- Verify layer naming includes type and intensity
- Click `Revert Last Preview` and verify removal

## Correction Tests (Flattened Image)

- Use a one-layer background image
- Set mode to Correct
- Click `Apply Fix`
- Verify global correction adjustment layer is added
- Verify results message confirms flattened fallback

## Scan + Contrast Tests

- Use layered document with editable text and/or shapes
- Click `Scan Document`
- Verify conflict list includes contrast ratio and WCAG status
- Verify no-conflict message when appropriate

## Suggestions Tests

- Run scan on layered document with conflicts
- Verify suggestions list appears
- Select suggestions and click `Apply selected`
- Verify text color updates and rescan shows changed conflicts

## Export Tests

- Run scan to generate report
- Export TXT and verify file content
- Export PDF and verify file opens and contains report lines

## Illustrator v1 Tests (If available)

- Load plugin under Illustrator host
- Run Scan and verify swatch/selection colors are analyzed
- Verify report generation and export

## Undo/Redo

- Verify apply/revert actions appear as expected in history
- Validate user can undo plugin actions cleanly
