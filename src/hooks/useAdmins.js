import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

// Subscribes to the `admins` collection. Only readable by existing admins
// (see firestore.rules) — used by the admin management screen.
export function useAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'admins'), orderBy('addedAt', 'asc'));
    return onSnapshot(
      q,
      (snap) => {
        setAdmins(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
  }, []);

  return { admins, loading, error };
}
