"use client";
import { useEffect, useState } from "react";
const MOBILE_BREAKPOINT = 768;
export function useMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      }, 0);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => {
      mql.removeEventListener("change", onChange);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);
  return isMobile;
}