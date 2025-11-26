import postgres from 'postgres';
import 'dotenv/config';

async function verifyTables() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set in .env");
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log("🔍 Checking database tables...");
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;

    if (tables.length === 0) {
      console.log("⚠️ No tables found in public schema.");
    } else {
      console.log(`✅ Found ${tables.length} tables in the database:`);
      console.log("----------------------------------------");
      tables.forEach(t => console.log(`- ${t.table_name}`));
      console.log("----------------------------------------");

      // Check row count for consultations
      if (tables.some(t => t.table_name === 'consultations')) {
        const [{ count }] = await sql`SELECT count(*) FROM consultations`;
        console.log(`📊 Rows in 'consultations' table: ${count}`);
      }
      
      // Check specifically for some critical tables mentioned in the drop list
      const criticalTables = ['users', 'clinics', 'assessments', 'consultations'];
      const foundCritical = criticalTables.filter(ct => tables.some(t => t.table_name === ct));
      
      if (foundCritical.length === criticalTables.length) {
        console.log("✅ Critical tables (users, clinics, assessments) are present.");
      } else {
        console.warn("⚠️ Some critical tables might be missing:", criticalTables.filter(ct => !tables.some(t => t.table_name === ct)));
      }
    }

  } catch (error) {
    console.error("❌ Error querying database:", error);
  } finally {
    await sql.end();
  }
}

verifyTables();
