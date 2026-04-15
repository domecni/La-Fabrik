import { Debug } from "@/debug/Debug";

export function DebugHelpers(): React.JSX.Element | null {
  const debug = Debug.getInstance();

  if (!debug.active) {
    return null;
  }

  return (
    <>
      <gridHelper
        args={[180, 36, "#1d4ed8", "#1e293b"]}
        position={[0, 0.01, 0]}
      />
      <axesHelper args={[10]} />
    </>
  );
}
