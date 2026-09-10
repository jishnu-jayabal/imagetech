/**
 * seed-rest.js - Zero-dependency Firestore Seeder via Google REST API
 * Populates Image Mobiles collections (branches, technicians, jobs) using native fetch.
 */

const fs = require('fs');
const path = require('path');

const projectId = "imagemobiles-45aeb";
const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

// Helper: convert standard JS value to Firestore REST Value format
function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: val.toString() } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreDoc(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toFirestoreValue(v);
  }
  return { fields };
}

async function uploadDoc(collectionName, docId, data) {
  const url = `${baseUrl}/${collectionName}/${docId}`;
  const body = JSON.stringify(toFirestoreDoc(data));

  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: body
  });

  const resJson = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to upload ${collectionName}/${docId}: ${JSON.stringify(resJson)}`);
  }
  return resJson;
}

async function run() {
  console.log(`\n🚀 Seeding Firestore for project [${projectId}]...`);
  const raw = fs.readFileSync(path.join(__dirname, 'seed-data.json'), 'utf8');
  const data = JSON.parse(raw);

  console.log("1. Uploading Branches...");
  for (const b of data.branches) {
    await uploadDoc('branches', b.id, b);
    console.log(`   ✔ Uploaded: ${b.name}`);
  }

  console.log("2. Uploading Technicians...");
  for (const t of data.technicians) {
    await uploadDoc('technicians', t.id, t);
    console.log(`   ✔ Uploaded: ${t.name}`);
  }

  console.log("3. Uploading Jobs...");
  for (const j of data.jobs) {
    await uploadDoc('jobs', j.id, j);
    console.log(`   ✔ Uploaded: ${j.jobNumber}`);
  }

  console.log("\n🎉 SUCCESS! All collections have been created in your live Firestore database!");
}

run().catch(err => {
  console.error("\n❌ Seeding error:", err.message);
});
