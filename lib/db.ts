// lib/db.ts
import { sql } from '@vercel/postgres';

// ========================================
// USER MANAGEMENT
// ========================================

export interface AgenticUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string;
  created_at: string;
  updated_at: string;
}

export async function createAgenticUser(userData: {
  name: string;
  email: string;
  role: string;
  permissions: Record<string, unknown>;
}): Promise<AgenticUser> {
  const { rows } = await sql`
    INSERT INTO users (name, email, role, permissions)
    VALUES (${userData.name}, ${userData.email}, ${userData.role}, ${JSON.stringify(userData.permissions)})
    RETURNING *
  `;
  return rows[0] as AgenticUser;
}

export async function getAgenticUserByEmail(email: string): Promise<AgenticUser | null> {
  const { rows } = await sql`
    SELECT * FROM users WHERE email = ${email} LIMIT 1
  `;
  return rows.length > 0 ? (rows[0] as AgenticUser) : null;
}

export async function getAgenticUserById(id: string): Promise<AgenticUser | null> {
  const { rows } = await sql`
    SELECT * FROM users WHERE id = ${id} LIMIT 1
  `;
  return rows.length > 0 ? (rows[0] as AgenticUser) : null;
}

// ========================================
// AREAS MANAGEMENT
// ========================================

export interface Area {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function createArea(areaData: {
  name: string;
  description?: string;
  isActive?: boolean;
}): Promise<Area> {
  const { rows } = await sql`
    INSERT INTO areas (name, description, is_active)
    VALUES (${areaData.name}, ${areaData.description || null}, ${areaData.isActive ?? true})
    RETURNING *
  `;
  return rows[0] as Area;
}

export async function getAllAreas(): Promise<Area[]> {
  const { rows } = await sql`
    SELECT * FROM areas WHERE is_active = true ORDER BY name ASC
  `;
  return rows as Area[];
}

export async function getAreaById(id: string): Promise<Area | null> {
  const { rows } = await sql`
    SELECT * FROM areas WHERE id = ${id} LIMIT 1
  `;
  return rows.length > 0 ? (rows[0] as Area) : null;
}

// ========================================
// TASKS MANAGEMENT
// ========================================

export interface Task {
  id: string;
  area_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskWithArea extends Task {
  area_name: string;
}

export async function createTask(taskData: {
  areaId: string;
  name: string;
  description?: string;
  isActive?: boolean;
}): Promise<Task> {
  const { rows } = await sql`
    INSERT INTO tasks (area_id, name, description, is_active)
    VALUES (${taskData.areaId}, ${taskData.name}, ${taskData.description || null}, ${taskData.isActive ?? true})
    RETURNING *
  `;
  return rows[0] as Task;
}

export async function getTasksByAreaId(areaId: string): Promise<Task[]> {
  const { rows } = await sql`
    SELECT * FROM tasks WHERE area_id = ${areaId} AND is_active = true ORDER BY name ASC
  `;
  return rows as Task[];
}

export async function getAllTasksWithAreas(): Promise<TaskWithArea[]> {
  const { rows } = await sql`
    SELECT t.*, a.name as area_name
    FROM tasks t
    JOIN areas a ON t.area_id = a.id
    WHERE t.is_active = true AND a.is_active = true
    ORDER BY a.name ASC, t.name ASC
  `;
  return rows as TaskWithArea[];
}

export async function getTaskById(id: string): Promise<Task | null> {
  const { rows } = await sql`
    SELECT * FROM tasks WHERE id = ${id} LIMIT 1
  `;
  return rows.length > 0 ? (rows[0] as Task) : null;
}

// ========================================
// REQUEST MANAGEMENT
// ========================================

export interface AgenticRequest {
  id: string;
  user_id: string;
  area_id: string | null;
  task_id: string | null;
  target_object: string;
  bounded_area: string;
  instructions: string;
  status: string;
  result: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgenticRequestWithDetails extends AgenticRequest {
  user_name: string;
  user_email: string;
  area_name: string | null;
  task_name: string | null;
}

export async function createAgenticRequest(requestData: {
  userId: string;
  areaId?: string;
  taskId?: string;
  targetObject: string;
  boundedArea: string;
  instructions: string;
}): Promise<AgenticRequest> {
  const { rows } = await sql`
    INSERT INTO requests (user_id, area_id, task_id, target_object, bounded_area, instructions)
    VALUES (${requestData.userId}, ${requestData.areaId || null}, ${requestData.taskId || null}, 
            ${requestData.targetObject}, ${requestData.boundedArea}, ${requestData.instructions})
    RETURNING *
  `;
  return rows[0] as AgenticRequest;
}

export async function getAgenticRequestsByUserId(userId: string): Promise<AgenticRequestWithDetails[]> {
  const { rows } = await sql`
    SELECT r.*, u.name as user_name, u.email as user_email, 
           a.name as area_name, t.name as task_name
    FROM requests r
    JOIN users u ON r.user_id = u.id
    LEFT JOIN areas a ON r.area_id = a.id
    LEFT JOIN tasks t ON r.task_id = t.id
    WHERE r.user_id = ${userId}
    ORDER BY r.created_at DESC
  `;
  return rows as AgenticRequestWithDetails[];
}

export async function getAgenticRequestById(id: string): Promise<AgenticRequestWithDetails | null> {
  const { rows } = await sql`
    SELECT r.*, u.name as user_name, u.email as user_email, 
           a.name as area_name, t.name as task_name
    FROM requests r
    JOIN users u ON r.user_id = u.id
    LEFT JOIN areas a ON r.area_id = a.id
    LEFT JOIN tasks t ON r.task_id = t.id
    WHERE r.id = ${id}
    LIMIT 1
  `;
  return rows.length > 0 ? (rows[0] as AgenticRequestWithDetails) : null;
}

export async function updateRequestStatus(id: string, status: string, result?: string): Promise<void> {
  if (result) {
    await sql`
      UPDATE requests 
      SET status = ${status}, result = ${result}, updated_at = NOW()
      WHERE id = ${id}
    `;
  } else {
    await sql`
      UPDATE requests 
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
    `;
  }
}

// ========================================
// DOCUMENT MANAGEMENT
// ========================================

export interface Document {
  id: string;
  user_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  store_path: string;
  metadata: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function createDocument(documentData: {
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  storePath: string;
  metadata?: Record<string, unknown>;
}): Promise<Document> {
  const { rows } = await sql`
    INSERT INTO documents (user_id, filename, original_name, mime_type, size, store_path, metadata)
    VALUES (${documentData.userId}, ${documentData.filename}, ${documentData.originalName}, 
            ${documentData.mimeType}, ${documentData.size}, ${documentData.storePath}, 
            ${JSON.stringify(documentData.metadata || {})})
    RETURNING *
  `;
  return rows[0] as Document;
}

export async function getDocumentsByUserId(userId: string): Promise<Document[]> {
  const { rows } = await sql`
    SELECT * FROM documents WHERE user_id = ${userId} AND is_active = true ORDER BY created_at DESC
  `;
  return rows as Document[];
}

export async function getDocumentById(id: string): Promise<Document | null> {
  const { rows } = await sql`
    SELECT * FROM documents WHERE id = ${id} AND is_active = true LIMIT 1
  `;
  return rows.length > 0 ? (rows[0] as Document) : null;
}

// ========================================
// AGENT SESSION MANAGEMENT
// ========================================

export interface AgentSession {
  id: string;
  request_id: string;
  agent_id: string;
  session_data: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function createAgentSession(sessionData: {
  requestId: string;
  agentId: string;
  sessionData?: Record<string, unknown>;
}): Promise<AgentSession> {
  const { rows } = await sql`
    INSERT INTO agent_sessions (request_id, agent_id, session_data)
    VALUES (${sessionData.requestId}, ${sessionData.agentId}, ${JSON.stringify(sessionData.sessionData || {})})
    RETURNING *
  `;
  return rows[0] as AgentSession;
}

export async function getAgentSessionByRequestId(requestId: string): Promise<AgentSession | null> {
  const { rows } = await sql`
    SELECT * FROM agent_sessions WHERE request_id = ${requestId} ORDER BY created_at DESC LIMIT 1
  `;
  return rows.length > 0 ? (rows[0] as AgentSession) : null;
}

export async function updateAgentSession(id: string, sessionData: Record<string, unknown>, status?: string): Promise<void> {
  if (status) {
    await sql`
      UPDATE agent_sessions 
      SET session_data = ${JSON.stringify(sessionData)}, status = ${status}, updated_at = NOW()
      WHERE id = ${id}
    `;
  } else {
    await sql`
      UPDATE agent_sessions 
      SET session_data = ${JSON.stringify(sessionData)}, updated_at = NOW()
      WHERE id = ${id}
    `;
  }
}

// ========================================
// DATABASE INITIALIZATION
// ========================================

export async function initializeDatabase(): Promise<void> {
  try {
    // Create tables if they don't exist
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        permissions TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS areas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        area_id UUID REFERENCES areas(id),
        task_id UUID REFERENCES tasks(id),
        target_object VARCHAR(255) NOT NULL,
        bounded_area VARCHAR(255) NOT NULL,
        instructions TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        result TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        size INTEGER NOT NULL,
        store_path TEXT NOT NULL,
        metadata TEXT DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS agent_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
        agent_id VARCHAR(255) NOT NULL,
        session_data TEXT DEFAULT '{}',
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// ========================================
// SEED DATA
// ========================================

export async function seedDatabase(): Promise<void> {
  try {
    // Check if areas already exist
    const { rows: existingAreas } = await sql`SELECT COUNT(*) as count FROM areas`;
    if (parseInt(existingAreas[0].count) > 0) {
      console.log('Database already seeded');
      return;
    }

    // Seed areas
    const areas = [
      { name: 'HR', description: 'Human Resources - Employee management, onboarding, policies' },
      { name: 'Contracts', description: 'Contract management, legal documents, agreements' },
      { name: 'Finance', description: 'Financial documents, accounting, budgets' },
      { name: 'Communications', description: 'Internal and external communications, marketing materials' },
      { name: 'Corporate', description: 'Corporate governance, compliance, strategic documents' },
      { name: 'Accounts Payable', description: 'Invoice processing, vendor management, payments' },
      { name: 'Operations', description: 'Operational procedures, workflows, process documentation' },
      { name: 'IT', description: 'Technical documentation, system specifications, user guides' }
    ];

    const createdAreas: Record<string, string> = {};
    
    for (const area of areas) {
      const createdArea = await createArea(area);
      createdAreas[area.name] = createdArea.id;
    }

    // Seed tasks for each area
    const tasks = [
      // HR Tasks
      { areaName: 'HR', name: 'Document Translation', description: 'Translate HR documents to different languages' },
      { areaName: 'HR', name: 'Policy Analysis', description: 'Analyze and summarize HR policies' },
      { areaName: 'HR', name: 'Employee Data Extraction', description: 'Extract employee information from documents' },
      { areaName: 'HR', name: 'Compliance Check', description: 'Check documents for HR compliance requirements' },

      // Contracts Tasks
      { areaName: 'Contracts', name: 'Contract Translation', description: 'Translate contracts to different languages' },
      { areaName: 'Contracts', name: 'Terms Extraction', description: 'Extract key terms and conditions from contracts' },
      { areaName: 'Contracts', name: 'Risk Analysis', description: 'Analyze contracts for potential risks' },
      { areaName: 'Contracts', name: 'Compliance Verification', description: 'Verify contract compliance with regulations' },

      // Finance Tasks
      { areaName: 'Finance', name: 'Financial Report Translation', description: 'Translate financial documents' },
      { areaName: 'Finance', name: 'Data Extraction', description: 'Extract financial data from documents' },
      { areaName: 'Finance', name: 'Audit Preparation', description: 'Prepare documents for financial audits' },
      { areaName: 'Finance', name: 'Budget Analysis', description: 'Analyze budget documents and projections' },

      // Communications Tasks
      { areaName: 'Communications', name: 'Content Translation', description: 'Translate marketing and communication materials' },
      { areaName: 'Communications', name: 'Message Optimization', description: 'Optimize communication messages for clarity' },
      { areaName: 'Communications', name: 'Brand Compliance', description: 'Check materials for brand guideline compliance' },

      // Corporate Tasks
      { areaName: 'Corporate', name: 'Governance Document Analysis', description: 'Analyze corporate governance documents' },
      { areaName: 'Corporate', name: 'Regulatory Compliance', description: 'Check documents for regulatory compliance' },
      { areaName: 'Corporate', name: 'Strategic Document Review', description: 'Review strategic planning documents' },

      // Accounts Payable Tasks
      { areaName: 'Accounts Payable', name: 'Invoice Processing', description: 'Extract and process invoice data' },
      { areaName: 'Accounts Payable', name: 'Vendor Document Analysis', description: 'Analyze vendor-related documents' },
      { areaName: 'Accounts Payable', name: 'Payment Authorization', description: 'Process payment authorization documents' },

      // Operations Tasks
      { areaName: 'Operations', name: 'Process Documentation', description: 'Create and update process documentation' },
      { areaName: 'Operations', name: 'Workflow Analysis', description: 'Analyze operational workflows' },
      { areaName: 'Operations', name: 'Quality Assurance', description: 'Review documents for quality standards' },

      // IT Tasks
      { areaName: 'IT', name: 'Technical Translation', description: 'Translate technical documentation' },
      { areaName: 'IT', name: 'System Documentation', description: 'Create and update system documentation' },
      { areaName: 'IT', name: 'User Guide Creation', description: 'Create user guides from technical specifications' }
    ];

    for (const task of tasks) {
      await createTask({
        areaId: createdAreas[task.areaName],
        name: task.name,
        description: task.description
      });
    }

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

