import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function IndexPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  if (session.user?.role === 'ADMIN') {
    redirect('/admin/dashboard');
  } else {
    redirect('/seller/products');
  }
}
