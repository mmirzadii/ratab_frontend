import { Moon, Sun } from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { toggleTheme } from "../../features/ui/uiSlice";
import { IconButton } from "./IconButton";

export function ThemeToggle() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  const isDark = theme === "dark";

  return (
    <IconButton
      aria-label="تغییر حالت روشن و تاریک"
      className="border-white/10 bg-white/8 light:border-slate-200 light:bg-white light:text-slate-700"
      onClick={() => dispatch(toggleTheme())}
    >
      {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </IconButton>
  );
}
