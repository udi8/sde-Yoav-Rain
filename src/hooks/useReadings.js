import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

// Subscribes to the full `readings` collection, ordered by date. Small
// dataset (a few hundred docs total across all seasons) so loading it all
// client-side is simpler than paginating, and it's what both the season
// chart and the season-comparison view need anyway.
export function useReadings() {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'readings'), orderBy('date', 'asc'));
    return onSnapshot(
      q,
      (snap) => {
        setReadings(snap.docs.map((d) => d.data()));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
  }, []);

  return { readings, loading, error };
}
