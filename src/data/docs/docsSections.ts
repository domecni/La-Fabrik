interface DocSection {
  path: string;
  title: string;
  subtitle: string;
  meta: string;
}

interface DocGroup {
  label: string;
  sections: DocSection[];
}

export const docGroups: DocGroup[] = [
  {
    label: "Technical",
    sections: [
      {
        path: "/docs",
        title: "README",
        subtitle: "Project overview",
        meta: "01",
      },
      {
        path: "/docs/architecture",
        title: "Current Architecture",
        subtitle: "Runtime structure",
        meta: "02",
      },
      {
        path: "/docs/scene-runtime",
        title: "Scene Runtime",
        subtitle: "Loading and spawn gates",
        meta: "03",
      },
      {
        path: "/docs/repair-game",
        title: "Repair Game",
        subtitle: "Gameplay implementation",
        meta: "04",
      },
      {
        path: "/docs/interaction",
        title: "Interaction System",
        subtitle: "Trigger, grab, hand input",
        meta: "05",
      },
      {
        path: "/docs/target-architecture",
        title: "Target Architecture",
        subtitle: "Next direction",
        meta: "06",
      },
      {
        path: "/docs/technical-editor",
        title: "Editor Technical Notes",
        subtitle: "Implementation details",
        meta: "07",
      },
      {
        path: "/docs/audio",
        title: "Audio Technical Notes",
        subtitle: "Music, dialogue, SRT, and SFX",
        meta: "08",
      },
      {
        path: "/docs/hand-tracking",
        title: "Hand Tracking Technical Notes",
        subtitle: "Webcam interaction pipeline",
        meta: "09",
      },
      {
        path: "/docs/zustand",
        title: "Zustand Stores",
        subtitle: "Game, settings, subtitles",
        meta: "10",
      },
      {
        path: "/docs/three-debugging",
        title: "Three Debugging",
        subtitle: "Step into Three.js internals",
        meta: "11",
      },
      {
        path: "/docs/map-performance",
        title: "Map Performance",
        subtitle: "Draw calls, triangles, and streaming",
        meta: "12",
      },
    ],
  },
  {
    label: "User",
    sections: [
      {
        path: "/docs/features",
        title: "Features",
        subtitle: "Implemented scope",
        meta: "13",
      },
      {
        path: "/docs/main-feature",
        title: "Main Feature",
        subtitle: "Repair-game prototype",
        meta: "14",
      },
      {
        path: "/docs/editor",
        title: "Editor User Guide",
        subtitle: "Editing workflow",
        meta: "15",
      },
      {
        path: "/docs/animation",
        title: "Animation & 3D Model System",
        subtitle: "Components and usage",
        meta: "16",
      },
    ],
  },
  {
    label: "Review",
    sections: [
      {
        path: "/docs/code-review",
        title: "Code Review Prep",
        subtitle: "Presentation support",
        meta: "17",
      },
    ],
  },
];
