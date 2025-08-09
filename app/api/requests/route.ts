import { NextRequest, NextResponse } from 'next/server';
import { 
  createAgenticRequest, 
  getAgenticRequestsByUserId, 
  createAgenticUser,
  getAgenticUserByEmail 
} from '@/lib/db';
import { stackServerApp } from '@/lib/stack';
import { z } from 'zod';

// Validation schema for request creation
const CreateRequestSchema = z.object({
  targetObject: z.string().min(1, 'Target object is required'),
  boundedArea: z.string().min(1, 'Bounded area is required'),
  instructions: z.string().min(10, 'Instructions must be at least 10 characters'),
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
      targetObject: validatedData.targetObject,
      boundedArea: validatedData.boundedArea,
      instructions: validatedData.instructions,
    });

    return NextResponse.json({
      success: true,
      request: {
        id: newRequest.id,
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

