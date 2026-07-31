# Phase 10 — User Actions Required

## Review checklist

1. Confirm backend Phase 10 is deployed on the API environment the frontend points to (`VITE_API_BASE_URL`).
2. Log in on desktop and open a company conversation with at least two groups.
3. Send a message:
   - expect pending indicator then timestamp + **one** check;
   - confirm toast `پیام ارسال شد.` does **not** appear.
4. Right-click a message:
   - custom menu (not the browser menu);
   - only backend-allowed actions appear.
5. Forward a message to **گفتگوی فعلی** (same group):
   - confirm the current group is selectable (not disabled/excluded);
   - after success, modal closes, chat stays open, and the new forwarded bubble appears;
   - preview shows real text or filename/title — not `پیام با پیوست` / `۱ پیوست`.
6. Forward to another eligible group; confirm current chat stays open and target list activity refreshes.
7. Edit own message via composer banner; cancel once to confirm draft restore; save and confirm `ویرایش‌شده`.
8. Delete a permitted message; confirm tombstone `پیام حذف شد` and hidden attachments.
9. On a phone or DevTools mobile emulation: long-press / overflow opens the same actions.
10. Retry a failed send (e.g. offline briefly) and confirm no duplicate bubble for the same `client_message_id`.
11. Confirm forward errors never show English such as `A message cannot be forwarded into the same group.`

## Not required from the user for this phase

- Backend code changes
- Commit / push (agent did not commit)
- Inventing read receipts or double-check UI
