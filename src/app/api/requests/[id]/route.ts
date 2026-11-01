import { requestServiceDeps, sessionUser } from '@/integrations/server';
import { runRequestCommand } from '@/integrations/requestService';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const user = await sessionUser();
  const result = await runRequestCommand(id, body, user?.id ?? null, requestServiceDeps());
  return Response.json(result.body, { status: result.status });
}
