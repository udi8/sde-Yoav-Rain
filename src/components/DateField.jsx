import { useEffect, useState } from 'react';

// Native <input type="date"> renders its picker/display in whatever
// format and language the phone's OS is set to (e.g. "Sep 2026 12" on an
// English-locale iPhone) — that's browser/OS behavior the page can't
// override. This is a plain typed DD.MM.YYYY field instead, so the format
// is always the same regardless of device settings. Internally it still
// produces/accepts the same "YYYY-MM-DD" string the rest of the app uses.

function isoToDisplay(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export function DateField({ id, value, onChange, required }) {
  const [text, setText] = useState(() => isoToDisplay(value));

  useEffect(() => {
    setText(isoToDisplay(value));
  }, [value]);

  function handleChange(e) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8); // DDMMYYYY
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}.${digits.slice(2)}`;
    }
    setText(formatted);

    if (digits.length === 8) {
      const d = Number(digits.slice(0, 2));
      const m = Number(digits.slice(2, 4));
      const y = Number(digits.slice(4, 8));
      const asDate = new Date(y, m - 1, d);
      const isValid =
        asDate.getFullYear() === y && asDate.getMonth() === m - 1 && asDate.getDate() === d;
      if (isValid) {
        onChange(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
      }
    }
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      dir="ltr"
      style={{ textAlign: 'center' }}
      placeholder="יום.חודש.שנה"
      value={text}
      onChange={handleChange}
      required={required}
    />
  );
}
