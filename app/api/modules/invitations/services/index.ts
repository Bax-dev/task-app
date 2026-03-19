import { v4 as uuidv4 } from 'uuid';
import { InvitationStatus, Role } from '@prisma/client';
import { sendEmail, buildInviteEmail } from '@/lib/email';
import * as invitationModel from '../models';
import { CreateInvitationDTO } from '../types';

const INVITE_EXPIRY_DAYS = 7;

export async function createInvitation(invitedById: string, dto: CreateInvitationDTO) {
  // Check for existing pending invitation
  const existing = await invitationModel.findPendingInvitation(dto.email, dto.organizationId);
  if (existing) {
    throw new Error('An invitation for this email is already pending');
  }

  // Check if user is already a member
  const { prisma } = require('@/lib/db/client');
  const existingUser = await prisma.user.findUnique({ where: { email: dto.email } });
  if (existingUser) {
    const existingMembership = await invitationModel.findExistingMembership(
      existingUser.id,
      dto.organizationId
    );
    if (existingMembership) {
      throw new Error('This user is already a member of the organization');
    }
  }

  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  const invitation = await invitationModel.createInvitation({
    email: dto.email,
    token,
    organizationId: dto.organizationId,
    invitedById,
    role: dto.role as Role,
    expiresAt,
  });

  // Send invitation email
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`;
  const emailContent = buildInviteEmail(invitation.organization.name, inviteUrl);
  await sendEmail({
    to: dto.email,
    subject: emailContent.subject,
    html: emailContent.html,
  });

  return invitation;
}

export async function acceptInvitation(token: string, userId: string) {
  const invitation = await invitationModel.findInvitationByToken(token);
  if (!invitation) {
    throw new Error('Invitation not found');
  }

  if (invitation.status !== InvitationStatus.PENDING) {
    throw new Error('Invitation is no longer valid');
  }

  if (new Date() > invitation.expiresAt) {
    await invitationModel.updateInvitationStatus(invitation.id, InvitationStatus.EXPIRED);
    throw new Error('Invitation has expired');
  }

  // Check if already a member
  const existingMembership = await invitationModel.findExistingMembership(
    userId,
    invitation.organizationId
  );
  if (existingMembership) {
    await invitationModel.updateInvitationStatus(invitation.id, InvitationStatus.ACCEPTED);
    throw new Error('You are already a member of this organization');
  }

  // Create membership and update invitation
  await invitationModel.createMembership({
    userId,
    organizationId: invitation.organizationId,
    role: invitation.role,
  });

  await invitationModel.updateInvitationStatus(invitation.id, InvitationStatus.ACCEPTED);

  return invitation;
}

export async function getInvitationByToken(token: string) {
  const invitation = await invitationModel.findInvitationByToken(token);
  if (!invitation) {
    throw new Error('Invitation not found');
  }
  return invitation;
}

export async function getOrganizationInvitations(organizationId: string) {
  return invitationModel.findOrganizationInvitations(organizationId, InvitationStatus.PENDING);
}

export async function revokeInvitation(invitationId: string) {
  return invitationModel.updateInvitationStatus(invitationId, InvitationStatus.REVOKED);
}
