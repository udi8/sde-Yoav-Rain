// wa.me with no phone number opens WhatsApp's own contact/group picker with
// the text pre-filled — no Business API or backend needed, and it's exactly
// how a "share to WhatsApp" action normally works.
export function buildWhatsAppShareUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildDailyReadingMessage({ dateLabel, amountMm, cumulativeMm, seasonLabel }) {
  return [
    'מד-גשם שדה יואב 🌧️',
    dateLabel,
    `גשם היום: ${amountMm ?? '—'} מ״מ`,
    `מצטבר לעונת ${seasonLabel}: ${cumulativeMm} מ״מ`,
    '',
    'לגרפים ולהיסטוריה המלאה:',
    'https://sde-yoav-rain.web.app',
  ].join('\n');
}
