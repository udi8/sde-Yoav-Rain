import { useEffect, useRef } from 'react';
import './PullToRefresh.css';

const THRESHOLD = 70; // px pulled before release triggers a refresh
const MAX_PULL = 110;

// Native mobile browsers don't reliably offer their own pull-to-refresh
// (Safari's is inconsistent, and it's absent entirely once a page runs as
// an installed/home-screen app), so this reimplements the gesture by hand.
// Data itself is already live via Firestore's onSnapshot, so this is purely
// the familiar physical gesture people expect — a full reload is enough.
export function PullToRefresh({ children }) {
  const contentRef = useRef(null);
  const indicatorRef = useRef(null);
  const spinnerRef = useRef(null);

  useEffect(() => {
    const content = contentRef.current;
    const indicator = indicatorRef.current;
    const spinner = spinnerRef.current;

    let startY = null;
    let pulling = false;
    let refreshing = false;
    let currentPull = 0;

    function setPull(px) {
      currentPull = Math.min(Math.max(px, 0), MAX_PULL);
      content.style.transform = currentPull ? `translateY(${currentPull}px)` : '';
      indicator.style.opacity = currentPull > 4 ? String(Math.min(currentPull / THRESHOLD, 1)) : '0';
      spinner.style.transform = `rotate(${Math.min((currentPull / THRESHOLD) * 180, 180)}deg)`;
    }

    function onTouchStart(e) {
      if (window.scrollY > 0 || refreshing) return;
      startY = e.touches[0].clientY;
      pulling = true;
      content.style.transition = 'none';
    }

    function onTouchMove(e) {
      if (!pulling || startY === null) return;
      if (window.scrollY > 0) {
        pulling = false;
        setPull(0);
        return;
      }
      const delta = e.touches[0].clientY - startY;
      if (delta <= 0) {
        setPull(0);
        return;
      }
      e.preventDefault();
      setPull(delta * 0.5);
    }

    function onTouchEnd() {
      if (!pulling) return;
      pulling = false;
      startY = null;
      content.style.transition = 'transform 0.2s ease';
      if (currentPull >= THRESHOLD) {
        refreshing = true;
        spinner.classList.add('ptr-spinning');
        window.location.reload();
      } else {
        setPull(0);
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  return (
    <div className="ptr-root">
      <div className="ptr-indicator" ref={indicatorRef} aria-hidden="true">
        <span className="ptr-spinner" ref={spinnerRef} />
      </div>
      <div className="ptr-content" ref={contentRef}>
        {children}
      </div>
    </div>
  );
}
