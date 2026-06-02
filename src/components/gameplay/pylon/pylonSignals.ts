/**
 * Shared runtime signal set by PylonDownedPylon when the straighten
 * animation starts, so PylonFarmerNPC can switch its lerp target.
 *
 * `completed` is set after the straighten animation finishes so
 * PylonFarmerNPC can play the post-raise audio sequence before
 * transitioning to the repair game.
 */
export const pylonStraighteningSignal = { started: false, completed: false };
