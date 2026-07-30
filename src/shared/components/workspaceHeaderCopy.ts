export function getWorkspaceHeaderCopy(pathname: string): {
  title: string;
  description: string;
} {
  if (pathname === "/status") {
    return {
      title: "وضعیت سرویس",
      description: "بررسی اتصال متریل به سرویس توسعه"
    };
  }

  if (pathname === "/help") {
    return {
      title: "راهنمای متریل",
      description: "پاسخ‌های کوتاه برای مسیرهای اصلی نسخه آزمایشی"
    };
  }

  return {
    title: "فضای کار متریل",
    description: "شرکت، پروژه، صورت‌بها و فهرست‌بها در یک فضای کاری"
  };
}
