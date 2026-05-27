export const grassVertexShader = /* glsl */ `
  attribute vec3 aYaw;
  attribute vec3 aBladeOrigin;
  attribute vec3 aBladeColor;

  varying vec3 vColor;

  uniform float uTime;
  uniform vec3 uPlayerPosition;
  uniform sampler2D uHeightMap;
  uniform sampler2D uDiffuseMap;
  uniform sampler2D uNoiseTexture;
  uniform vec3 uBoundingBoxMin;
  uniform vec3 uBoundingBoxMax;
  uniform float uPatchSize;
  uniform float uBladeWidth;
  uniform float uWindDirection;
  uniform float uWindSpeed;
  uniform float uWindNoiseScale;
  uniform float uWindStrength;
  uniform float uBaldPatchModifier;
  uniform float uFalloffSharpness;
  uniform float uHeightNoiseFrequency;
  uniform float uHeightNoiseAmplitude;
  uniform float uClumpFrequency;
  uniform float uClumpThreshold;
  uniform float uClumpSoftness;
  uniform float uZoneFrequency;
  uniform float uNoGrassZoneThreshold;
  uniform float uSparseZoneThreshold;
  uniform float uMediumZoneThreshold;
  uniform float uZoneSoftness;
  uniform float uNoGrassZoneHeight;
  uniform float uSparseZoneHeight;
  uniform float uMediumZoneHeight;
  uniform float uTallZoneHeight;
  uniform float uNoGrassZoneDensity;
  uniform float uSparseZoneDensity;
  uniform float uMediumZoneDensity;
  uniform float uTallZoneDensity;
  uniform float uMaxBendAngle;
  uniform float uMaxBladeHeight;
  uniform float uRandomHeightAmount;
  uniform float uSurfaceOffset;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  mat3 rotate3d(in vec3 axis, const in float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    return mat3(
      oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s,
      oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s,
      oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c
    );
  }

  float mapValue(float value, float inMin, float inMax, float outMin, float outMax) {
    return mix(outMin, outMax, (value - inMin) / (inMax - inMin));
  }

  void main() {
    vec3 transformed = position;
    vec3 origin = aBladeOrigin;
    float halfPatchSize = uPatchSize * 0.5;

    origin.x = mod(origin.x - uPlayerPosition.x + halfPatchSize, uPatchSize) - halfPatchSize;
    origin.z = mod(origin.z - uPlayerPosition.z + halfPatchSize, uPatchSize) - halfPatchSize;

    vec3 worldPos = vec3(uPlayerPosition.x + origin.x, 0.0, uPlayerPosition.z + origin.z);
    transformed.x = worldPos.x;
    transformed.z = worldPos.z;

    vec2 terrainUv = vec2(
      mapValue(worldPos.x, uBoundingBoxMin.x, uBoundingBoxMax.x, 0.0, 1.0),
      mapValue(worldPos.z, uBoundingBoxMin.z, uBoundingBoxMax.z, 0.0, 1.0)
    );
    terrainUv = clamp(terrainUv, 0.0, 1.0);

    float terrainHeightRatio = texture2D(uHeightMap, terrainUv).r;
    float terrainHeight = mix(uBoundingBoxMin.y, uBoundingBoxMax.y, terrainHeightRatio);
    transformed.y = terrainHeight + uSurfaceOffset;

    vec3 heightNoise = texture2D(uNoiseTexture, terrainUv.yx * vec2(uHeightNoiseFrequency)).rgb;
    float heightNoiseAverage = (heightNoise.r + heightNoise.g + heightNoise.b) / 3.0;
    vec2 clumpUv = (worldPos.xz / uPatchSize) * uClumpFrequency;
    float clumpNoise = texture2D(uNoiseTexture, clumpUv).r;
    float clumpMask = smoothstep(uClumpThreshold, uClumpThreshold + uClumpSoftness, clumpNoise);
    float zoneNoise = texture2D(uNoiseTexture, worldPos.xz * uZoneFrequency).r;
    float noGrassZone = 1.0 - smoothstep(uNoGrassZoneThreshold, uNoGrassZoneThreshold + uZoneSoftness, zoneNoise);
    float sparseZone =
      smoothstep(uNoGrassZoneThreshold, uNoGrassZoneThreshold + uZoneSoftness, zoneNoise) *
      (1.0 - smoothstep(uSparseZoneThreshold, uSparseZoneThreshold + uZoneSoftness, zoneNoise));
    float mediumZone =
      smoothstep(uSparseZoneThreshold, uSparseZoneThreshold + uZoneSoftness, zoneNoise) *
      (1.0 - smoothstep(uMediumZoneThreshold, uMediumZoneThreshold + uZoneSoftness, zoneNoise));
    float tallZone = smoothstep(uMediumZoneThreshold, uMediumZoneThreshold + uZoneSoftness, zoneNoise);
    float zoneHeight =
      noGrassZone * uNoGrassZoneHeight +
      sparseZone * uSparseZoneHeight +
      mediumZone * uMediumZoneHeight +
      tallZone * uTallZoneHeight;
    float zoneDensity =
      noGrassZone * uNoGrassZoneDensity +
      sparseZone * uSparseZoneDensity +
      mediumZone * uMediumZoneDensity +
      tallZone * uTallZoneDensity;
    float bladeVisibility = step(random(worldPos.xz), zoneDensity);
    float heightModifier = uMaxBladeHeight * mix(0.35, 1.0, heightNoiseAverage) * uHeightNoiseAmplitude;
    heightModifier += random(terrainUv) * (uRandomHeightAmount * 0.1);
    heightModifier = clamp(heightModifier, 0.0, uMaxBladeHeight);
    heightModifier *= zoneHeight * bladeVisibility;

    float edgeDistanceX = abs(origin.x) / halfPatchSize;
    float edgeDistanceZ = abs(origin.z) / halfPatchSize;
    float edgeFactor = 1.0 - max(edgeDistanceX, edgeDistanceZ);
    edgeFactor = pow(clamp(edgeFactor, 0.0, 1.0), uFalloffSharpness);

    float baldPatchOffset = heightNoise.r * (uBaldPatchModifier * (1.0 - edgeFactor));
    heightModifier -= baldPatchOffset;
    heightModifier = max(heightModifier, 0.0);

    float edgeFade =
      smoothstep(uBoundingBoxMin.x, uBoundingBoxMin.x + 2.0, worldPos.x) *
      smoothstep(uBoundingBoxMax.x, uBoundingBoxMax.x - 2.0, worldPos.x) *
      smoothstep(uBoundingBoxMin.z, uBoundingBoxMin.z + 2.0, worldPos.z) *
      smoothstep(uBoundingBoxMax.z, uBoundingBoxMax.z - 2.0, worldPos.z);
    heightModifier *= edgeFade * mix(0.45, 1.0, clumpMask);

    float sideFactor = (color.r == 0.1) ? 1.0 : (color.b == 0.1) ? -1.0 : 0.0;
    float tipFactor = color.g;
    float width = smoothstep(0.02, uMaxBladeHeight * 0.85, heightModifier) * uBladeWidth * bladeVisibility;
    transformed += aYaw * (width / 2.0) * sideFactor;

    vec3 textureColor = texture2D(uDiffuseMap, terrainUv * 10.0).rgb;
    vec3 colorNoise = texture2D(uNoiseTexture, terrainUv.yx * vec2(uHeightNoiseFrequency) + (uTime * 0.1)).rgb;
    vColor = mix(aBladeColor * 0.55, aBladeColor, tipFactor) * textureColor * mix(vec3(0.75), vec3(1.15), colorNoise);

    float distanceFromCenter = length(origin.xz) / halfPatchSize;
    float innerCircleFactor = clamp(smoothstep(0.0, 0.5, distanceFromCenter), 0.0, 1.0);
    heightModifier *= mix(0.25, 1.0, innerCircleFactor);

    float noiseScale = uWindNoiseScale * 0.1;
    vec2 noiseUV = vec2(origin.x * noiseScale, origin.z * noiseScale);
    mat2 rotation = mat2(
      cos(uWindDirection), -sin(uWindDirection),
      sin(uWindDirection), cos(uWindDirection)
    );
    vec2 rotatedNoiseUV = rotation * noiseUV + uTime * vec2(uWindSpeed);
    vec3 windNoise = texture2D(uNoiseTexture, rotatedNoiseUV).rgb;

    vec3 axis = vec3(windNoise.g, 0.0, windNoise.b);
    float angle = radians(mapValue(windNoise.g + windNoise.b, 0.0, 2.0, -uMaxBendAngle, uMaxBendAngle)) * tipFactor * uWindStrength;
    mat3 rotationMatrix = rotate3d(axis, angle);

    vec3 basePosition = vec3(transformed.x, transformed.y - heightModifier, transformed.z);
    vec3 relativePosition = transformed - basePosition;
    relativePosition = rotationMatrix * relativePosition;
    transformed = basePosition + relativePosition;
    transformed.y += heightModifier * tipFactor;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`;

export const grassFragmentShader = /* glsl */ `
  varying vec3 vColor;

  void main() {
    gl_FragColor = vec4(vColor, 1.0);
  }
`;
