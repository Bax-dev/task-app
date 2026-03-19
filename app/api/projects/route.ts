import { NextRequest } from 'next/server';
import { handleCreateProject, handleGetUserProjects } from '@/app/api/modules/projects/controllers';

export async function POST(request: NextRequest) {
  return handleCreateProject(request);
}

export async function GET(request: NextRequest) {
  return handleGetUserProjects(request);
}
