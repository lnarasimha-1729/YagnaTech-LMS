import { Routes, Route, NavLink, Navigate, Link } from 'react-router-dom';
import AdminCertificate from './pages/AdminCertificate';
import CertificateBuilder from './pages/CertificateBuilder';
import CertificateList from './pages/CertificateList';
import CertificateDownload from './pages/CertificateDownload';

export default function App() {
    return (
        <Routes>
            {/* Public download view — full screen, no chrome (mirrors curriculum/certificate/download.blade.php) */}
            <Route path="/certificate/:identifier" element={<CertificateDownload />} />

            {/* Builder — full screen, no chrome (mirrors admin/certificate/builder.blade.php) */}
            <Route path="/admin/certificate/builder" element={<CertificateBuilder />} />

            {/* Admin views share the chrome */}
            <Route element={<Chrome />}>
                <Route path="/" element={<Navigate to="/admin/certificate" replace />} />
                <Route path="/admin/certificate" element={<AdminCertificate />} />
                <Route path="/admin/certificates" element={<CertificateList />} />
            </Route>

            <Route path="*" element={<Navigate to="/admin/certificate" replace />} />
        </Routes>
    );
}

function Chrome() {
    const linkCls = ({ isActive }) =>
        `text-[14px] font-medium transition-colors ${isActive ? 'text-skin' : 'text-dark hover:text-skin'}`;
    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-white border-b border-border sticky top-0 z-30">
                <div className="max-w-[1280px] mx-auto px-4 h-[64px] flex items-center justify-between">
                    <Link to="/admin/certificate" className="text-[18px] font-bold text-dark">Certificate</Link>
                    <nav className="flex items-center gap-6">
                        <NavLink to="/admin/certificate" end className={linkCls}>Settings</NavLink>
                        <NavLink to="/admin/certificate/builder" className={linkCls}>Builder</NavLink>
                        <NavLink to="/admin/certificates" className={linkCls}>Issued</NavLink>
                    </nav>
                </div>
            </header>
            <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 py-6">
                <RoutesOutlet />
            </main>
        </div>
    );
}

// Use React Router's <Outlet /> indirectly so we can keep this in one file.
import { Outlet } from 'react-router-dom';
function RoutesOutlet() { return <Outlet />; }
