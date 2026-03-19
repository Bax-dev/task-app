import { NextRequest } from 'next/server';
import { v4 as uuid } from 'uuid';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { generatePresignedUploadUrl } from '@/lib/s3';
import { prisma } from '@/lib/db/client';

export async function POST(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const { fileName, mimeType, fileSize, taskId, activityLogId, noteId } = body;

    if (!fileName || !mimeType || !fileSize) {
      return errorResponse('fileName, mimeType, and fileSize are required');
    }

    // Generate a unique key
    const ext = fileName.split('.').pop() || '';
    const fileKey = `uploads/${uuid()}.${ext}`;

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
    if (error.message.includes('not allowed') || error.message.includes('5MB')) {
      return errorResponse(error.message, 400);
    }
    return errorResponse('Upload failed', 500);
  }
}
