import { redirect } from 'next/navigation';

export default function HomePage() {
  // Middleware handles auth redirects
  // Just redirect to login - authenticated users will be sent to dashboard by middleware
  redirect('/login');
}

