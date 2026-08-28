/**
 * Global App Feature Config Flags
 * Toggle any feature ON (true) or OFF (false) cleanly across the app.
 */
export const FEATURE_FLAGS = {
  workers: false,
  attendance: false,
  materials: true,
  expenses: true,
  vendors: true,
  progress: true,
  payments: true,
  documents: true,
  reports: true
};

export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature] ?? true;
}
