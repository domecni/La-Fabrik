import { useHandTrackingSnapshot } from "@/hooks/handTracking/useHandTrackingSnapshot";

const HAND_CONNECTIONS: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
];

export function HandTrackingVisualizer(): React.JSX.Element | null {
  const { hands, status } = useHandTrackingSnapshot();

  if (status === "idle" || hands.length === 0) {
    return null;
  }

  return (
    <svg className="hand-tracking-visualizer" aria-hidden="true">
      {hands.map((hand, handIndex) => {
        const landmarks = hand.landmarks ?? [];
        if (landmarks.length === 0) return null;

        const color = hand.isFist ? "#facc15" : "#38bdf8";

        return (
          <g key={`${hand.handedness}-${handIndex}`}>
            {HAND_CONNECTIONS.map(([from, to]) => {
              const fromPoint = landmarks[from];
              const toPoint = landmarks[to];
              if (!fromPoint || !toPoint) return null;

              return (
                <line
                  key={`${from}-${to}`}
                  x1={`${(1 - fromPoint.x) * 100}%`}
                  y1={`${fromPoint.y * 100}%`}
                  x2={`${(1 - toPoint.x) * 100}%`}
                  y2={`${toPoint.y * 100}%`}
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              );
            })}

            {landmarks.map((landmark, landmarkIndex) => (
              <circle
                key={landmarkIndex}
                cx={`${(1 - landmark.x) * 100}%`}
                cy={`${landmark.y * 100}%`}
                r={landmarkIndex === 8 ? 5 : 3}
                fill={landmarkIndex === 8 ? "#ffffff" : color}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
