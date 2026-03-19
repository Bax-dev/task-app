import { requireOrgMembership, requireNonGuest } from '@/lib/guards/org-guard';
import * as noteModel from '../models';
import { CreateNoteDTO, UpdateNoteDTO } from '../types';

export async function createNote(userId: string, dto: CreateNoteDTO) {
  await requireNonGuest(userId, dto.organizationId);
  return noteModel.createNote({
    title: dto.title,
    content: dto.content,
    organizationId: dto.organizationId,
    createdById: userId,
  });
}

export async function getNote(noteId: string, userId: string) {
  const note = await noteModel.findNoteById(noteId);
  if (!note) throw new Error('Note not found');
  await requireOrgMembership(userId, note.organizationId);
  return note;
}

export async function getOrganizationNotes(organizationId: string, userId: string) {
  await requireOrgMembership(userId, organizationId);
  return noteModel.findNotesByOrganization(organizationId);
}

export async function updateNote(noteId: string, userId: string, dto: UpdateNoteDTO) {
  const note = await noteModel.findNoteById(noteId);
  if (!note) throw new Error('Note not found');
  await requireNonGuest(userId, note.organizationId);
  return noteModel.updateNote(noteId, dto);
}

export async function deleteNote(noteId: string, userId: string) {
  const note = await noteModel.findNoteById(noteId);
  if (!note) throw new Error('Note not found');
  await requireNonGuest(userId, note.organizationId);
  return noteModel.deleteNote(noteId);
}
