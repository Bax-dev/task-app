import { NextRequest } from 'next/server';
import { handleCreateTask, handleGetUserTasks } from '@/app/api/modules/tasks/controllers';

export async function POST(request: NextRequest) {
  return handleCreateTask(request);
}

export async function GET(request: NextRequest) {
  return handleGetUserTasks(request);
}
