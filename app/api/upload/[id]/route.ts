import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { deleteS3Object } from '@/lib/s3';
import { prisma } from '@/lib/db/client';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const { id } = await params;

    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) return errorResponse('Attachment not found', 404);

    if (attachment.uploadedById !== session.userId) {
      return errorResponse('You can only delete your own attachments', 403);
    }

    await deleteS3Object(attachment.fileKey);
    await prisma.attachment.delete({ where: { id } });

    return successResponse({ message: 'Attachment deleted' });
  } catch {
    return errorResponse('Failed to delete attachment', 500);
  }
}
