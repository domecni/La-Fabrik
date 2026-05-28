const AMBIENT_LIGHT_COLOR = "#dfe7d8";
const SUN_LIGHT_COLOR = "#ffe2bf";

export const LIGHTING_DEFAULTS = {
  ambientColor: AMBIENT_LIGHT_COLOR,
  ambientIntensity: 0.9,
  sunColor: SUN_LIGHT_COLOR,
  sunIntensity: 2.2,
  sunX: 70,
  sunY: 45,
  sunZ: 35,
};

export const AMBIENT_INTENSITY_MIN = 0;
export const AMBIENT_INTENSITY_MAX = 5;
export const AMBIENT_INTENSITY_STEP = 0.1;

export const SUN_INTENSITY_MIN = 0;
export const SUN_INTENSITY_MAX = 8;
export const SUN_INTENSITY_STEP = 0.1;

export const SUN_X_MIN = -100;
export const SUN_X_MAX = 100;
export const SUN_X_STEP = 1;

export const SUN_Y_MIN = 0;
export const SUN_Y_MAX = 150;
export const SUN_Y_STEP = 1;

export const SUN_Z_MIN = -100;
export const SUN_Z_MAX = 100;
export const SUN_Z_STEP = 1;
