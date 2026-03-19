import { handleLogout } from '@/app/api/modules/auth/controllers';

export async function POST() {
  return handleLogout();
}
