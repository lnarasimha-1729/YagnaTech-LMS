import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import React, { useState } from "react";

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
}> = ({ checked, onChange, name }) => (
  <label className="relative inline-block w-12 h-6 align-middle select-none">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      name={name}
      className="sr-only"
    />
    <span
      className={`block w-12 h-6 rounded-full transition-colors duration-200 ${
        checked ? "bg-[#219A85]" : "bg-gray-300"
      }`}
    ></span>
    <span
      className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
        checked ? "translate-x-6" : ""
      }`}
      style={{ transition: "transform 0.2s" }}
    ></span>
  </label>
);

const Setting: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"general" | "notifications" | "security">("general");
  const [form, setForm] = useState({
    platformName: "",
    platformDescription: "",
    adminEmail: "",
    contactNumber: "",
    timeZone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactor: true,
    sessionTimeout: false,
    sessionTimeoutDuration: "",
    emailNotifications: true,
    pushNotifications: true,
    newUserAlerts: true,
    courseUpdates: true,
    systemAlerts: false,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, type, value } = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : value,
    }));
  };

  const handleTab = (tab: "general" | "notifications" | "security") => setActiveTab(tab);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save logic here
  };

  return (
    <div className="space-y-8 px-2 md:px-0">
      {/* Tabs */}
      <div className="flex gap-6 border-b mb-4">
        <button
          className={`py-2 px-4 font-semibold bg-transparent ${
            activeTab === "general"
              ? "border-b-2 border-[#219A85] text-[#219A85]"
              : "text-gray-500"
          }`}
          onClick={() => handleTab("general")}
        >
          General
        </button>
        <button
          className={`py-2 px-4 font-semibold bg-transparent ${
            activeTab === "notifications"
              ? "border-b-2 border-[#219A85] text-[#219A85]"
              : "text-gray-500"
          }`}
          onClick={() => handleTab("notifications")}
        >
          Notifications
        </button>
        <button
          className={`py-2 px-4 font-semibold bg-transparent ${
            activeTab === "security"
              ? "border-b-2 border-[#219A85] text-[#219A85]"
              : "text-gray-500"
          }`}
          onClick={() => handleTab("security")}
        >
          Security
        </button>
      </div>
      {/* General Settings Form */}
      {activeTab === "general" && (
        <Card className="mt-4 md:mt-8">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div>
                <label className="block mb-0.5 font-medium text-gray-700">Platform Name</label>
                <input
                  type="text"
                  name="platformName"
                  value={form.platformName}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
                  required
                />
              </div>
              <div>
                <label className="block mb-0.5 font-medium text-gray-700">Platform Description</label>
                <input
                  type="text"
                  name="platformDescription"
                  value={form.platformDescription}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
                />
              </div>
              <div>
                <label className="block mb-0.5 font-medium text-gray-700">Admin Email</label>
                <input
                  type="email"
                  name="adminEmail"
                  value={form.adminEmail}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
                />
              </div>
              <div>
                <label className="block mb-0.5 font-medium text-gray-700">Contact Number</label>
                <input
                  type="text"
                  name="contactNumber"
                  value={form.contactNumber}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
                />
              </div>
              <div>
                <label className="block mb-0.5 font-medium text-gray-700">Time Zone</label>
                <select
                  name="timeZone"
                  value={form.timeZone}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
                >
                  <option value="">Select Time Zone</option>
                  <option value="IST">IST (India Standard Time)</option>
                  <option value="EST">EST (Eastern Standard Time)</option>
                  <option value="PST">PST (Pacific Standard Time)</option>
                  <option value="GMT">GMT (Greenwich Mean Time)</option>
                </select>
              </div>
              <button
                type="submit"
                className="bg-[#219A85] hover:bg-[#177385] text-white font-semibold px-6 py-2 rounded-lg w-full md:w-auto"
              >
                Save Changes
              </button>
            </form>
          </CardContent>
        </Card>
      )}
      {/* Notifications Settings Form */}
      {activeTab === "notifications" && (
        <Card className="mt-4 md:mt-8">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Notifications Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <label className="font-semibold text-gray-800">Email Notifications</label>
                  <div className="text-gray-500 text-sm">Receive email notification for important events</div>
                </div>
                <ToggleSwitch
                  checked={form.emailNotifications}
                  onChange={handleChange}
                  name="emailNotifications"
                />
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <label className="font-semibold text-gray-800">Push Notifications</label>
                  <div className="text-gray-500 text-sm">Receive browser notifications for updates</div>
                </div>
                <ToggleSwitch
                  checked={form.pushNotifications}
                  onChange={handleChange}
                  name="pushNotifications"
                />
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <label className="font-semibold text-gray-800">New User Alerts</label>
                  <div className="text-gray-500 text-sm">Get notified when new users register</div>
                </div>
                <ToggleSwitch
                  checked={form.newUserAlerts}
                  onChange={handleChange}
                  name="newUserAlerts"
                />
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <label className="font-semibold text-gray-800">Course Updates</label>
                  <div className="text-gray-500 text-sm">Receive notifications about course changes</div>
                </div>
                <ToggleSwitch
                  checked={form.courseUpdates}
                  onChange={handleChange}
                  name="courseUpdates"
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <label className="font-semibold text-gray-800">System Alerts</label>
                  <div className="text-gray-500 text-sm">Get notified about system maintenance</div>
                </div>
                <ToggleSwitch
                  checked={form.systemAlerts}
                  onChange={handleChange}
                  name="systemAlerts"
                />
              </div>
              <button
                type="submit"
                className="bg-[#219A85] hover:bg-[#177385] text-white font-semibold px-6 py-2 rounded-lg w-full md:w-auto mt-4"
              >
                Save Changes
              </button>
            </form>
          </CardContent>
        </Card>
      )}
      {/* Security Settings Form */}
      {activeTab === "security" && (
        <Card className="mt-4 md:mt-8">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Security Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div>
                <label className="block mb-0.5 font-semibold text-gray-700">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
                />
              </div>
              <div>
                <label className="block mb-0.5 font-semibold text-gray-700">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
                />
              </div>
              <div>
                <label className="block mb-0.5 font-semibold text-gray-700">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
                />
              </div>
               <div className="flex items-center justify-between  gap-2">
                <div>
                  <label className="font-semibold text-gray-700">Two-Factor Authentication</label>
                </div>
                <ToggleSwitch
                  checked={form.twoFactor}
                  onChange={handleChange}
                  name="twoFactor"
                />
              </div>
              <div>
                <label className="font-semibold text-gray-700">Add an extra layer of security to your account</label>
              </div>
              <div className="flex items-center justify-between gap-2">
                <label className="font-semibold text-gray-700">Session Timeout</label>
                <ToggleSwitch
                  checked={form.sessionTimeout}
                  onChange={handleChange}
                  name="sessionTimeout"
                />
              </div>
              <div>
                <label className="font-semibold text-gray-700">Automatically log out after inactivity</label>
              </div>
              <div>
                <label className="block mb-0.5 font-semibold text-gray-700">Session Timeout Duration</label>
                <select
                  name="sessionTimeoutDuration"
                  value={form.sessionTimeoutDuration}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#219A85]"
                >
                  <option value="">Select Duration</option>
                  <option value="5">5 Minutes</option>
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="60">1 Hour</option>
                </select>
              </div>
              <button
                type="submit"
                className="bg-[#219A85] hover:bg-[#177385] text-white font-semibold px-6 py-2 rounded-lg w-full md:w-auto"
              >
                Save Changes
              </button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Setting;