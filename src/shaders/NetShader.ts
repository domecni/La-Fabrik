import { Mesh, PlaneGeometry, ShaderMaterial } from "three";

export const createNetShader = (): ShaderMaterial => {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uGridScale: { value: 15.0 },
      uPincushionStrength: { value: 0.4 },
      uBloomIntensity: { value: 0.3 },
      uGridThickness: { value: 0.02 },
    },
    vertexShader: `
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uGridScale;
      uniform float uPincushionStrength;
      uniform float uBloomIntensity;
      uniform float uGridThickness;
      
      varying vec2 vUv;
      
      vec2 applyPincushion(vec2 uv, float strength) {
        vec2 center = uv - 0.5;
        float dist = length(center);
        float distortion = 1.0 + dist * dist * strength;
        return center * distortion + 0.5;
      }
      
      float grid(vec2 uv, float scale, float thickness) {
        vec2 gridUV = fract(uv * scale);
        float lineX = smoothstep(thickness, thickness + 0.01, gridUV.x) 
                    * smoothstep(1.0 - thickness, 1.0 - thickness - 0.01, gridUV.x);
        float lineY = smoothstep(thickness, thickness + 0.01, gridUV.y) 
                    * smoothstep(1.0 - thickness, 1.0 - thickness - 0.01, gridUV.y);
        return lineX + lineY;
      }
      
      void main() {
        vec2 uv = applyPincushion(vUv, uPincushionStrength);
        
        float gridPattern = grid(uv, uGridScale, uGridThickness);
        
        vec3 gridColor = vec3(1.0, 0.4, 0.7);
        vec3 bgColor = vec3(0.05, 0.02, 0.05);
        
        float bloom = gridPattern * uBloomIntensity;
        vec3 col = mix(bgColor, gridColor + bloom, gridPattern);
        
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
};

export const createNetMesh = (): Mesh => {
  const geometry = new PlaneGeometry(2, 2);
  const material = createNetShader();
  return new Mesh(geometry, material);
};
