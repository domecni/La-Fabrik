interface TutorialOverlayProps {
  icon: React.ReactNode;
  text: string;
}

/**
 * Full-screen instructional overlay shown during onboarding moments
 * (movement intro, hand-tracking intro, ...). Pure presentation: parent
 * decides when to mount it and when to unmount it.
 */
export function TutorialOverlay({
  icon,
  text,
}: TutorialOverlayProps): React.JSX.Element {
  return (
    <div className="tutorial-overlay" aria-live="polite">
      <div className="tutorial-overlay__panel">
        <div className="tutorial-overlay__icon">{icon}</div>
        <p className="tutorial-overlay__text">{text}</p>
      </div>
    </div>
  );
}
