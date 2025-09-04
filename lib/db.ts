// lib/db.ts
import { neon } from '@neondatabase/serverless';

// Use the same database URL for both app data and invoice data
const sql = neon(process.env.DATABASE_URL!);

export default sql;

// Database initialization functions
export async function initializeInvoiceTables() {
  try {
    // Create invoice_uploads table
    await sql`
      CREATE TABLE IF NOT EXISTS invoice_uploads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        original_filename VARCHAR(255) NOT NULL,
        content BYTEA NOT NULL,
        filesize INTEGER NOT NULL,
        sha256 VARCHAR(64) NOT NULL UNIQUE,
        estimated_page_count INTEGER DEFAULT 1,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id VARCHAR(255) -- For user association with Stack Auth
      );
    `;

    // Create invoices table
    await sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        vendor VARCHAR(255),
        company VARCHAR(255),
        invoice_number VARCHAR(100),
        po_number VARCHAR(100),
        invoice_date DATE,
        due_date DATE,
        amount_due DECIMAL(10,2),
        total DECIMAL(10,2),
        document_type VARCHAR(50),
        customer_name VARCHAR(255),
        invoice_total DECIMAL(10,2),
        sub_total DECIMAL(10,2),
        total_tax DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id VARCHAR(255) -- For user association with Stack Auth
      );
    `;

    // Create indexes for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_invoice_uploads_user_id ON invoice_uploads(user_id);
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_invoices_filename ON invoices(filename);
    `;

    console.log('Invoice tables initialized successfully');
  } catch (error) {
    console.error('Error initializing invoice tables:', error);
    throw error;
  }
}

// Existing agentic request functions (from Recupare)
export async function createAgenticUser(email: string, name?: string) {
  const result = await sql`
    INSERT INTO agentic_users (email, name, created_at)
    VALUES (${email}, ${name || null}, NOW())
    ON CONFLICT (email) DO UPDATE SET
      name = COALESCE(EXCLUDED.name, agentic_users.name),
      updated_at = NOW()
    RETURNING *;
  `;
  return result[0];
}

export async function getAgenticUserByEmail(email: string) {
  const result = await sql`
    SELECT * FROM agentic_users WHERE email = ${email} LIMIT 1;
  `;
  return result[0] || null;
}

export async function createAgenticRequest(
  userId: string,
  targetObject: string,
  boundedArea: string,
  instructions: string
) {
  const result = await sql`
    INSERT INTO agentic_requests (
      user_id, target_object, bounded_area, instructions, status, created_at, updated_at
    )
    VALUES (${userId}, ${targetObject}, ${boundedArea}, ${instructions}, 'pending', NOW(), NOW())
    RETURNING *;
  `;
  return result[0];
}

export async function getAgenticRequestsByUserId(userId: string) {
  const result = await sql`
    SELECT * FROM agentic_requests 
    WHERE user_id = ${userId} 
    ORDER BY created_at DESC;
  `;
  return result;
}

export async function updateAgenticRequestStatus(
  requestId: string,
  status: string,
  result?: any
) {
  const updateResult = await sql`
    UPDATE agentic_requests 
    SET status = ${status}, result = ${result ? JSON.stringify(result) : null}, updated_at = NOW()
    WHERE id = ${requestId}
    RETURNING *;
  `;
  return updateResult[0];
}

