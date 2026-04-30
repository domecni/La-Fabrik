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
        path: "/docs/target-architecture",
        title: "Target Architecture",
        subtitle: "Next direction",
        meta: "03",
      },
      {
        path: "/docs/technical-editor",
        title: "Editor Technical Notes",
        subtitle: "Implementation details",
        meta: "04",
      },
      {
        path: "/docs/hand-tracking",
        title: "Hand Tracking Technical Notes",
        subtitle: "Webcam interaction pipeline",
        meta: "05",
      },
      {
        path: "/docs/zustand",
        title: "Zustand Game State",
        subtitle: "Progression store",
        meta: "06",
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
        meta: "07",
      },
      {
        path: "/docs/main-feature",
        title: "Main Feature",
        subtitle: "Repair-game prototype",
        meta: "08",
      },
      {
        path: "/docs/editor",
        title: "Editor User Guide",
        subtitle: "Editing workflow",
        meta: "09",
      },
      {
        path: "/docs/animation",
        title: "Animation & 3D Model System",
        subtitle: "Components and usage",
        meta: "010",
      },
    ],
  },
];
