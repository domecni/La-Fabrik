export const WATER_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec2 vWorldPos;

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldPos = worldPosition.xz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const WATER_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uScale;
  uniform float uSmoothness;
  uniform float uEdgeThreshold;
  uniform float uEdgeSoftness;
  uniform float uFlowX;
  uniform float uFlowZ;
  uniform float uCellSpeed;
  uniform float uNoiseScale;
  uniform float uNoiseFlowSpeed;
  uniform float uDistortAmount;
  uniform float uBorderRadius;
  uniform float uBorderSoftness;
  uniform vec3 uDeepColor;
  uniform vec3 uMidColor;
  uniform float uMidPos;
  uniform vec3 uHighlight;
  uniform float uOpacity;
  uniform float uDeepOpacity;
  uniform float uFogEnabled;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform vec3 uFogColor;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec2 vWorldPos;

  float roundedBoxMask(vec2 uv, float radius, float softness) {
    vec2 centeredUv = uv * 2.0 - 1.0;
    vec2 boxSize = vec2(1.0 - radius);
    vec2 distanceToEdge = abs(centeredUv) - boxSize;
    float outsideDistance = length(max(distanceToEdge, 0.0)) - radius;

    return 1.0 - smoothstep(-softness, softness, outsideDistance);
  }

  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
  }

  float smin(float a, float b, float k) {
    float h = max(k - abs(a - b), 0.0) / k;
    return min(a, b) - h * h * h * k / 6.0;
  }

  vec2 cellPoint(vec2 seed) {
    return 0.5 + 0.5 * sin(uTime * uCellSpeed + 6.2831 * seed);
  }

  float voronoiF1(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float nearest = 8.0;

    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 neighbor = vec2(float(x), float(y));
        vec2 point = cellPoint(hash2(i + neighbor));
        nearest = min(nearest, length(neighbor + point - f));
      }
    }

    return nearest;
  }

  float voronoiSmoothF1(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float result = 8.0;

    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 neighbor = vec2(float(x), float(y));
        vec2 point = cellPoint(hash2(i + neighbor));
        result = smin(result, length(neighbor + point - f), uSmoothness);
      }
    }

    return result;
  }

  float noiseHash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(noiseHash(i), noiseHash(i + vec2(1.0, 0.0)), f.x),
      mix(noiseHash(i + vec2(0.0, 1.0)), noiseHash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int i = 0; i < 2; i++) {
      value += amplitude * valueNoise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }

    return value;
  }

  void main() {
    vec2 noiseUv = vWorldPos * uNoiseScale + vec2(uTime * uNoiseFlowSpeed, 0.0);
    float noiseFactor = fbm(noiseUv);
    vec2 distortion = vec2(noiseFactor - 0.5) * uDistortAmount;
    vec2 uv = vWorldPos * uScale + vec2(uFlowX, uFlowZ) * uTime + distortion;

    float f1 = voronoiF1(uv);
    float smoothF1 = voronoiSmoothF1(uv);
    float edge = f1 - smoothF1;
    float ramp = smoothstep(uEdgeThreshold - uEdgeSoftness, uEdgeThreshold + uEdgeSoftness, edge);
    float safeMidPosition = max(uMidPos, 0.0001);
    float firstSegment = clamp(ramp / safeMidPosition, 0.0, 1.0);
    float secondSegment = clamp((ramp - safeMidPosition) / max(1.0 - safeMidPosition, 0.0001), 0.0, 1.0);
    float inSecondSegment = step(safeMidPosition, ramp);
    vec3 color = mix(
      mix(uDeepColor, uMidColor, firstSegment),
      mix(uMidColor, uHighlight, secondSegment),
      inSecondSegment
    );
    float alpha = mix(uDeepOpacity, 1.0, ramp) * uOpacity;
    alpha *= roundedBoxMask(vUv, uBorderRadius, uBorderSoftness);

    if (uFogEnabled > 0.5) {
      float fogDistance = distance(cameraPosition, vWorldPosition);
      float fogFactor = smoothstep(uFogNear, uFogFar, fogDistance);
      color = mix(color, uFogColor, fogFactor);
      alpha *= 1.0 - fogFactor;
    }

    if (alpha < 0.01) {
      discard;
    }

    gl_FragColor = vec4(color, alpha);
  }
`;
