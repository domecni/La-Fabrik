import { useHandTrackingSnapshot } from "@/hooks/handTracking/useHandTrackingSnapshot";
import { useHandTrackingGloveStatus } from "@/hooks/handTracking/useHandTrackingGloveStatus";
import { useDebugStore } from "@/hooks/debug/useDebugStore";

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

const LANDMARK_FILL = "#67e8f9"; // cyan-300, opaque interior
const LANDMARK_STROKE = "#0c4a6e"; // sky-900, dark blue outline
const LANDMARK_STROKE_FIST = "#1e3a8a"; // blue-900, thicker accent when fist
const CONNECTION_STROKE = "#ffffff"; // white bones
const INDEX_TIP_LANDMARK = 8;

export function HandTrackingVisualizer(): React.JSX.Element | null {
  const { hands, status } = useHandTrackingSnapshot();
  const showHandTrackingSvg = useDebugStore((debug) =>
    debug.getShowHandTrackingSvg(),
  );
  const gloves = useHandTrackingGloveStatus((state) => state.gloves);
  const hasLoadedGlove = Object.values(gloves).some(
    (gloveStatus) => gloveStatus === "loaded",
  );

  if (
    status === "idle" ||
    hands.length === 0 ||
    (hasLoadedGlove && !showHandTrackingSvg)
  ) {
    return null;
  }

  return (
    <svg className="hand-tracking-visualizer" aria-hidden="true">
      {hands.map((hand, handIndex) => {
        const landmarks = hand.landmarks;
        if (landmarks.length === 0) return null;

        const landmarkStroke = hand.isFist
          ? LANDMARK_STROKE_FIST
          : LANDMARK_STROKE;

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
                  stroke={CONNECTION_STROKE}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              );
            })}

            {landmarks.map((landmark, landmarkIndex) => (
              <circle
                key={landmarkIndex}
                cx={`${(1 - landmark.x) * 100}%`}
                cy={`${landmark.y * 100}%`}
                r={landmarkIndex === INDEX_TIP_LANDMARK ? 6 : 4}
                fill={LANDMARK_FILL}
                stroke={landmarkStroke}
                strokeWidth={hand.isFist ? 2.5 : 2}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
