// app/api/requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  createAgenticRequest, 
  getAgenticRequestsByUserId, 
  createAgenticUser,
  getAgenticUserByEmail,
  updateRequestStatus,
  initializeDatabase
} from '@/lib/db';
import { stackServerApp } from '@/lib/stack';
import { z } from 'zod';

// Validation schema for request creation
const CreateRequestSchema = z.object({
  areaId: z.string().optional(),
  taskId: z.string().optional(),
  targetObject: z.string().min(1, 'Target object is required'),
  boundedArea: z.string().min(1, 'Bounded area is required'),
  instructions: z.string().min(10, 'Instructions must be at least 10 characters'),
});

// Validation schema for request status update
const UpdateRequestSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'escalated']),
  result: z.string().optional(),
});

// POST /api/requests - Create a new task request
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreateRequestSchema.parse(body);

    // Initialize database if needed
    await initializeDatabase();

    // Check if user exists in agentic system, create if not
    let agenticUser = await getAgenticUserByEmail(user.primaryEmail || '');
    if (!agenticUser) {
      agenticUser = await createAgenticUser({
        name: user.displayName || 'Unknown User',
        email: user.primaryEmail || '',
        role: 'user',
        permissions: {
          dataAccess: ['basic'],
          canSubmitTasks: true,
        },
      });
    }

    // Create the request
    const newRequest = await createAgenticRequest({
      userId: agenticUser.id,
      areaId: validatedData.areaId,
      taskId: validatedData.taskId,
      targetObject: validatedData.targetObject,
      boundedArea: validatedData.boundedArea,
      instructions: validatedData.instructions,
    });

    return NextResponse.json({
      success: true,
      request: {
        id: newRequest.id,
        areaId: newRequest.area_id,
        taskId: newRequest.task_id,
        targetObject: newRequest.target_object,
        boundedArea: newRequest.bounded_area,
        instructions: newRequest.instructions,
        status: newRequest.status,
        createdAt: newRequest.created_at,
      },
      message: 'Task request created successfully',
    });

  } catch (error) {
    console.error('Error creating request:', error);

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
      { error: 'Failed to create request' },
      { status: 500 }
    );
  }
}

// GET /api/requests - Get user's requests
export async function GET() {
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

    // Get user from agentic system
    const agenticUser = await getAgenticUserByEmail(user.primaryEmail || '');
    if (!agenticUser) {
      return NextResponse.json({
        success: true,
        requests: [],
        message: 'No requests found',
      });
    }

    // Get user's requests
    const requests = await getAgenticRequestsByUserId(agenticUser.id);

    // Format response
    const formattedRequests = requests.map(req => ({
      id: req.id,
      areaId: req.area_id,
      areaName: req.area_name,
      taskId: req.task_id,
      taskName: req.task_name,
      targetObject: req.target_object,
      boundedArea: req.bounded_area,
      instructions: req.instructions,
      status: req.status,
      result: req.result,
      createdAt: req.created_at,
      updatedAt: req.updated_at,
      user: {
        name: req.user_name,
        email: req.user_email,
      },
    }));

    return NextResponse.json({
      success: true,
      requests: formattedRequests,
      count: formattedRequests.length,
    });

  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

// PUT /api/requests - Update request status (for agents/admin)
export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { requestId, ...updateData } = body;
    
    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    const validatedData = UpdateRequestSchema.parse(updateData);

    // Initialize database if needed
    await initializeDatabase();

    // Update the request status
    await updateRequestStatus(requestId, validatedData.status, validatedData.result);

    return NextResponse.json({
      success: true,
      message: 'Request status updated successfully',
    });

  } catch (error) {
    console.error('Error updating request:', error);

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
      { error: 'Failed to update request' },
      { status: 500 }
    );
  }
}

