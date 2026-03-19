import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { generatePresignedDownloadUrl } from '@/lib/s3';
import { prisma } from '@/lib/db/client';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const { id } = await params;

    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) return errorResponse('Attachment not found', 404);

    const url = await generatePresignedDownloadUrl(attachment.fileKey);

    return successResponse({ url, mimeType: attachment.mimeType, fileName: attachment.fileName });
  } catch {
    return errorResponse('Failed to generate view URL', 500);
  }
}
