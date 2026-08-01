import { useEffect, useState } from "react";

/**
 * Subscribe to a CSS media query. Updates on change (not a one-shot width read).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** True for touch-first / coarse-pointer environments (mobile & many tablets). */
export function useCoarsePointer(): boolean {
  return useMediaQuery("(hover: none) and (pointer: coarse)");
}
