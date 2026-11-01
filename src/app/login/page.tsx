import { AuthForm } from '@/components/auth/AuthForm';
import { safeNextPath } from '@/domain/validation';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AuthForm next={safeNextPath(next)} />;
}
