// Readings show who entered them. A raw email/display-name from a Google
// account (e.g. "udi idan") isn't great to show publicly — prefer the
// first/last name an admin sets for themselves on the admins list, falling
// back to the email only when no name has been set yet.
export function formatAdminName({ firstName, lastName, email } = {}) {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim();
  return name || email || '';
}
