export interface Invitation {
  id: string;
  email: string;
  token: string;
  organizationId: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  organization?: { id: string; name: string; slug: string };
}

export interface CreateInvitationDTO {
  email: string;
  organizationId: string;
  role?: string;
}
