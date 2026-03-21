import { NextRequest } from 'next/server';
import { ReadDashboard, EditDashboard, RemoveDashboard } from '@/app/api/modules/dashboards/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return ReadDashboard(request, id);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return EditDashboard(request, id);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return RemoveDashboard(request, id);
}
