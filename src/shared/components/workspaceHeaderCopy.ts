export function getWorkspaceHeaderCopy(pathname: string): {
  title: string;
  description: string;
} {
  if (pathname === "/status") {
    return {
      title: "وضعیت سرویس",
      description: ""
    };
  }

  if (pathname === "/help") {
    return {
      title: "راهنما",
      description: ""
    };
  }

  if (pathname.startsWith("/admin")) {
    return {
      title: "مدیریت پلتفرم",
      description: ""
    };
  }

  if (pathname.startsWith("/support")) {
    return {
      title: "پشتیبانی",
      description: ""
    };
  }

  return {
    title: "متریل",
    description: ""
  };
}
