import { handleRefresh } from '@/app/api/modules/auth/controllers';

export async function POST() {
  return handleRefresh();
}
