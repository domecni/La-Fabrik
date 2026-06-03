import { useHandTrackingSnapshot } from "@/hooks/handTracking/useHandTrackingSnapshot";
import { useDebugStore } from "@/hooks/debug/useDebugStore";

// MediaPipe indexes the 21 hand landmarks predictably:
// 0 wrist, 1-4 thumb (base→tip), 5-8 index, 9-12 middle, 13-16 ring, 17-20 pinky.
const FINGER_LANDMARKS: Array<readonly number[]> = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 16],
  [17, 18, 19, 20],
];
const SKELETON_BONES: Array<[number, number]> = [
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

const HAND_FILL = "#bfdbfe"; // blue-200, light interior
const HAND_OUTLINE_COLOR = "#1e3a8a"; // blue-900, crisp dark outline
const HAND_OUTLINE_RADIUS = 2; // px
// Shrink the rendered hand around its centroid. Grab/physics keep using raw
// landmarks elsewhere, so the silhouette is just visually smaller.
const RENDER_SCALE = 0.65;
const FINGER_THICKNESS_FACTOR = 0.08; // fraction of (scaled) hand length
const WRIST_HALF_WIDTH = 0.28;
const SKELETON_STROKE = "rgba(30, 58, 138, 0.22)";
const SKELETON_DOT_FILL = "rgba(30, 58, 138, 0.35)";
const FILTER_ID = "hand-tracking-outline";

export function HandTrackingVisualizer(): React.JSX.Element | null {
  const { hands, status } = useHandTrackingSnapshot();
  const showHandTrackingModel = useDebugStore((debug) =>
    debug.getShowHandTrackingModel(),
  );

  if (status === "idle" || hands.length === 0 || showHandTrackingModel) {
    return null;
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  return (
    <svg className="hand-tracking-visualizer" aria-hidden="true">
      <defs>
        {/* Dilate the merged alpha of all child shapes by HAND_OUTLINE_RADIUS
            and subtract the original to get a 1-ring outline. Lets the palm
            polygon and the five finger tubes share a single crisp outline
            with no internal seams where they overlap. */}
        <filter id={FILTER_ID} x="-10%" y="-10%" width="120%" height="120%">
          <feMorphology
            operator="dilate"
            radius={HAND_OUTLINE_RADIUS}
            in="SourceAlpha"
            result="dilated"
          />
          <feComposite
            operator="out"
            in="dilated"
            in2="SourceAlpha"
            result="ringAlpha"
          />
          <feFlood floodColor={HAND_OUTLINE_COLOR} result="ringColor" />
          <feComposite
            operator="in"
            in="ringColor"
            in2="ringAlpha"
            result="coloredRing"
          />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="coloredRing" />
          </feMerge>
        </filter>
      </defs>

      {hands.map((hand, handIndex) => {
        const landmarks = hand.landmarks;
        if (landmarks.length < 21) return null;

        // Centroid of all 21 landmarks in pixel space (mirrored x).
        let cx = 0;
        let cy = 0;
        for (const lm of landmarks) {
          cx += (1 - lm.x) * viewportWidth;
          cy += lm.y * viewportHeight;
        }
        cx /= landmarks.length;
        cy /= landmarks.length;

        // Render coordinates: shrink each landmark toward the centroid.
        const px = (i: number): number => {
          const lm = landmarks[i];
          return lm
            ? cx + ((1 - lm.x) * viewportWidth - cx) * RENDER_SCALE
            : cx;
        };
        const py = (i: number): number => {
          const lm = landmarks[i];
          return lm ? cy + (lm.y * viewportHeight - cy) * RENDER_SCALE : cy;
        };

        const handLengthPx = Math.hypot(px(12) - px(0), py(12) - py(0));
        const fingerThickness = Math.max(
          6,
          handLengthPx * FINGER_THICKNESS_FACTOR,
        );
        const halfFingerThickness = fingerThickness / 2;
        const dotRadius = Math.max(1.2, fingerThickness * 0.1);

        // Perpendicular to the palm centerline (wrist → middle MCP), used to
        // place two synthetic wrist corners on either side of landmark 0.
        const cdx = px(9) - px(0);
        const cdy = py(9) - py(0);
        const clen = Math.hypot(cdx, cdy) || 1;
        const perpX = -cdy / clen;
        const perpY = cdx / clen;
        const thumbSide =
          (px(1) - px(0)) * perpX + (py(1) - py(0)) * perpY >= 0 ? 1 : -1;
        const wristHalfWidth = handLengthPx * WRIST_HALF_WIDTH;
        const wristThumbX = px(0) + perpX * wristHalfWidth * thumbSide;
        const wristThumbY = py(0) + perpY * wristHalfWidth * thumbSide;
        const wristPinkyX = px(0) - perpX * wristHalfWidth * thumbSide;
        const wristPinkyY = py(0) - perpY * wristHalfWidth * thumbSide;

        // Palm outline: straight L between adjacent MCPs along the top (no
        // inter-finger dip — the morphology dilation rounds the MCP corners),
        // rounded heel via two Q curves bowing out to the synthetic wrist
        // corners.
        const palmD = [
          `M ${px(1)} ${py(1)}`,
          `L ${px(5)} ${py(5)}`,
          `L ${px(9)} ${py(9)}`,
          `L ${px(13)} ${py(13)}`,
          `L ${px(17)} ${py(17)}`,
          `Q ${wristPinkyX} ${wristPinkyY}, ${px(0)} ${py(0)}`,
          `Q ${wristThumbX} ${wristThumbY}, ${px(1)} ${py(1)}`,
          "Z",
        ].join(" ");

        // Each finger path starts halfFingerThickness inside the palm (toward
        // the next joint), so the rounded base cap sits hidden inside the palm
        // fill instead of bulging below the MCP.
        const fingerPathD = (joints: readonly number[]): string => {
          const baseIdx = joints[0];
          const nextIdx = joints[1];
          if (baseIdx === undefined || nextIdx === undefined) return "";
          const baseX = px(baseIdx);
          const baseY = py(baseIdx);
          const nextX = px(nextIdx);
          const nextY = py(nextIdx);
          const dx = nextX - baseX;
          const dy = nextY - baseY;
          const dlen = Math.hypot(dx, dy) || 1;
          const sx = baseX + (dx / dlen) * halfFingerThickness;
          const sy = baseY + (dy / dlen) * halfFingerThickness;
          return joints
            .map((idx, k) =>
              k === 0 ? `M ${sx} ${sy}` : `L ${px(idx)} ${py(idx)}`,
            )
            .join(" ");
        };

        return (
          <g key={`${hand.handedness}-${handIndex}`}>
            <g filter={`url(#${FILTER_ID})`}>
              <path d={palmD} fill={HAND_FILL} />
              {FINGER_LANDMARKS.map((joints, fingerIndex) => (
                <path
                  key={fingerIndex}
                  d={fingerPathD(joints)}
                  fill="none"
                  stroke={HAND_FILL}
                  strokeWidth={fingerThickness}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </g>

            {SKELETON_BONES.map(([from, to]) => (
              <line
                key={`bone-${from}-${to}`}
                x1={px(from)}
                y1={py(from)}
                x2={px(to)}
                y2={py(to)}
                stroke={SKELETON_STROKE}
                strokeWidth="1"
              />
            ))}
            {landmarks.map((_, landmarkIndex) => (
              <circle
                key={`dot-${landmarkIndex}`}
                cx={px(landmarkIndex)}
                cy={py(landmarkIndex)}
                r={dotRadius}
                fill={SKELETON_DOT_FILL}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
