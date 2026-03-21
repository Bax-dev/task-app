import { NextRequest } from 'next/server';
import { CreateCustomField } from '@/app/api/modules/custom-fields/controllers';

export async function POST(request: NextRequest) {
  return CreateCustomField(request);
}
