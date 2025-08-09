import { neon } from "@neondatabase/serverless";
import { stackServerApp } from "./stack";

// ========================================
// TYPE DEFINITIONS
// ========================================

export interface AgenticUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface AgenticRequest {
  id: string;
  user_id: string;
  target_object: string;
  bounded_area: string;
  instructions: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'escalated';
  result: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export interface AgenticRequestWithUser extends AgenticRequest {
  user_name: string;
  user_email: string;
}

export interface AgenticAgentAction {
  id: string;
  request_id: string;
  agent_id: string;
  action_type: string;
  details: Record<string, unknown>;
  timestamp: Date;
}

export interface AgenticSystemStats {
  userCount: number;
  requestCount: number;
  pendingRequests: number;
}

export interface DatabaseRow {
  [key: string]: unknown;
}

export interface CountResult {
  count: string;
}

// ========================================
// ORIGINAL DATABASE FUNCTIONS (UNCHANGED)
// ========================================

export async function checkDbConnection(): Promise<string> {
  if (!process.env.DATABASE_URL) {
    return "No DATABASE_URL environment variable";
  }
  try {
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`SELECT version()`;
    console.log("Pg version:", result);
    return "Database connected";
  } catch (error) {
    console.error("Error connecting to the database:", error);
    return "Database not connected";
  }
}

export async function getAuthenticatedDbConnection() {
  // Get the current user from Stack Auth
  const user = await stackServerApp.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("No DATABASE_URL environment variable");
  }

  const sql = neon(process.env.DATABASE_URL);
  return { sql, user };
}

export async function executeAuthenticatedQuery(
  queryTemplate: TemplateStringsArray, 
  ...params: unknown[]
): Promise<DatabaseRow[]> {
  const { sql, user } = await getAuthenticatedDbConnection();

  try {
    // Log the query for audit purposes
    console.log(`User ${user.id} executing query:`, queryTemplate.join('?'));

    // Execute the query using template literal syntax
    const result = await sql(queryTemplate, ...params);
    return result as DatabaseRow[];
  } catch (error) {
    console.error(`Query failed for user ${user.id}:`, error);
    throw error;
  }
}

// Alternative function for dynamic queries (when you need to build queries programmatically)
export async function executeAuthenticatedDynamicQuery(queryString: string): Promise<DatabaseRow[]> {
  const { sql, user } = await getAuthenticatedDbConnection();
  
  try {
    // Log the query for audit purposes
    console.log(`User ${user.id} executing dynamic query:`, queryString);
    
    // For dynamic queries, we need to use a different approach
    // Note: This should be used carefully to avoid SQL injection
    const result = await sql.unsafe(queryString);
    return result as unknown as DatabaseRow[];
  } catch (error) {
    console.error(`Dynamic query failed for user ${user.id}:`, error);
    throw error;
  }
}

// Helper function to check if user has permission for specific data
export async function checkDataAccess(
  userId: string, 
  resourceType: string, 
  resourceId: string
): Promise<boolean> {
  // This can be expanded based on your RBAC requirements
  // For now, we'll implement basic user-based access control
  
  const { sql } = await getAuthenticatedDbConnection();
  
  try {
    // Check if user has access to the resource
    const result = await sql`
      SELECT 1 FROM user_permissions 
      WHERE user_id = ${userId} 
      AND resource_type = ${resourceType} 
      AND resource_id = ${resourceId}
      LIMIT 1
    `;
    
    return result.length > 0;
  } catch (error) {
    console.error("Error checking data access:", error);
    return false;
  }
}

// ========================================
// AGENTIC WORKFLOW FUNCTIONS (Using Neon SQL)
// ========================================

// Create agentic workflow tables if they don't exist
export async function initializeAgenticTables(): Promise<boolean> {
  const { sql } = await getAuthenticatedDbConnection();
  
  try {
    // Create users table for agentic workflow
    await sql`
      CREATE TABLE IF NOT EXISTS agentic_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT DEFAULT 'user',
        permissions JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create requests table
    await sql`
      CREATE TABLE IF NOT EXISTS agentic_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        target_object TEXT NOT NULL,
        bounded_area TEXT NOT NULL,
        instructions TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        result JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create agent_actions table
    await sql`
      CREATE TABLE IF NOT EXISTS agentic_agent_actions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id UUID NOT NULL,
        agent_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        details JSONB DEFAULT '{}',
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `;

    console.log('Agentic workflow tables initialized');
    return true;
  } catch (error) {
    console.error('Error initializing agentic tables:', error);
    return false;
  }
}

