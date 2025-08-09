import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Authentication utilities
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatUserRole(role: string): string {
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// Data lineage utilities
export function generateLineageId(): string {
  return `lineage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function formatTimestamp(timestamp: string | Date): string {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

export function sanitizeTableName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()
}

// Permission utilities
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission) || userPermissions.includes('admin')
}

export function canAccessResource(userRole: string, resourceType: string): boolean {
  const rolePermissions: Record<string, string[]> = {
    'admin': ['tables', 'columns', 'relationships', 'transformations', 'users'],
    'analyst': ['tables', 'columns', 'relationships', 'transformations'],
    'viewer': ['tables', 'columns', 'relationships'],
    'guest': ['tables']
  }
  
  return rolePermissions[userRole]?.includes(resourceType) || false
}

