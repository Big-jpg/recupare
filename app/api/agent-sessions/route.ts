// app/api/agent-sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  getAgentSessionByRequestId,
  getAgenticUserByEmail,
  initializeDatabase
} from '@/lib/db';
import { stackServerApp } from '@/lib/stack';
import { sql } from '@vercel/postgres';

// GET /api/agent-sessions - Get agent session details
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Initialize database if needed
    await initializeDatabase();

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');
    const sessionId = searchParams.get('sessionId');

    if (requestId) {
      // Get session by request ID
      const agentSession = await getAgentSessionByRequestId(requestId);
      if (!agentSession) {
        return NextResponse.json(
          { error: 'Agent session not found' },
          { status: 404 }
        );
      }

      // Get session messages
      const { rows: messages } = await sql`
        SELECT * FROM agent_messages 
        WHERE agent_session_id = ${agentSession.id} 
        ORDER BY timestamp ASC
      `;

      return NextResponse.json({
        success: true,
        session: {
          id: agentSession.id,
          requestId: agentSession.request_id,
          agentId: agentSession.agent_id,
          sessionData: JSON.parse(agentSession.session_data),
          status: agentSession.status,
          createdAt: agentSession.created_at,
          updatedAt: agentSession.updated_at,
          messages: messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            messageType: msg.message_type,
            metadata: JSON.parse(msg.metadata),
            timestamp: msg.timestamp,
          })),
        },
      });

    } else if (sessionId) {
      // Get session by session ID
      const { rows } = await sql`
        SELECT * FROM agent_sessions WHERE id = ${sessionId} LIMIT 1
      `;

      if (rows.length === 0) {
        return NextResponse.json(
          { error: 'Agent session not found' },
          { status: 404 }
        );
      }

      const agentSession = rows[0];

      // Get session messages
      const { rows: messages } = await sql`
        SELECT * FROM agent_messages 
        WHERE agent_session_id = ${sessionId} 
        ORDER BY timestamp ASC
      `;

      return NextResponse.json({
        success: true,
        session: {
          id: agentSession.id,
          requestId: agentSession.request_id,
          agentId: agentSession.agent_id,
          sessionData: JSON.parse(agentSession.session_data),
          status: agentSession.status,
          createdAt: agentSession.created_at,
          updatedAt: agentSession.updated_at,
          messages: messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            messageType: msg.message_type,
            metadata: JSON.parse(msg.metadata),
            timestamp: msg.timestamp,
          })),
        },
      });

    } else {
      // Get all sessions for the user
      const agenticUser = await getAgenticUserByEmail(user.primaryEmail || '');
      if (!agenticUser) {
        return NextResponse.json({
          success: true,
          sessions: [],
          message: 'No sessions found',
        });
      }

      const { rows: sessions } = await sql`
        SELECT s.*, r.instructions, r.status as request_status
        FROM agent_sessions s
        JOIN requests r ON s.request_id = r.id
        WHERE r.user_id = ${agenticUser.id}
        ORDER BY s.created_at DESC
      `;

      return NextResponse.json({
        success: true,
        sessions: sessions.map(session => ({
          id: session.id,
          requestId: session.request_id,
          agentId: session.agent_id,
          sessionData: JSON.parse(session.session_data),
          status: session.status,
          requestStatus: session.request_status,
          instructions: session.instructions,
          createdAt: session.created_at,
          updatedAt: session.updated_at,
        })),
        count: sessions.length,
      });
    }

  } catch (error) {
    console.error('Error fetching agent sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent sessions' },
      { status: 500 }
    );
  }
}

// POST /api/agent-sessions - Send message to agent session
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Initialize database if needed
    await initializeDatabase();

    // Parse request body
    const body = await request.json();
    const { sessionId, message, messageType = 'text' } = body;

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'Session ID and message are required' },
        { status: 400 }
      );
    }

    // Verify session exists and user has access
    const { rows: sessionRows } = await sql`
      SELECT s.*, r.user_id 
      FROM agent_sessions s
      JOIN requests r ON s.request_id = r.id
      WHERE s.id = ${sessionId}
      LIMIT 1
    `;

    if (sessionRows.length === 0) {
      return NextResponse.json(
        { error: 'Agent session not found' },
        { status: 404 }
      );
    }

    const session = sessionRows[0];
    const agenticUser = await getAgenticUserByEmail(user.primaryEmail || '');
    
    if (!agenticUser || session.user_id !== agenticUser.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Add message to session
    const { rows: messageRows } = await sql`
      INSERT INTO agent_messages (agent_session_id, role, content, message_type, metadata)
      VALUES (${sessionId}, 'user', ${message}, ${messageType}, '{}')
      RETURNING *
    `;

    const newMessage = messageRows[0];

    // TODO: Here you would trigger the agent to process the new message
    // For now, we'll just acknowledge the message was received

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage.id,
        role: newMessage.role,
        content: newMessage.content,
        messageType: newMessage.message_type,
        metadata: JSON.parse(newMessage.metadata),
        timestamp: newMessage.timestamp,
      },
      acknowledgment: 'Message sent to agent successfully',
    });

  } catch (error) {
    console.error('Error sending message to agent session:', error);
    return NextResponse.json(
      { error: 'Failed to send message to agent session' },
      { status: 500 }
    );
  }
}

