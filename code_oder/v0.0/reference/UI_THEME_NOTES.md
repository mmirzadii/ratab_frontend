# UI Theme Notes — extracted from main_updated.html

Use `main_updated.html` as the visual baseline.

Required visual language:

- dark background around `#05050a`;
- slate/black translucent glass cards;
- emerald/teal primary gradient;
- violet and amber secondary accents;
- fixed right sidebar where relevant;
- sticky top header where relevant;
- Persian RTL layout;
- Vazirmatn typography or bundled equivalent;
- rounded cards/modals;
- dashboard preview cards;
- messenger/chat-like modal;
- smooth but not distracting motion.

React conversion:

- replace Alpine with React state;
- replace CDN scripts with npm packages or remove;
- do not use CDN Tailwind;
- do not blindly copy invalid SVG namespaces;
- create reusable components.

Suggested components:

```text
AppShell
RightSidebar
TopHeader
GlassCard
DashboardMetricCard
CompanyMessengerShell
AssistantModal
PricebookSelector
PrimaryButton
IconButton
Tooltip
ThemeToggle
GuidedTour
```
