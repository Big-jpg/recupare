// app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTasksByAreaId, getAllTasksWithAreas, createTask, initializeDatabase } from '@/lib/db';
import { stackServerApp } from '@/lib/stack';
import { z } from 'zod';

// Validation schema for task creation
const CreateTaskSchema = z.object({
  areaId: z.string().min(1, 'Area ID is required'),
  name: z.string().min(1, 'Task name is required'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/tasks - Get tasks (optionally filtered by area)
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
    const areaId = searchParams.get('areaId');

    let tasks;
    
    if (areaId) {
      // Get tasks for specific area
      tasks = await getTasksByAreaId(areaId);
      return NextResponse.json({
        success: true,
        tasks: tasks.map(task => ({
          id: task.id,
          areaId: task.area_id,
          name: task.name,
          description: task.description,
          isActive: task.is_active,
          createdAt: task.created_at,
          updatedAt: task.updated_at,
        })),
        count: tasks.length,
      });
    } else {
      // Get all tasks with area information
      const tasksWithAreas = await getAllTasksWithAreas();
      return NextResponse.json({
        success: true,
        tasks: tasksWithAreas.map(task => ({
          id: task.id,
          areaId: task.area_id,
          areaName: task.area_name,
          name: task.name,
          description: task.description,
          isActive: task.is_active,
          createdAt: task.created_at,
          updatedAt: task.updated_at,
        })),
        count: tasksWithAreas.length,
      });
    }

  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task (admin only)
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

    // Check if user has admin permissions
    const hasAdminPermission = await user.hasPermission('admin');
    if (!hasAdminPermission) {
      return NextResponse.json(
        { error: 'Admin permissions required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreateTaskSchema.parse(body);

    // Initialize database if needed
    await initializeDatabase();

    // Create the task
    const newTask = await createTask(validatedData);

    return NextResponse.json({
      success: true,
      task: {
        id: newTask.id,
        areaId: newTask.area_id,
        name: newTask.name,
        description: newTask.description,
        isActive: newTask.is_active,
        createdAt: newTask.created_at,
        updatedAt: newTask.updated_at,
      },
      message: 'Task created successfully',
    });

  } catch (error) {
    console.error('Error creating task:', error);

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
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

