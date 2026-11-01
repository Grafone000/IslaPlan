import { requestServiceDeps, sessionUser } from '@/integrations/server';
import { createRequest } from '@/integrations/requestService';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const user = await sessionUser();
  const result = await createRequest(body, user?.id ?? null, requestServiceDeps());
  return Response.json(result.body, { status: result.status });
}
