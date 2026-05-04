import React, { useState } from "react";

interface AddCompanyProps {
  onClose: () => void;
}

const AddCompany: React.FC<AddCompanyProps> = ({ onClose }) => {
  const [form, setForm] = useState({
    name: "",
    industry: "",
    email: "",
    phone: "",
    website: "",
    location: "",
    description: "",
    contactName: "",
    Position: "",
    contactEmail: "",
    contactPhone: "",
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
        <h2 className="text-3xl font-bold mb-4 text-gray-900">Add New Company</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Company Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700">Company Name</label>
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
              <label className="block mb-1 font-medium text-gray-700">Industry</label>
              <input
                type="text"
                name="industry"
                value={form.industry}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">Email Address</label>
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
              <label className="block mb-1 font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">Website</label>
              <input
                type="text"
                name="website"
                value={form.website}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">Location</label>
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
          {/* Primary Contact Section */}
          <h3 className="text-xl font-bold mb-2 text-gray-900">Primary Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700">Contact Name</label>
              <input
                type="text"
                name="contactName"
                value={form.contactName}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">Position</label>
              <input
                type="text"
                name="Position"
                value={form.Position}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="contactEmail"
                value={form.contactEmail}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                name="contactPhone"
                value={form.contactPhone}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-[#219A85] hover:bg-[#177385] text-white font-semibold px-6 py-2 rounded-lg transition-colors mt-2"
          >
            Add Company
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCompany;