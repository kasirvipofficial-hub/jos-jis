import { type ClassValue, clsx } from "clsx";
import { mergeConfigs, extendTailwindMerge } from "tailwind-merge";

const customTwMerge = extendTailwindMerge({});

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
