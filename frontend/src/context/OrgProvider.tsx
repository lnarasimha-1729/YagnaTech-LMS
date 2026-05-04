import { useState, useEffect, ReactNode } from "react";
import axiosInstance from "../api/axiosInstance";
import { OrgContext, OrgContextType, Org } from "./OrgContext";

export const OrgProvider = ({ children }: { children: ReactNode }) => {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get<Org[]>("/organisation/all");
        setOrgs(response.data);
      } catch (error) {
        console.error("Failed to fetch organizations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrgs();
  }, []);

  const addOrg = async (data: Partial<Org>): Promise<unknown> => {
    return axiosInstance.post("/organisation/add", data);
  };

  const contextValue: OrgContextType = {
    orgs,
    loading,
    addOrg
  };

  return (
    <OrgContext.Provider value={contextValue}>
      {children}
    </OrgContext.Provider>
  );
};