// components/navigation/navbar.tsx
'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@stackframe/stack';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Plus, 
  Menu, 
  X, 
  User, 
  Settings, 
  LogOut,
  Brain
} from 'lucide-react';

// User section component
function UserSection() {
  const user = useUser();

  if (!user) {
    return (
      <div className="flex gap-2">
        <Button variant="ghost" asChild>
          <Link href="/handler/signin">Sign In</Link>
        </Button>
        <Button asChild>
          <Link href="/handler/signup">Sign Up</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="hidden md:block">
        <span className="text-sm text-gray-700">
          Welcome, {user.displayName || user.primaryEmail}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <Settings className="w-4 h-4" />
          </Link>
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => user.signOut()}
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Fallback component for user section
function UserSectionFallback() {
  return (
    <div className="flex items-center space-x-4">
      <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
      <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
    </div>
  );
}

// Mobile user section
function MobileUserSection({ onClose }: { onClose: () => void }) {
  const user = useUser();

  if (!user) {
    return (
      <div className="pt-4 pb-3 border-t border-gray-200">
        <div className="flex items-center px-4 space-x-3">
          <Button variant="ghost" asChild onClick={onClose}>
            <Link href="/handler/signin">Sign In</Link>
          </Button>
          <Button asChild onClick={onClose}>
            <Link href="/handler/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4 pb-3 border-t border-gray-200">
      <div className="flex items-center px-4">
        <div className="flex-shrink-0">
          <User className="w-8 h-8 text-gray-400" />
        </div>
        <div className="ml-3">
          <div className="text-base font-medium text-gray-800">
            {user.displayName || 'User'}
          </div>
          <div className="text-sm text-gray-500">{user.primaryEmail}</div>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <Link
          href="/settings"
          onClick={onClose}
          className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
        >
          Settings
        </Link>
        <button
          onClick={() => {
            user.signOut();
            onClose();
          }}
          className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function MobileUserSectionFallback() {
  return (
    <div className="pt-4 pb-3 border-t border-gray-200">
      <div className="flex items-center px-4">
        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="ml-3">
          <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="w-32 h-3 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Don't show navigation on the landing page
  if (pathname === '/') {
    return null;
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: BarChart3,
      description: 'View your AI agent tasks in progress and completed',
    },
    {
      name: 'Submit Task',
      href: '/submit-task',
      icon: Plus,
      description: 'Submit new AI agent tasks',
    },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    if (href === '/submit-task' && pathname === '/submit-task') return true;
    return false;
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and primary navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">
                  Recupare
                </span>
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User menu with Suspense */}
          <Suspense fallback={<UserSectionFallback />}>
            <UserSection />
          </Suspense>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className="w-5 h-5 mr-3" />
                    <div>
                      <div>{item.name}</div>
                      <div className="text-sm text-gray-500">{item.description}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          
          {/* Mobile user menu with Suspense */}
          <Suspense fallback={<MobileUserSectionFallback />}>
            <MobileUserSection onClose={() => setMobileMenuOpen(false)} />
          </Suspense>
        </div>
      )}
    </nav>
  );
}
