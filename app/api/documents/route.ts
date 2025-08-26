// app/api/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  createDocument, 
  getDocumentsByUserId, 
  getDocumentById,
  getAgenticUserByEmail,
  createAgenticUser,
  initializeDatabase
} from '@/lib/db';
import { stackServerApp } from '@/lib/stack';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Validation schema for document metadata
const DocumentMetadataSchema = z.object({
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
});

// GET /api/documents - Get user's documents
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
    const documentId = searchParams.get('id');

    // Get user from agentic system
    const agenticUser = await getAgenticUserByEmail(user.primaryEmail || '');
    if (!agenticUser) {
      return NextResponse.json({
        success: true,
        documents: [],
        message: 'No documents found',
      });
    }

    if (documentId) {
      // Get specific document
      const document = await getDocumentById(documentId);
      
      if (!document || document.user_id !== agenticUser.id) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        document: {
          id: document.id,
          filename: document.filename,
          originalName: document.original_name,
          mimeType: document.mime_type,
          size: document.size,
          storePath: document.store_path,
          metadata: JSON.parse(document.metadata),
          isActive: document.is_active,
          createdAt: document.created_at,
          updatedAt: document.updated_at,
        },
      });
    } else {
      // Get all user documents
      const documents = await getDocumentsByUserId(agenticUser.id);

      return NextResponse.json({
        success: true,
        documents: documents.map(doc => ({
          id: doc.id,
          filename: doc.filename,
          originalName: doc.original_name,
          mimeType: doc.mime_type,
          size: doc.size,
          metadata: JSON.parse(doc.metadata),
          isActive: doc.is_active,
          createdAt: doc.created_at,
          updatedAt: doc.updated_at,
        })),
        count: documents.length,
      });
    }

  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST /api/documents - Upload a new document
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const metadataStr = formData.get('metadata') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate metadata if provided
    let metadata = {};
    if (metadataStr) {
      try {
        const parsedMetadata = JSON.parse(metadataStr);
        metadata = DocumentMetadataSchema.parse(parsedMetadata);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid metadata format' },
          { status: 400 }
        );
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const fileExtension = file.name.split('.').pop() || '';
    const filename = `${timestamp}_${randomId}.${fileExtension}`;

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'uploads', agenticUser.id);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file to disk
    const filePath = join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Save document metadata to database
    const document = await createDocument({
      userId: agenticUser.id,
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      storePath: filePath,
      metadata,
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        filename: document.filename,
        originalName: document.original_name,
        mimeType: document.mime_type,
        size: document.size,
        metadata: JSON.parse(document.metadata),
        createdAt: document.created_at,
      },
      message: 'Document uploaded successfully',
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