// Helper functions for agentic workflow operations using raw SQL
export async function createAgenticUser(data: {
  name: string;
  email: string;
  role?: string;
  permissions?: Record<string, unknown>;
}): Promise<AgenticUser> {
  const { sql } = await getAuthenticatedDbConnection();
  
  const result = await sql`
    INSERT INTO agentic_users (name, email, role, permissions)
    VALUES (${data.name}, ${data.email}, ${data.role || 'user'}, ${JSON.stringify(data.permissions || {})})
    RETURNING *
  `;
  
  return result[0] as AgenticUser;
}

export async function getAgenticUserByEmail(email: string): Promise<AgenticUser | null> {
  const { sql } = await getAuthenticatedDbConnection();
  
  const result = await sql`
    SELECT * FROM agentic_users WHERE email = ${email}
  `;
  
  return (result[0] as AgenticUser) || null;
}

export async function createAgenticRequest(data: {
  userId: string;
  targetObject: string;
  boundedArea: string;
  instructions: string;
}): Promise<AgenticRequest> {
  const { sql } = await getAuthenticatedDbConnection();
  
  const result = await sql`
    INSERT INTO agentic_requests (user_id, target_object, bounded_area, instructions)
    VALUES (${data.userId}, ${data.targetObject}, ${data.boundedArea}, ${data.instructions})
    RETURNING *
  `;
  
  return result[0] as AgenticRequest;
}

export async function getAgenticRequestsByUserId(userId: string): Promise<AgenticRequestWithUser[]> {
  const { sql } = await getAuthenticatedDbConnection();
  
  const result = await sql`
    SELECT r.*, u.name as user_name, u.email as user_email
    FROM agentic_requests r
    JOIN agentic_users u ON r.user_id = u.id
    WHERE r.user_id = ${userId}
    ORDER BY r.created_at DESC
  `;
  
  return result as AgenticRequestWithUser[];
}

export async function updateAgenticRequestStatus(
  requestId: string,
  status: AgenticRequest['status'],
  result?: Record<string, unknown>
): Promise<AgenticRequest> {
  const { sql } = await getAuthenticatedDbConnection();
  
  const updateResult = await sql`
    UPDATE agentic_requests 
    SET status = ${status}, 
        result = ${result ? JSON.stringify(result) : null},
        updated_at = NOW()
    WHERE id = ${requestId}
    RETURNING *
  `;
  
  return updateResult[0] as AgenticRequest;
}

export async function createAgenticAgentAction(data: {
  requestId: string;
  agentId: string;
  actionType: string;
  details: Record<string, unknown>;
}): Promise<AgenticAgentAction> {
  const { sql } = await getAuthenticatedDbConnection();
  
  const result = await sql`
    INSERT INTO agentic_agent_actions (request_id, agent_id, action_type, details)
    VALUES (${data.requestId}, ${data.agentId}, ${data.actionType}, ${JSON.stringify(data.details)})
    RETURNING *
  `;
  
  return result[0] as AgenticAgentAction;
}

// Function to get agentic system stats
export async function getAgenticSystemStats(): Promise<AgenticSystemStats> {
  try {
    const { sql } = await getAuthenticatedDbConnection();
    
    const userCount = await sql`SELECT COUNT(*) as count FROM agentic_users`;
    const requestCount = await sql`SELECT COUNT(*) as count FROM agentic_requests`;
    const pendingRequests = await sql`SELECT COUNT(*) as count FROM agentic_requests WHERE status = 'pending'`;
    
    return {
      userCount: parseInt((userCount[0] as CountResult)?.count || '0'),
      requestCount: parseInt((requestCount[0] as CountResult)?.count || '0'),
      pendingRequests: parseInt((pendingRequests[0] as CountResult)?.count || '0'),
    };
  } catch (error) {
    console.error('Error getting agentic system stats:', error);
    return {
      userCount: 0,
      requestCount: 0,
      pendingRequests: 0,
    };
  }
}

