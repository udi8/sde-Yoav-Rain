import fieldHeaderUrl from '../assets/field-header.svg';

// Decorative plowed-field illustration spanning the full header width.
export function FieldHeader({ height = 140 }) {
  return (
    <img
      src={fieldHeaderUrl}
      alt=""
      aria-hidden="true"
      className="field-header"
      style={{ height }}
    />
  );
}
