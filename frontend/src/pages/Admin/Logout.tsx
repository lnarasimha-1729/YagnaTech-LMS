import React from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";

const Logout: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Add your logout logic here (clear tokens, etc.)
    navigate("/login");
  };

  const handleCancel = () => {
    navigate("/admin/dashboard");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA]">
          <div className="flex flex-col items-center justify-center py-12">
             <FiLogOut size={48} className="text-[#219A85]" />
            <h2 className="text-2xl font-semibold text-[#219A85] mt-6 mb-2">
              Ready to leave?
            </h2>
            <p className="text-gray-600 text-center max-w-md mb-8">
              Are you sure you want to log out of your YagnaTech Admin account? You
              will need to enter your credentials again to access the admin
              dashboard.
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                className="bg-[#177385] bg-opacity-10 hover:bg-opacity-20 text-[#219A85] font-semibold px-8 py-2 rounded-lg"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bg-[#177385] text-white font-semibold px-8 py-2 rounded-lg"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          </div>
          </div>
    
  );
};

export default Logout;