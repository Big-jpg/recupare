// app/api/agents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  getAgenticRequestById,
  updateRequestStatus,
  createAgentSession,
  getAgentSessionByRequestId,
  updateAgentSession,
  initializeDatabase
} from '@/lib/db';
import { stackServerApp } from '@/lib/stack';
import { z } from 'zod';

// Validation schema for agent processing request
const ProcessRequestSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  agentType: z.string().optional().default('general'),
  priority: z.number().optional().default(0),
});

// Validation schema for agent response
const AgentResponseSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  agentId: z.string().min(1, 'Agent ID is required'),
  response: z.string().min(1, 'Response is required'),
  status: z.enum(['processing', 'completed', 'failed', 'requires_input']),
  metadata: z.record(z.unknown()).optional(),
});

// POST /api/agents - Process a request with an agent
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = ProcessRequestSchema.parse(body);

    // Get the request details
    const requestDetails = await getAgenticRequestById(validatedData.requestId);
    if (!requestDetails) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Check if user owns the request or has admin permissions
    const hasAdminPermission = await user.hasPermission('admin');
    if (requestDetails.user_email !== user.primaryEmail && !hasAdminPermission) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Update request status to processing
    await updateRequestStatus(validatedData.requestId, 'processing');

    // Create or get agent session
    let agentSession = await getAgentSessionByRequestId(validatedData.requestId);
    if (!agentSession) {
      const agentId = `agent_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      agentSession = await createAgentSession({
        requestId: validatedData.requestId,
        agentId,
        sessionData: {
          agentType: validatedData.agentType,
          priority: validatedData.priority,
          startedAt: new Date().toISOString(),
          requestDetails: {
            areaName: requestDetails.area_name,
            taskName: requestDetails.task_name,
            instructions: requestDetails.instructions,
            targetObject: requestDetails.target_object,
            boundedArea: requestDetails.bounded_area,
          },
        },
      });
    }

    // TODO: Integrate with OpenAI Agents SDK here
    // For now, we'll simulate agent processing
    const simulatedResponse = {
      message: `Agent ${agentSession.agent_id} has started processing your request for ${requestDetails.area_name} - ${requestDetails.task_name}.`,
      nextSteps: [
        "Analyzing the request requirements",
        "Identifying necessary resources and documents",
        "Preparing processing workflow"
      ],
      estimatedCompletion: "5-10 minutes",
    };

    // Update agent session with initial response
    await updateAgentSession(agentSession.id, {
      ...JSON.parse(agentSession.session_data),
      lastActivity: new Date().toISOString(),
      responses: [simulatedResponse],
    });

    return NextResponse.json({
      success: true,
      agentSession: {
        id: agentSession.id,
        agentId: agentSession.agent_id,
        status: agentSession.status,
        response: simulatedResponse,
      },
      message: 'Agent processing started successfully',
    });

  } catch (error) {
    console.error('Error starting agent processing:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to start agent processing' },
      { status: 500 }
    );
  }
}

// PUT /api/agents - Update agent response/status
export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user (this would typically be called by the agent system)
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Initialize database if needed
    await initializeDatabase();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = AgentResponseSchema.parse(body);

    // Get the agent session
    const agentSession = await getAgentSessionByRequestId(validatedData.requestId);
    if (!agentSession) {
      return NextResponse.json(
        { error: 'Agent session not found' },
        { status: 404 }
      );
    }

    // Update agent session with new response
    const sessionData = JSON.parse(agentSession.session_data);
    const updatedSessionData = {
      ...sessionData,
      lastActivity: new Date().toISOString(),
      responses: [...(sessionData.responses || []), {
        timestamp: new Date().toISOString(),
        response: validatedData.response,
        metadata: validatedData.metadata,
      }],
    };

    await updateAgentSession(agentSession.id, updatedSessionData, validatedData.status);

    // Update request status if completed or failed
    if (validatedData.status === 'completed' || validatedData.status === 'failed') {
      await updateRequestStatus(
        validatedData.requestId, 
        validatedData.status,
        validatedData.response
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Agent response updated successfully',
    });

  } catch (error) {
    console.error('Error updating agent response:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update agent response' },
      { status: 500 }
    );
  }
}

// GET /api/agents - Get agent status for a request
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

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    // Get the agent session
    const agentSession = await getAgentSessionByRequestId(requestId);
    if (!agentSession) {
      return NextResponse.json(
        { error: 'Agent session not found' },
        { status: 404 }
      );
    }

    const sessionData = JSON.parse(agentSession.session_data);

    return NextResponse.json({
      success: true,
      agentSession: {
        id: agentSession.id,
        agentId: agentSession.agent_id,
        status: agentSession.status,
        sessionData,
        createdAt: agentSession.created_at,
        updatedAt: agentSession.updated_at,
      },
    });

  } catch (error) {
    console.error('Error fetching agent status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent status' },
      { status: 500 }
    );
  }
}

