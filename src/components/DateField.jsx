import { formatDateIL } from '../utils/format';

// The native date picker (calendar popup) is worth keeping — it's what
// makes picking a date convenient. But the value it *displays* in the
// closed field is controlled by the phone's OS locale, not by this page,
// which is why it can show up as "Sep 2026 12" instead of an Israeli
// date. This keeps the real <input type="date"> fully functional —
// tapping it still opens the OS calendar — but makes it invisible and
// stacks a plain text label on top that always shows our own
// DD.MM.YYYY formatting, regardless of the device's locale.
export function DateField({ id, value, onChange, required }) {
  return (
    <div className="date-field">
      <span className="date-field-display" aria-hidden="true">
        {value ? formatDateIL(value) : 'יום.חודש.שנה'}
      </span>
      <input
        id={id}
        type="date"
        lang="he"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}
