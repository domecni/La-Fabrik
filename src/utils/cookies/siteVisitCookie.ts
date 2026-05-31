const COOKIE_NAME = "siteVisited";
const EXPIRY_HOURS = 24;

/**
 * Check if the site has been visited today (within 24 hours)
 */
export function hasSiteBeenVisitedToday(): boolean {
  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === COOKIE_NAME && value === "true") {
      return true;
    }
  }

  return false;
}

/**
 * Set the site visited cookie with 24-hour expiration
 */
export function setSiteVisited(): void {
  const expiryDate = new Date();
  expiryDate.setTime(expiryDate.getTime() + EXPIRY_HOURS * 60 * 60 * 1000);

  document.cookie = `${COOKIE_NAME}=true; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
}

/**
 * Clear the site visited cookie (useful for debugging)
 */
export function clearSiteVisited(): void {
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}
