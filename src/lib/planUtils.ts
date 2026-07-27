// Plan gating utilities for VakilDesk
// Plans (low -> high): trial, basic, pro, advanced, custom
// A feature requiring `pro` is unlocked for pro, advanced, and custom.

export type Plan = 'trial' | 'basic' | 'pro' | 'advanced' | 'custom';

// Numeric rank — higher tiers include everything in lower tiers
const PLAN_RANK: Record<Plan, number> = {
  trial: 0,
  basic: 1,
  pro: 2,
  advanced: 3,
  custom: 4,
};

/**
 * Returns true if `userPlan` meets or exceeds `requiredPlan`.
 * Unknown / undefined plans are treated as the lowest tier (trial).
 */
export const canAccess = (
  userPlan: string | null | undefined,
  requiredPlan: Plan
): boolean => {
  const userRank = PLAN_RANK[(userPlan as Plan)] ?? 0;
  const requiredRank = PLAN_RANK[requiredPlan] ?? 0;
  return userRank >= requiredRank;
};

// Human-readable plan label.
// Note: the "advanced" plan is branded as "Premium" to users, while the
// underlying value stays "advanced" in the database and gating logic.
export const planLabel = (plan: string | null | undefined): string => {
  if (!plan) return 'Trial';
  if (plan === 'advanced') return 'Premium';
  return plan.charAt(0).toUpperCase() + plan.slice(1);
};
