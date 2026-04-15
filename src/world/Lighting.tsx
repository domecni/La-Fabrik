export function Lighting(): React.JSX.Element {
  return (
    <>
      <directionalLight
        position={[60, 80, 30]}
        intensity={2.8}
        color="#fff7ed"
        castShadow
      />
    </>
  );
}
