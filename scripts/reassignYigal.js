// One-off migration: reassign every reading currently attributed to the
// placeholder first-name-only "יגאל" to his full registered name, now that
// he has his own admin account (igalsharony@gmail.com, firstName/lastName
// set to יגאל/שרוני).
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

async function main() {
  const snap = await db.collection('readings').where('enteredBy', '==', 'יגאל').get();
  console.log(`found ${snap.size} readings to reassign`);

  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 500) {
    const batch = db.batch();
    for (const d of docs.slice(i, i + 500)) {
      batch.update(d.ref, { enteredBy: 'יגאל שרוני' });
    }
    await batch.commit();
    console.log(`committed ${Math.min(i + 500, docs.length)}/${docs.length}`);
  }

  const remaining = await db.collection('readings').where('enteredBy', '==', 'יגאל').get();
  console.log(`remaining with bare "יגאל": ${remaining.size}`);
}

main().then(() => process.exit(0));
