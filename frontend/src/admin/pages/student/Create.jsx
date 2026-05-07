import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminForm from '../admin/AdminForm';
import { createStudent } from '../../api/student';

export default function StudentCreate() {
    const nav = useNavigate();

    const onSubmit = async (fd) => {
        try {
            await createStudent(fd);
            toast.success('Student added successfully');
            nav('/admin/students');
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed');
        }
    };

    return (
        <div>
            <div className="ol-card rounded-ol-8 mb-3">
                <div className="ol-card-body py-12px px-20px my-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <h4 className="text-[16px] font-semibold text-dark m-0 flex items-center gap-2">
                            <i className="fi-rr-settings-sliders" />
                            Create Student
                        </h4>
                        <Link to="/admin/students" className="ol-btn-outline-secondary flex items-center gap-10px">
                            <span className="fi-rr-arrow-alt-left" />
                            <span>Back</span>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="ol-card p-4">
                <h4 className="text-[16px] font-semibold text-dark mb-5">Student Info</h4>
                <div className="ol-card-body">
                    <AdminForm onSubmit={onSubmit} submitLabel="Create Student" />
                </div>
            </div>
        </div>
    );
}
