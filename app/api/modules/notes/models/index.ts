import { prisma } from '@/lib/db/client';

export async function createNote(data: {
  title: string;
  content: string;
  organizationId: string;
  createdById: string;
}) {
  return prisma.note.create({
    data,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      attachments: {
        select: { id: true, fileName: true, fileUrl: true, fileSize: true, mimeType: true },
        orderBy: { createdAt: 'desc' as const },
      },
    },
  });
}

export async function findNoteById(id: string) {
  return prisma.note.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      attachments: {
        select: { id: true, fileName: true, fileUrl: true, fileSize: true, mimeType: true },
        orderBy: { createdAt: 'desc' as const },
      },
    },
  });
}

export async function findNotesByOrganization(organizationId: string) {
  return prisma.note.findMany({
    where: { organizationId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      attachments: {
        select: { id: true, fileName: true, fileUrl: true, fileSize: true, mimeType: true },
        orderBy: { createdAt: 'desc' as const },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function updateNote(id: string, data: { title?: string; content?: string }) {
  return prisma.note.update({
    where: { id },
    data,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      attachments: {
        select: { id: true, fileName: true, fileUrl: true, fileSize: true, mimeType: true },
        orderBy: { createdAt: 'desc' as const },
      },
    },
  });
}

export async function deleteNote(id: string) {
  return prisma.note.delete({ where: { id } });
}
