export const PERMANENT_ATTRIBUTE_LOSS_SCALE = 1000;

/**
 * Converts the victim's temporary Essence Shift stat loss into a fixed-point
 * permanent loss. One returned unit is 0.001 attribute points.
 */
export function calculateSlarkPermanentAttributeLoss(
  stolenAttributes: number,
  baseLossAttributePct: number,
  extraLossAttributePct: number,
): number {
  const stolen = Math.max(stolenAttributes, 0);
  const lossAttributePct = Math.max(baseLossAttributePct + extraLossAttributePct, 0);

  return Math.max(0, Math.round(stolen * lossAttributePct * 10));
}
