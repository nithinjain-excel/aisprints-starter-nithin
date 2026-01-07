import { redirect } from 'next/navigation';

export default async function Home() {
  // Redirect to dashboard (which handles role-based routing)
  redirect('/dashboard');
}
