import { startDeposit } from '@/integrations/paymentService';
import { paymentServiceDeps, sessionUser } from '@/integrations/server';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const user = await sessionUser();
  const result = await startDeposit(id, user?.id ?? null, paymentServiceDeps());
  return Response.json(result.body, { status: result.status });
}
