import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChevronLeft,
  Menu,
  Package,
  X,
} from 'lucide-react';
const menuItems = [

  {
    path: '/',
    icon: Package,
    label: 'Products'
  }
];


interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Close mobile menu when route changes
  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      onMobileClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen
          transition-transform duration-300 ease-in-out
          bg-white dark:bg-gray-900
          border-r border-gray-200 dark:border-gray-800
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'w-20' : 'w-64'}
          lg:block
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
          {!isCollapsed && (
            <span className="text-xl font-bold text-gray-800 dark:text-white truncate">
              Admin Panel
            </span>
          )}
          <div className="flex items-center">
            {/* Mobile Close Button */}
            <button
              onClick={onMobileClose}
              className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            {/* Collapse Button (Desktop Only) */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:block p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <Menu className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-4 overflow-y-auto h-[calc(100vh-4rem)]">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2 rounded-lg
                transition-colors duration-200
                ${isActive
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}