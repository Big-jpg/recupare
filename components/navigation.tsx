'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useUser } from '@stackframe/stack';
import { 
  BarChart3, 
  Plus, 
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState, Suspense } from 'react';

// Separate component for user-dependent content
function UserSection() {
  const user = useUser();
  
  return (
    <>
      {/* Desktop user menu */}
      <div className="hidden sm:ml-6 sm:flex sm:items-center">
        {user ? (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              {user.displayName || user.primaryEmail}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => user.signOut()}
              className="flex items-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <Link href="/auth/signin">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">
                Sign Up
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

// Separate component for mobile user menu
function MobileUserSection({ onClose }: { onClose: () => void }) {
  const user = useUser();
  
  return (
    <div className="pt-4 pb-3 border-t border-gray-200">
      {user ? (
        <div className="px-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <div className="ml-3">
              <div className="text-base font-medium text-gray-800">
                {user.displayName || 'User'}
              </div>
              <div className="text-sm font-medium text-gray-500">
                {user.primaryEmail}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <Button
              variant="outline"
              onClick={() => {
                user.signOut();
                onClose();
              }}
              className="w-full justify-start"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      ) : (
        <div className="px-4 space-y-2">
          <Link href="/auth/signin" onClick={onClose}>
            <Button variant="outline" className="w-full">
              Sign In
            </Button>
          </Link>
          <Link href="/auth/signup" onClick={onClose}>
            <Button className="w-full">
              Sign Up
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

// Loading fallback for user sections
function UserSectionFallback() {
  return (
    <div className="hidden sm:ml-6 sm:flex sm:items-center">
      <div className="flex items-center space-x-4">
        <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );
}

function MobileUserSectionFallback() {
  return (
    <div className="pt-4 pb-3 border-t border-gray-200">
      <div className="px-4 space-y-2">
        <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );
}

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't show navigation on the landing page
  if (pathname === '/') {
    return null;
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: BarChart3,
      description: 'View your data lineage and AI agent tasks',
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
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">
                  DATA LINEAGE 2
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

