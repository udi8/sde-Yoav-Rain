// Emails allowed into the admin area. This list is purely cosmetic on the
// frontend (hiding/showing the admin UI) — the real gate is the identical
// list hardcoded in firestore.rules. Keep the two in sync by hand; there are
// no Cloud Functions on the free Spark plan to share this from one place.
export const ADMIN_EMAILS = [
  'udii.idan@gmail.com',
  // TODO: replace with Yigal's real Google account email
  'yigal.sharoni@gmail.com',
];

export function isAdminEmail(email) {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
