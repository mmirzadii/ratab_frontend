# Frontend Phase 10 Browser PDF Export Follow-up Report

## Summary

Status: done.

This focused Phase 10 follow-up added a temporary browser-side PDF option for the current financial document. The new action is labeled `دانلود PDF آزمایشی`, opens a print-ready browser document, and relies on the user's browser print dialog to save as PDF. Backend preview/export behavior remains unchanged, and the browser PDF is explicitly labeled as experimental and not the official final backend-generated archive.

## Scope

- Implemented only the frontend v0.0 demo browser-PDF follow-up.
- Did not touch backend code.
- Did not invent backend endpoints.
- Did not create backend export records or storage files.
- Did not mutate financial data.
- Kept backend as the source of truth for document lines, totals, and calculations.
- Kept the existing backend HTML preview and backend export/download actions separate.

## Files Created

Not applicable.

## Files Modified

- `src/pages/CostReportWizardPage.tsx`
- `code_oder/v0.0/phaze10/REPORT.md`
- `code_oder/v0.0/phaze10/TEST_RESULTS.md`

## Implementation Details

- Added `buildBrowserPdfPrintDoc()` to build a print-ready RTL HTML document from the current `FinancialDocument` snapshot already loaded in the frontend.
- Added `handleBrowserPdfDownload()` to open a new browser window, write the print document, and call `window.print()` after content is ready.
- Added loading, success, and blocked-popup error handling for the browser print flow.
- Added a separate `دانلود PDF آزمایشی` action beside the existing backend export buttons.
- Added an always-visible note: `این PDF به‌صورت آزمایشی در مرورگر ساخته می‌شود و نسخه رسمی نهایی نیست.`
- Kept the existing backend `پیش‌نمایش صورت‌بها`, backend export metadata action, and backend PDF download action intact.

## Browser PDF Notes

- The browser-generated PDF uses the current frontend document data and does not contact or update the backend.
- The print document uses `dir="rtl"`, Persian labels, Metril branding, and A4 print CSS.
- The print stylesheet references the bundled B Nazanin font asset through the frontend build pipeline.
- The output includes document metadata, line rows, chapter totals when present, final summary totals, and signature placeholders.
- Summary table cells such as `جمع بهای فهرست` are center-aligned.
- App chrome, navigation, and buttons are not part of the print window.

## API Contract Notes

- No API contract changes were made.
- No frontend PDF state is sent to the backend.
- Backend export state is not faked; failed or unavailable backend exports still behave as before.
- The browser PDF is not stored in `StorageFile` and is not an authoritative archive.

## Issues and Findings

- Browser print output can vary by browser, OS, and user print settings.
- Pop-up blockers can prevent the print window from opening; the UI now shows a friendly error for that case.
- `npm run build` still emits the existing non-blocking Vite chunk-size warning.
- No `npm test` script exists in `package.json`.

## Risks and Assumptions

- Assumed browser print/save-as-PDF is acceptable for the v0.0 demo.
- Assumed official PDF generation and storage remains a backend responsibility.
- Assumed B Nazanin loading through the built asset URL is acceptable for print styling.
- Assumed financial snapshots already loaded in the current document are sufficient for the temporary demo PDF.

## User Actions Required

- Manually open a current صورت‌بها with at least one line and click `دانلود PDF آزمایشی`.
- Confirm the browser print dialog opens and saving as PDF keeps Persian RTL text readable.
- Confirm the note clearly says the PDF is experimental and not the official final version.
- Confirm existing backend HTML preview and backend export/download actions still work unchanged.

## Suggested Commit Message

feat(frontend-phase10): add browser pdf export

## Next Step

Use this only for v0.0 demo review. Keep official PDF generation/storage as a backend follow-up.
