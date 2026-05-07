import React, { useState } from "react";

interface EditCompanyProps {
  onClose: () => void;
}

const EditCompany: React.FC<EditCompanyProps> = ({ onClose }) => {
  const [form, setForm] = useState({
    name: "Company xyz",
    industry: "Technology",
    email: "contact@companyxyz.com",
    phone: "123-456-7890",
    website: "www.companyxyz.com",
    location: "New York, NY",
    description: "",
    contactName: "Person01",
    Position: "Manager",
    contactEmail: "person01@companyxyz.com",
    contactPhone: "987-654-3210",
    companyStatus: "Active",
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
        <h2 className="text-3xl font-bold mb-4 text-gray-900">Edit </h2>
        <form className="space-y-2" onSubmit={handleSubmit}>
          {/* Company Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block mb-0.5 font-medium text-gray-700">Company Name</label>
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
              <label className="block mb-0.5 font-medium text-gray-700">Industry</label>
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
              <label className="block mb-0.5 font-medium text-gray-700">Email Address</label>
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
              <label className="block mb-0.5 font-medium text-gray-700">Phone Number</label>
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
              <label className="block mb-0.5 font-medium text-gray-700">Website</label>
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
              <label className="block mb-0.5 font-medium text-gray-700">Location</label>
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
            <label className="block mb-0.5 font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
            />
          </div>
          {/* Primary Contact Section */}
          <h3 className="text-xl font-bold mb-1 text-gray-900">Primary Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block mb-0.5 font-medium text-gray-700">Contact Name</label>
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
              <label className="block mb-0.5 font-medium text-gray-700">Position</label>
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
              <label className="block mb-0.5 font-medium text-gray-700">Email Address</label>
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
              <label className="block mb-0.5 font-medium text-gray-700">Phone Number</label>
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
          <div>
            <label className="block mb-0.5 font-medium text-gray-700">Company Status</label>
            <input
              type="text"
              name="companyStatus"
              value={form.companyStatus}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
              required
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="bg-[#219A85] hover:bg-[#177385] text-white font-semibold px-6 py-2 rounded-lg transition-colors"
            >
              Save Changes
            </button>
            <button
              type="button"
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCompany;