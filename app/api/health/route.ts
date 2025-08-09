import { NextResponse } from 'next/server';
import { checkDbConnection, getAgenticSystemStats, initializeAgenticTables } from '@/lib/db';

export async function GET() {
  try {
    // Test original database connection
    const originalDbStatus = await checkDbConnection();
    
    // Initialize agentic tables if they don't exist
    const tablesInitialized = await initializeAgenticTables();
    
    // Get system stats
    const stats = await getAgenticSystemStats();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: originalDbStatus === 'Database connected',
        originalConnection: originalDbStatus,
        agenticTablesInitialized: tablesInitialized,
        userCount: stats.userCount,
        requestCount: stats.requestCount,
        pendingRequests: stats.pendingRequests,
      },
      services: {
        openaiAgents: '0.0.15',
        nextjs: '15.4.3',
        stackAuth: '2.8.25',
        mermaid: '11.9.0',
        neonDatabase: '1.0.0',
      },
      features: {
        dataLineage: true,
        agenticWorkflow: true,
        realTimeMonitoring: true,
        permissionSystem: true,
        prismaORM: false, // Using raw SQL for now
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'System health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        database: {
          connected: false,
        },
      },
      { status: 500 }
    );
  }
}

