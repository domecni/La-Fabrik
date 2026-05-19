import { ShaderMaterial, Color } from "three";

export const createUnicolorShader = (
  color: Color | string | number,
): ShaderMaterial => {
  return new ShaderMaterial({
    uniforms: {
      uColor: { value: color instanceof Color ? color : new Color(color) },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
        float diffuse = max(dot(vNormal, lightDir), 0.0);
        float ambient = 0.3;
        vec3 finalColor = uColor * (ambient + diffuse * 0.7);
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
  });
};
