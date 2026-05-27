export const grassVertexShader = /* glsl */ `
  attribute vec3 aColor;
  attribute vec3 aBladeBase;
  attribute float aHeightFactor;
  attribute float aWindPhase;

  varying vec3 vColor;

  uniform float uTime;
  uniform float uWindDirection;
  uniform float uWindSpeed;
  uniform float uWindStrength;
  uniform float uWindNoiseScale;
  uniform float uBendStrength;

  void main() {
    vec3 transformed = position;
    float topFactor = aHeightFactor * aHeightFactor;
    vec2 windDirection = normalize(vec2(cos(uWindDirection), sin(uWindDirection)));

    float primaryWind = sin(
      uTime * max(uWindSpeed, 0.05) +
      aWindPhase +
      aBladeBase.x * uWindNoiseScale +
      aBladeBase.z * uWindNoiseScale
    );
    float secondaryWind = sin(
      uTime * max(uWindSpeed, 0.05) * 1.73 +
      aWindPhase * 0.71 +
      aBladeBase.x * uWindNoiseScale * 0.53 -
      aBladeBase.z * uWindNoiseScale * 0.89
    ) * 0.35;

    float bend = (primaryWind + secondaryWind) * uWindStrength * uBendStrength * topFactor;
    transformed.xz += windDirection * bend;

    vColor = aColor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`;

export const grassFragmentShader = /* glsl */ `
  varying vec3 vColor;

  void main() {
    gl_FragColor = vec4(vColor, 1.0);
  }
`;
