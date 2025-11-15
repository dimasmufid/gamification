import type { Hero } from "@/lib/models/hero";

export function computeHeroProgress(hero?: Hero) {
  if (!hero) {
    return { expToNextLevel: 0, progressPercent: 0 };
  }
  const expToNextLevel = Math.max(hero.level * 100, 1);
  const expWithinLevel = hero.exp % expToNextLevel;
  return {
    expToNextLevel,
    progressPercent: Math.min(100, (expWithinLevel / expToNextLevel) * 100),
  };
}
