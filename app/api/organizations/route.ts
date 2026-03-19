import { NextRequest } from 'next/server';
import { handleCreateOrg, handleGetUserOrgs } from '@/app/api/modules/organizations/controllers';

export async function POST(request: NextRequest) {
  return handleCreateOrg(request);
}

export async function GET(request: NextRequest) {
  return handleGetUserOrgs(request);
}
