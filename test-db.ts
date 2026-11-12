import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// In real app, we'd use service account credentials, 
// here in the AI Studio environment, we can use the default app
const app = initializeApp();
const db = getFirestore(app);

async function testDb() {
  try {
    const col = await db.listCollections();
    console.log('Collections:', col.map(c => c.id));
  } catch (e) {
    console.error('DB test failed:', e);
  }
}
testDb();
