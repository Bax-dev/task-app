import { NextRequest } from 'next/server';
import { CreateLabel } from '@/app/api/modules/labels/controllers';

export async function POST(request: NextRequest) {
  return CreateLabel(request);
}
