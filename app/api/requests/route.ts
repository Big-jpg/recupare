// app/api/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/lib/stack";
import { 
  createAgenticRequest, 
  getAgenticRequestsByUserId, 
  createAgenticUser 
} from "@/lib/db";

export async function GET() {
  try {
    // Authenticate user with Stack Auth
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all requests for the authenticated user
    const requests = await getAgenticRequestsByUserId(user.id);

    // Transform the requests to match the expected format
    const formattedRequests = requests.map((request) => ({
      id: request.id,
      targetObject: request.target_object,
      boundedArea: request.bounded_area,
      instructions: request.instructions,
      status: request.status,
      result: request.result ? JSON.parse(request.result) : null,
      createdAt: request.created_at,
      updatedAt: request.updated_at,
      user: {
        name: user.displayName || user.primaryEmail || 'Unknown',
        email: user.primaryEmail || 'unknown@example.com'
      }
    }));

    return NextResponse.json({
      success: true,
      requests: formattedRequests,
      count: formattedRequests.length,
      error: null
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch requests",
        success: false,
        requests: [],
        count: 0
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user with Stack Auth
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { targetObject, boundedArea, instructions } = body;

    // Validate required fields
    if (!targetObject || !boundedArea || !instructions) {
      return NextResponse.json(
        { error: "Missing required fields: targetObject, boundedArea, instructions" },
        { status: 400 }
      );
    }

    // Ensure user exists in agentic_users table
    await createAgenticUser(
      user.primaryEmail || user.id,
      user.displayName || user.primaryEmail || undefined
    );

    // Create the agentic request
    const newRequest = await createAgenticRequest(
      user.id,
      targetObject,
      boundedArea,
      instructions
    );

    // Format the response
    const formattedRequest = {
      id: newRequest.id,
      targetObject: newRequest.target_object,
      boundedArea: newRequest.bounded_area,
      instructions: newRequest.instructions,
      status: newRequest.status,
      result: newRequest.result ? JSON.parse(newRequest.result) : null,
      createdAt: newRequest.created_at,
      updatedAt: newRequest.updated_at,
      user: {
        name: user.displayName || user.primaryEmail || 'Unknown',
        email: user.primaryEmail || 'unknown@example.com'
      }
    };

    return NextResponse.json({
      success: true,
      request: formattedRequest,
      message: "Request created successfully"
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating request:", error);
    return NextResponse.json(
      { 
        error: "Failed to create request",
        success: false
      }, 
      { status: 500 }
    );
  }
}

