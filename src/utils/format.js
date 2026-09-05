// Displays an ISO "YYYY-MM-DD" reading date in the Israeli DD.MM.YYYY
// convention. Storage/keys/sorting stay on the ISO string — only display
// goes through this.
export function formatDateIL(dateStr) {
  const d = typeof dateStr === 'string' ? new Date(dateStr + 'T00:00:00') : dateStr;
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
