import { confirmDeposit } from '@/integrations/paymentService';
import { paymentServiceDeps, sessionUser } from '@/integrations/server';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const user = await sessionUser();
  const result = await confirmDeposit(id, body, user?.id ?? null, paymentServiceDeps());
  return Response.json(result.body, { status: result.status });
}
