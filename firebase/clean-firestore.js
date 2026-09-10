/**
 * clean-firestore.js - Removes demo records from Cloud Firestore
 */

const projectId = "imagemobiles-45aeb";
const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

async function deleteDoc(collection, id) {
  try {
    const res = await fetch(`${baseUrl}/${collection}/${id}`, { method: 'DELETE' });
    if (res.ok) {
      console.log(`✔ Deleted: ${collection}/${id}`);
    } else {
      console.log(`ℹ Notice: ${collection}/${id} might already be deleted or not found`);
    }
  } catch (err) {
    console.error(`Error deleting ${collection}/${id}:`, err);
  }
}

async function clean() {
  console.log(`\n🧹 Cleaning demo documents from Firestore [${projectId}]...`);
  
  // Clean demo branches
  await deleteDoc('branches', 'branch_mg_road');
  await deleteDoc('branches', 'branch_edappally');

  // Clean demo technicians
  await deleteDoc('technicians', 'tech_rahul');
  await deleteDoc('technicians', 'tech_anand');

  // Clean demo jobs
  await deleteDoc('jobs', 'job_7204');
  await deleteDoc('jobs', 'job_7205');

  console.log("✨ Firestore is now completely clean and ready for real data!\n");
}

clean();
