interface AppLoadingIndicatorProps {
  className?: string | undefined;
  floating?: boolean;
}

export function AppLoadingIndicator({
  className,
  floating = false,
}: AppLoadingIndicatorProps): React.JSX.Element {
  const classes = [
    "app-loading-indicator",
    floating ? "app-loading-indicator--floating" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} role="status" aria-live="polite">
      <span>Loading...</span>
      <svg
        className="app-loading-indicator__spinner"
        viewBox="0 0 32 32"
        aria-hidden="true"
      >
        <path
          d="M16 3a13 13 0 1 1-9.2 3.8"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="3.5"
        />
        <path
          d="M6.8 6.8V2.8H2.8"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3.5"
        />
      </svg>
    </div>
  );
}
