import illustrationUrl from '../assets/hero-illustration.svg';
import logoUrl from '../assets/logo-sde-yoav-60.png';

// The public page's hero illustration: Yigal — who measures the rain —
// mowing the lawn by the dining hall in the rain, with the kibbutz's
// 60th-anniversary logo blended into the sky. Unlike FieldHeader's thin
// "slice" strip, this keeps its own proportions — see PublicPage.css for
// why it's capped to 640px on desktop instead of stretched full-bleed.
export function FieldHero() {
  return (
    <div className="field-hero">
      <img
        src={illustrationUrl}
        alt="איור: יגאל על המכסחת בזווית, מתרחק מחדר האוכל של שדה יואב ומכסח את הדשא בגשם"
        className="field-hero-illustration"
      />
      <img src={logoUrl} alt="לוגו קיבוץ שדה יואב 60" className="field-hero-logo" />
    </div>
  );
}
