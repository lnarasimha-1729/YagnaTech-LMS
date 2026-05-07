import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminForm from './AdminForm';
import { getAdmin, updateAdmin } from '../../api/admin';

export default function AdminEdit() {
    const { id } = useParams();
    const nav = useNavigate();
    const [admin, setAdmin] = useState(null);

    useEffect(() => { getAdmin(id).then((r) => setAdmin(r.admin)); }, [id]);

    const onSubmit = async (fd) => {
        try {
            await updateAdmin(id, fd);
            toast.success('Admin update successfully');
            nav('/admin/admins');
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed');
        }
    };

    if (!admin) return <div className="text-gray">Loading…</div>;

    return (
        <div>
            <div className="ol-card">
                <div className="ol-card-body py-3 px-5 my-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <h4 className="text-[16px] font-semibold text-dark">Edit Admin</h4>
                        <Link to="/admin/admins" className="ol-btn-outline-secondary">← Back</Link>
                    </div>
                </div>
            </div>
            <div className="ol-card p-4">
                <h4 className="text-[16px] font-semibold text-dark mb-5">Admin Info</h4>
                <div className="ol-card-body">
                    <AdminForm admin={admin} onSubmit={onSubmit} submitLabel="Update Admin" />
                </div>
            </div>
        </div>
    );
}
