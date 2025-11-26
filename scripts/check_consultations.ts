import postgres from 'postgres';
import 'dotenv/config';

async function checkConsultations() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set in .env");
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log("🔍 Checking recent chatbot consultations...");
    
    // Fetch the 5 most recent consultations
    const consultations = await sql`
      SELECT 
        id, 
        name, 
        email, 
        phone, 
        created_at, 
        issue_category,
        completed_steps
      FROM consultations 
      ORDER BY created_at DESC 
      LIMIT 5;
    `;

    if (consultations.length === 0) {
      console.log("⚠️ No consultations found.");
    } else {
      console.log(`✅ Found ${consultations.length} recent consultations:`);
      console.log("--------------------------------------------------------------------------------");
      consultations.forEach(c => {
        console.log(`ID: ${c.id}`);
        console.log(`Name: ${c.name}`);
        console.log(`Email: ${c.email}`);
        console.log(`Date: ${c.created_at}`);
        console.log(`Issue: ${c.issue_category}`);
        console.log(`Progress: ${JSON.stringify(c.completed_steps)}`);
        console.log("--------------------------------------------------------------------------------");
      });
    }

  } catch (error) {
    console.error("❌ Error querying database:", error);
  } finally {
    await sql.end();
  }
}

checkConsultations();
