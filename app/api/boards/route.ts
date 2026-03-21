import { NextRequest } from 'next/server';
import { CreateBoard } from '@/app/api/modules/boards/controllers';

export async function POST(request: NextRequest) {
  return CreateBoard(request);
}
