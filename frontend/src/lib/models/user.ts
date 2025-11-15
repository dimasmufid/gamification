export type OrganizationRole = "OWNER" | "ADMIN" | "MEMBER";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  businessImage?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface OrganizationMembership {
  organization: Organization;
  role: OrganizationRole;
  isDefault: boolean;
}

export interface ActiveOrganization extends Organization {
  role: OrganizationRole;
  isDefault: boolean;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName?: string | null;
  profilePicture?: string | null;
  memberships: OrganizationMembership[];
  activeOrganizationId?: string | null;
}
