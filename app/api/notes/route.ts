import { NextRequest } from 'next/server';
import { handleCreateNote } from '@/app/api/modules/notes/controllers';

export async function POST(request: NextRequest) {
  return handleCreateNote(request);
}
