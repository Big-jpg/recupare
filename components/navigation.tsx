// components/navigation.tsx
'use client';

import Link from 'next/link';
import { useUser } from '@stackframe/stack';
import { Button } from '@/components/ui/button';
import { BarChart3, Plus, User, LogOut } from 'lucide-react';

export default function Navigation() {
  const user = useUser();

  return (
    <header className="w-full border-b border-border/20 backdrop-blur bg-white/60 dark:bg-background/80 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Agentic Document Intelligence
        </Link>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              
              <Link href="/submit-task">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Submit Task
                </Button>
              </Link>

              <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-md">
                <User className="w-4 h-4" />
                <span className="text-sm">{user.displayName || user.primaryEmail}</span>
              </div>

              <Button 
                size="sm" 
                variant="outline"
                onClick={() => user.signOut()}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/signin">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

