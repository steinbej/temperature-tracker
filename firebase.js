// Import Firebase Admin SDK
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with service account
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Export Firestore instance and helper functions
module.exports = {
    db,
    collection: (db, collectionName) => db.collection(collectionName),
    addDoc: (collection, data) => collection.add(data),
    getDocs: (query) => query.get(),
    deleteDoc: (docRef) => docRef.delete(),
    doc: (db, collectionName, id) => db.collection(collectionName).doc(id),
    query: (collection, ...constraints) => {
        let q = collection;
        constraints.forEach(constraint => {
            q = constraint(q);
        });
        return q;
    },
    orderBy: (field, direction) => (query) => query.orderBy(field, direction)
};