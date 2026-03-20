import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { requireOrgAdmin } from '@/lib/guards/org-guard';
import { handleRemoveMember } from '@/app/api/modules/users/controllers';
import { prisma } from '@/lib/db/client';
import { logAudit } from '@/lib/audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const { id: orgId, userId } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role || !['ADMIN', 'MEMBER', 'GUEST'].includes(role)) {
      return errorResponse('Invalid role');
    }

    await requireOrgAdmin(session.userId, orgId);

    await prisma.membership.update({
      where: { userId_organizationId: { userId, organizationId: orgId } },
      data: { role },
    });

    logAudit({ userId: session.userId, organizationId: orgId, description: `changed a member's role to ${role}` });
    return successResponse({ message: 'Role updated' });
  } catch (error: any) {
    if (error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id, userId } = await params;
  return handleRemoveMember(request, id, userId);
}
