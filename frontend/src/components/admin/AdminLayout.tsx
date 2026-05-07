import { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  GraduationCap,
  Mail,
  Tag,
  Settings as SettingsIcon,
  Award,
  FolderOpen,
  MessageSquare,
  Newspaper,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/categories', label: 'Categories', icon: FolderOpen },
  { to: '/admin/users', label: 'Admins', icon: Users },
  { to: '/admin/instructors', label: 'Instructors', icon: Users },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/enrollments', label: 'Enrollments', icon: GraduationCap },
  { to: '/admin/blogs', label: 'Blogs', icon: Newspaper },
  { to: '/admin/coupons', label: 'Coupons', icon: Tag },
  { to: '/admin/certificate', label: 'Certificate', icon: Award },
  { to: '/admin/contacts', label: 'Contacts', icon: MessageSquare },
  { to: '/admin/newsletter', label: 'Newsletter', icon: Mail },
  { to: '/admin/knowledge-base', label: 'Knowledge Base', icon: FileText },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
];

export default function AdminLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Toaster position="top-right" />
      <aside className="w-64 bg-white border-r flex-shrink-0">
        <div className="h-16 px-6 flex items-center border-b">
          <span className="font-bold text-lg">Admin</span>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <div className="p-6">{children ?? <Outlet />}</div>
      </main>
    </div>
  );
}
