import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/lib/stack";

export interface AuthenticatedUser {
  id: string;
  primaryEmail: string | null;
  displayName: string | null;
  hasPermission: (permission: string) => Promise<boolean>;
  permissions: string[]; // Pre-resolved permissions for synchronous access
  hasPermissionSync: (permission: string) => boolean; // Synchronous permission check
}

export interface ApiAuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: NextResponse;
}

/**
 * Authenticate a user for API requests
 */
export async function authenticateApiRequest(): Promise<ApiAuthResult> {
  try {
    const user = await stackServerApp.getUser();
    
    if (!user) {
      return {
        success: false,
        error: NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        )
      };
    }

    // Pre-resolve common permissions for synchronous access
    const commonPermissions = [
      "admin", 
      "view_tables", 
      "create_tables", 
      "view_lineage", 
      "create_lineage",
      "view_bronze",
      "view_silver", 
      "view_gold",
      "manage_users"
    ];
    
    const resolvedPermissions: string[] = [];
    for (const permission of commonPermissions) {
      if (await user.hasPermission(permission)) {
        resolvedPermissions.push(permission);
      }
    }

    return {
      success: true,
      user: {
        id: user.id,
        primaryEmail: user.primaryEmail,
        displayName: user.displayName,
        hasPermission: (permission: string) => user.hasPermission(permission),
        permissions: resolvedPermissions,
        hasPermissionSync: (permission: string) => resolvedPermissions.includes(permission)
      }
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      success: false,
      error: NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 }
      )
    };
  }
}

/**
 * Check if user has required permissions (async version)
 */
export async function checkPermissions(
  user: AuthenticatedUser, 
  requiredPermissions: string[]
): Promise<{ hasPermission: boolean; error?: NextResponse }> {
  try {
    for (const permission of requiredPermissions) {
      const hasPermission = await user.hasPermission(permission);
      const isAdmin = await user.hasPermission("admin");
      
      if (!hasPermission && !isAdmin) {
        return {
          hasPermission: false,
          error: NextResponse.json(
            { 
              error: "Insufficient permissions",
              required: requiredPermissions
            },
            { status: 403 }
          )
        };
      }
    }

    return { hasPermission: true };
  } catch (error) {
    console.error("Permission check error:", error);
    return {
      hasPermission: false,
      error: NextResponse.json(
        { error: "Permission check failed" },
        { status: 500 }
      )
    };
  }
}

/**
 * Check if user has required permissions (sync version using pre-resolved permissions)
 */
export function checkPermissionsSync(
  user: AuthenticatedUser, 
  requiredPermissions: string[]
): { hasPermission: boolean; error?: NextResponse } {
  const hasAllPermissions = requiredPermissions.every(permission =>
    user.hasPermissionSync(permission) || user.hasPermissionSync("admin")
  );

  if (!hasAllPermissions) {
    return {
      hasPermission: false,
      error: NextResponse.json(
        { 
          error: "Insufficient permissions",
          required: requiredPermissions
        },
        { status: 403 }
      )
    };
  }

  return { hasPermission: true };
}

/**
 * Check if user has admin permissions (sync version)
 */
export function requireAdminSync(user: AuthenticatedUser): { isAdmin: boolean; error?: NextResponse } {
  if (!user.hasPermissionSync("admin")) {
    return {
      isAdmin: false,
      error: NextResponse.json(
        { error: "Admin permissions required" },
        { status: 403 }
      )
    };
  }

  return { isAdmin: true };
}

/**
 * Check if user has admin permissions (async version)
 */
export async function requireAdmin(user: AuthenticatedUser): Promise<{ isAdmin: boolean; error?: NextResponse }> {
  try {
    const isAdmin = await user.hasPermission("admin");
    if (!isAdmin) {
      return {
        isAdmin: false,
        error: NextResponse.json(
          { error: "Admin permissions required" },
          { status: 403 }
        )
      };
    }

    return { isAdmin: true };
  } catch (error) {
    console.error("Admin check error:", error);
    return {
      isAdmin: false,
      error: NextResponse.json(
        { error: "Admin check failed" },
        { status: 500 }
      )
    };
  }
}

/**
 * Log API access for audit purposes
 */
export function logApiAccess(
  user: AuthenticatedUser,
  endpoint: string,
  method: string,
  additionalData?: Record<string, unknown>
) {
  console.log(`API Access: ${method} ${endpoint}`, {
    userId: user.id,
    userEmail: user.primaryEmail,
    endpoint,
    method,
    timestamp: new Date().toISOString(),
    ...additionalData
  });
}

/**
 * Higher-order function to wrap API routes with authentication (using sync permissions)
 */
export function withAuth(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>,
  requiredPermissions: string[] = []
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Authenticate user
      const authResult = await authenticateApiRequest();
      if (!authResult.success || !authResult.user) {
        return authResult.error!;
      }

      // Check permissions if required (using sync version for better performance)
      if (requiredPermissions.length > 0) {
        const permissionCheck = checkPermissionsSync(authResult.user, requiredPermissions);
        if (!permissionCheck.hasPermission) {
          return permissionCheck.error!;
        }
      }

      // Log access
      logApiAccess(
        authResult.user,
        new URL(request.url).pathname,
        request.method
      );

      // Call the actual handler
      return await handler(request, authResult.user);
    } catch (error) {
      console.error("API error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Higher-order function to wrap API routes with admin authentication (using sync permissions)
 */
export function withAdminAuth(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Authenticate user
      const authResult = await authenticateApiRequest();
      if (!authResult.success || !authResult.user) {
        return authResult.error!;
      }

      // Check admin permissions (using sync version)
      const adminCheck = requireAdminSync(authResult.user);
      if (!adminCheck.isAdmin) {
        return adminCheck.error!;
      }

      // Log admin access
      logApiAccess(
        authResult.user,
        new URL(request.url).pathname,
        request.method,
        { adminAccess: true }
      );

      // Call the actual handler
      return await handler(request, authResult.user);
    } catch (error) {
      console.error("Admin API error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Validate request body against a schema
 */
export function validateRequestBody<T>(
  body: unknown,
  requiredFields: (keyof T)[],
  optionalFields: (keyof T)[] = []
): { isValid: boolean; data?: T; error?: NextResponse } {
  if (!body || typeof body !== "object") {
    return {
      isValid: false,
      error: NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    };
  }

  const data = body as Record<string, unknown>;
  
  // Check required fields
  for (const field of requiredFields) {
    if (!(field as string in data) || data[field as string] === undefined || data[field as string] === null) {
      return {
        isValid: false,
        error: NextResponse.json(
          { error: `Missing required field: ${String(field)}` },
          { status: 400 }
        )
      };
    }
  }

  // Filter to only include expected fields
  const allowedFields = [...requiredFields, ...optionalFields];
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([key]) => 
      allowedFields.includes(key as keyof T)
    )
  ) as T;

  return {
    isValid: true,
    data: filteredData
  };
}

export function parseQueryParams(
  request: NextRequest,
  allowedParams: string[] = []
): Record<string, string | null> {
  const { searchParams } = new URL(request.url);
  const params: Record<string, string | null> = {};

  for (const param of allowedParams) {
    params[param] = searchParams.get(param);
  }

  return params;
}

