import React, { useState } from "react";

interface AddCourseProps {
  onClose: () => void;
}

const AddCourse: React.FC<AddCourseProps> = ({ onClose }) => {
  const [form, setForm] = useState({
    name: "",
    category: "",
    duration: "",
    instructor: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "Active",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submit logic here
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 md:p-8 relative">
        {/* Close Button */}
        <button
          className="absolute top-6 right-6 text-2xl font-bold text-gray-700 hover:text-black"
          aria-label="Close"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-3xl font-bold mb-4 text-gray-900">Add New Course</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Course Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700">Course Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">Category</label>
              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">Duration (months)</label>
              <input
                type="text"
                name="duration"
                value={form.duration}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">Instructor</label>
              <input
                type="text"
                name="instructor"
                value={form.instructor}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
                required
              />
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700">Start Date</label>
              <input
                type="text"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                placeholder="dd-mm-yyyy"
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">End Date</label>
              <input
                type="text"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                placeholder="dd-mm-yyyy"
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
                required
              />
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Course Status</label>
            <input
              type="text"
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
              required
            />
          </div>
           <button
            type="submit"
            className="bg-[#219A85] hover:bg-[#177385] text-white font-semibold px-6 py-2 rounded-lg transition-colors mt-2"
          >
            Add Course
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCourse;