import { NextRequest } from 'next/server';
import { CreateComment } from '@/app/api/modules/comments/controllers';

export async function POST(request: NextRequest) {
  return CreateComment(request);
}
