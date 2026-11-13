import { NextRequest } from 'next/server';
import { v4 as uuid } from 'uuid';
import { successResponse, errorResponse, unauthorizedResponse, HttpError } from '@/lib/api-response';
import { requireAttachmentParentWrite } from '@/lib/guards/attachment-guard';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { generatePresignedUploadUrl } from '@/lib/s3';
import { prisma } from '@/lib/db/client';

export async function POST(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const { fileName, mimeType, fileSize, taskId, activityLogId, noteId } = body;

    if (typeof fileName !== 'string' || typeof mimeType !== 'string' || !Number.isInteger(fileSize) || fileSize <= 0) {
      return errorResponse('fileName, mimeType, and a positive integer fileSize are required');
    }
    await requireAttachmentParentWrite(session.userId, { taskId, activityLogId, noteId });

    // Unique key; the extension is user input, so keep it to a short alphanumeric suffix.
    const ext = (fileName.includes('.') ? fileName.split('.').pop()! : '').replace(/[^a-z0-9]/gi, '').slice(0, 10);
    const fileKey = `uploads/${uuid()}${ext ? `.${ext}` : ''}`;

    const { uploadUrl, fileUrl } = await generatePresignedUploadUrl(fileKey, mimeType, fileSize);

    // Create the attachment record
    const attachment = await prisma.attachment.create({
      data: {
        fileName,
        fileKey,
        fileUrl,
        fileSize,
        mimeType,
        taskId: taskId || null,
        activityLogId: activityLogId || null,
        noteId: noteId || null,
        uploadedById: session.userId,
      },
    });

    return successResponse({ uploadUrl, attachment }, 201);
  } catch (error: any) {
    if (error instanceof HttpError) return errorResponse(error.message, error.status);
    if (error.message.includes('not allowed') || error.message.includes('5MB')) {
      return errorResponse(error.message, 400);
    }
    return errorResponse('Upload failed', 500);
  }
}
