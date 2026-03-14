/**
 * Gender-aware greeting utilities for Cameroonian school context.
 * In Cameroonian schools, teachers are addressed by honorific + last name:
 *   Male   → "Mr. Nkemnji"
 *   Female → "Mrs. Ayo"
 *   Unknown → full name "John Nkemnji"
 */

export function getHonorific(gender: string | null | undefined): string {
  if (gender === "MALE") return "Mr.";
  if (gender === "FEMALE") return "Mrs.";
  return "";
}

/**
 * Returns "Mr. Nkemnji" / "Mrs. Ayo" / "John Nkemnji" depending on gender.
 */
export function getDisplayName(
  firstName: string,
  lastName: string,
  gender: string | null | undefined
): string {
  const honorific = getHonorific(gender);
  if (honorific) return `${honorific} ${lastName}`;
  return `${firstName} ${lastName}`;
}

/**
 * Time-of-day greeting string.
 */
export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Returns { greeting: "Good morning", name: "Mr. Nkemnji" }
 */
export function getFullGreeting(
  firstName: string,
  lastName: string,
  gender: string | null | undefined
): { greeting: string; name: string } {
  return {
    greeting: getTimeGreeting(),
    name: getDisplayName(firstName, lastName, gender),
  };
}
