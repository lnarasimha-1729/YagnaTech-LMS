import { createContext } from "react";

export interface Org {
  orgId: string;
  orgName: string;
  // add other org fields as needed
}

export interface OrgContextType {
  orgs: Org[];
  loading: boolean;
  addOrg: (data: Partial<Org>) => Promise<unknown>;
}

export const OrgContext = createContext<OrgContextType | undefined>(undefined);