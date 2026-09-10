/**
 * upload-seed.js - One-click Firestore Data Seeder
 * Populates your fresh Firestore database with Image Mobiles branches, technicians, and jobs.
 * 
 * Usage:
 * 1. Ensure your Firebase config is in admin-web/src/environments/environment.ts
 * 2. Run: node firebase/upload-seed.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Read seed data
const seedDataPath = path.join(__dirname, 'seed-data.json');
const rawData = fs.readFileSync(seedDataPath, 'utf8');
const seedData = JSON.parse(rawData);

async function seedFirestore(firebaseConfig) {
  console.log("Connecting to Firebase project:", firebaseConfig.projectId);
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log("\n1. Seeding Branches...");
  for (const branch of seedData.branches) {
    await setDoc(doc(db, 'branches', branch.id), branch);
    console.log(`  ✔ Uploaded branch: ${branch.name} (${branch.id})`);
  }

  console.log("\n2. Seeding Technicians...");
  for (const tech of seedData.technicians) {
    await setDoc(doc(db, 'technicians', tech.id), tech);
    console.log(`  ✔ Uploaded technician: ${tech.name} (${tech.id})`);
  }

  console.log("\n3. Seeding Service Jobs...");
  for (const job of seedData.jobs) {
    await setDoc(doc(db, 'jobs', job.id), job);
    console.log(`  ✔ Uploaded job: ${job.jobNumber} (${job.id})`);
  }

  console.log("\n🎉 All seed data successfully uploaded to Cloud Firestore!");
  process.exit(0);
}

// Check if environment file exists with actual keys
const envPath = path.join(__dirname, '../admin-web/src/environments/environment.ts');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/firebase:\s*(\{[\s\S]*?\})/);
  if (match) {
    try {
      const configStr = match[1]
        .replace(/(\w+):/g, '"$1":')
        .replace(/'/g, '"');
      const config = JSON.parse(configStr);
      if (config.apiKey !== "YOUR_API_KEY") {
        seedFirestore(config).catch(err => {
          console.error("Seeding failed:", err);
        });
      } else {
        console.log("ℹ Please update admin-web/src/environments/environment.ts with your real Firebase config keys first.");
      }
    } catch (e) {
      console.log("ℹ Ready for your Firebase config keys in admin-web/src/environments/environment.ts");
    }
  }
}
