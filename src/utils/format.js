// Displays an ISO "YYYY-MM-DD" reading date in the Israeli DD.MM.YYYY
// convention. Storage/keys/sorting stay on the ISO string — only display
// goes through this.
export function formatDateIL(dateStr) {
  const d = typeof dateStr === 'string' ? new Date(dateStr + 'T00:00:00') : dateStr;
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// "שבת 07.11" — weekday name + day.month, no year. Used where the date
// sits right next to "today"/recent context and the year would be noise.
export function formatWeekdayShortIL(dateStr) {
  const d = typeof dateStr === 'string' ? new Date(dateStr + 'T00:00:00') : dateStr;
  const weekday = d.toLocaleDateString('he-IL', { weekday: 'long' });
  const dayMonth = d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
  return `${weekday} ${dayMonth}`;
}
