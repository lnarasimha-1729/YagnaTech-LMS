import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminForm from './AdminForm';
import { createAdmin } from '../../api/admin';

export default function AdminCreate() {
    const nav = useNavigate();

    const onSubmit = async (fd) => {
        try {
            await createAdmin(fd);
            toast.success('Admin add successfully');
            nav('/admin/admins');
        } catch (e) {
            console.error('Create admin failed:', e);
            const message = e.response?.data?.error || e.response?.data?.message || e.message || 'Failed';
            toast.error(message);
        }
    };

    return (
        <div>
            <div className="ol-card">
                <div className="ol-card-body py-3 px-5 my-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <h4 className="text-[16px] font-semibold text-dark">Create Admin</h4>
                        <Link to="/admin/admins" className="ol-btn-outline-secondary">← Back</Link>
                    </div>
                </div>
            </div>
            <div className="ol-card p-4">
                <h4 className="text-[16px] font-semibold text-dark mb-5">Admin Info</h4>
                <div className="ol-card-body">
                    <AdminForm onSubmit={onSubmit} submitLabel="Create Admin" />
                </div>
            </div>
        </div>
    );
}
