import illustrationUrl from '../assets/field-illustration.svg';
import logoUrl from '../assets/logo-sde-yoav-60.png';

// The public page's hero illustration: a painterly scene (tractor plowing
// a rainy field) with the kibbutz's 60th-anniversary logo blended into the
// sky. Unlike FieldHeader's thin "slice" strip, this keeps its own
// proportions — see FieldHero.css for why it's capped to 640px on desktop
// instead of stretched full-bleed.
export function FieldHero() {
  return (
    <div className="field-hero">
      <img
        src={illustrationUrl}
        alt="איור: טרקטור ישן חורש שדה בגשם, אנפות לבנות בתלמים, גבעות וחורשת אקליפטוסים ברקע"
        className="field-hero-illustration"
      />
      <img src={logoUrl} alt="לוגו קיבוץ שדה יואב 60" className="field-hero-logo" />
    </div>
  );
}
