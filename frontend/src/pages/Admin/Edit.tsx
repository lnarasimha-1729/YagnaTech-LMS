import React, { useState } from "react";

interface EditProps {
  onClose: () => void;
}

const Edit: React.FC<EditProps> = ({ onClose }) => {
  const [form, setForm] = useState({
    name: "College xyz",
    location: "Location xyz",
    email: "email@collegexyz.com",
    phone: "123-456-7890",
    students: "1563",
    description: "",
    status: "active", // Added status property with default value
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submit logic here
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8 relative">
        {/* Close Button */}
        <button
          className="absolute top-6 right-6 text-2xl font-bold text-gray-700 hover:text-black"
          aria-label="Close"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-3xl font-bold mb-8 text-gray-900">Edit</h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 font-medium text-gray-700">College Name</label>
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
              <label className="block mb-2 font-medium text-gray-700">Location</label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
                required
              />
            </div>
            <div>
              <label className="block mb-2 font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
                required
              />
            </div>
          </div>
          <div>
              <label className="block mb-2 font-medium text-gray-700">Students</label>
              <input
                type="text"
                name="students"
                value={form.students}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
                required
              />
            </div>
          <div>
            <label className="block mb-2 font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
            />
          </div>
          <div>
            <label className="block mb-2 font-medium text-gray-700">Company Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
              required
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-[#219A85] hover:bg-[#177385] text-white font-semibold px-6 py-2 rounded-lg transition-colors mt-4"
          >
            Save Changes
          </button>
          <button
            type="button"
            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors mt-4"
            onClick={onClose}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default Edit;