import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, rateLimitResponse } from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { requireOrgAdmin } from '@/lib/guards/org-guard';
import { validateBody } from '@/lib/guards/validate';
import { inviteLimiter } from '@/lib/rate-limit';
import { createInvitationSchema, acceptInvitationSchema } from '../types';
import * as invitationService from '../services';

export async function handleCreateInvitation(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const limit = inviteLimiter.check(`invite:${ip}`);
    if (!limit.success) return rateLimitResponse(limit.resetIn);

    const body = await request.json();
    const validation = validateBody(createInvitationSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    // Only admins can invite
    await requireOrgAdmin(session.userId, validation.data.organizationId);

    const invitation = await invitationService.createInvitation(session.userId, validation.data);
    return successResponse(invitation, 201);
  } catch (error: any) {
    if (error.message === 'Admin access required') return forbiddenResponse();
    if (error.message.includes('already pending') || error.message.includes('already a member')) {
      return errorResponse(error.message, 409);
    }
    return errorResponse(error.message, 500);
  }
}

export async function handleAcceptInvitation(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(acceptInvitationSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const invitation = await invitationService.acceptInvitation(validation.data.token, session.userId);
    return successResponse({ message: 'Invitation accepted', organization: invitation.organization });
  } catch (error: any) {
    if (error.message === 'Invitation not found') return errorResponse(error.message, 404);
    if (error.message === 'Invitation has expired' || error.message === 'Invitation is no longer valid') {
      return errorResponse(error.message, 410);
    }
    return errorResponse(error.message, 500);
  }
}

export async function handleGetInvitation(request: NextRequest, token: string) {
  try {
    const invitation = await invitationService.getInvitationByToken(token);
    return successResponse({
      organization: invitation.organization,
      email: invitation.email,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
    });
  } catch (error: any) {
    if (error.message === 'Invitation not found') return errorResponse(error.message, 404);
    return errorResponse(error.message, 500);
  }
}

export async function handleGetOrgInvitations(request: NextRequest, organizationId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await requireOrgAdmin(session.userId, organizationId);

    const invitations = await invitationService.getOrganizationInvitations(organizationId);
    return successResponse(invitations);
  } catch (error: any) {
    if (error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleRevokeInvitation(request: NextRequest, invitationId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    // The caller needs to verify org admin status before calling this
    await invitationService.revokeInvitation(invitationId);
    return successResponse({ message: 'Invitation revoked' });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
