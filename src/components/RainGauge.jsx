// Small illustrated rain-gauge: water fill = season total / multi-year
// average, capped at the top of the glass. The dashed line marks the
// average itself, so a full glass up to the line means "on average."
export function RainGauge({ total, average }) {
  const ratio = Math.min(total / average, 1);
  const top = 42;
  const bottom = 164;
  const h = (bottom - top) * ratio;

  return (
    <svg
      width="54"
      height="176"
      viewBox="0 0 54 176"
      role="img"
      aria-label={`מד גשם: ${total} מתוך ממוצע ${average} מ״מ`}
    >
      <path
        d="M4 4 L50 4 L35 26 L19 26 Z"
        style={{ fill: 'var(--soil)', stroke: 'var(--ink)' }}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect
        x="16"
        y="26"
        width="22"
        height="140"
        style={{ fill: 'var(--tag-inner)', stroke: 'var(--ink)' }}
        strokeWidth="1.5"
      />
      <rect
        x="17.5"
        y={bottom - h}
        width="19"
        height={h}
        style={{ fill: 'var(--water)', transition: 'y .8s ease, height .8s ease' }}
      />
      <g style={{ stroke: 'var(--ink)' }} strokeWidth="1">
        <line x1="38" y1="42" x2="47" y2="42" />
        <line x1="38" y1="72" x2="43" y2="72" />
        <line x1="38" y1="102" x2="47" y2="102" />
        <line x1="38" y1="132" x2="43" y2="132" />
      </g>
      <line
        x1="8"
        y1="42"
        x2="50"
        y2="42"
        style={{ stroke: 'var(--earth)' }}
        strokeWidth="1.5"
        strokeDasharray="3 3"
      />
      <rect x="11" y="166" width="32" height="7" style={{ fill: 'var(--soil-dark)' }} />
    </svg>
  );
}
