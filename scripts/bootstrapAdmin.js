#!/usr/bin/env node
// One-time bootstrap: seeds an `admins/{email}` doc directly via a service
// account, bypassing firestore.rules. Needed because isAdmin() in the rules
// requires an existing admin doc — nobody can add the very first admin
// through the app itself, so it has to be written from the backend once.
// After that, existing admins can add/remove others from the admin page.
//
//   node scripts/bootstrapAdmin.js <path-to-service-account-key.json> <email>
import fs from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const [, , keyPath, emailArg] = process.argv;
if (!keyPath || !emailArg) {
  console.error('Usage: node scripts/bootstrapAdmin.js <path-to-service-account-key.json> <email>');
  process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

db.collection('admins')
  .doc(email)
  .set({ email, addedBy: 'bootstrap-script', addedAt: FieldValue.serverTimestamp() })
  .then(() => {
    console.log(`${email} added as admin.`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
