import { postMessage } from '@/integrations/messageService';
import { messageServiceDeps, sessionUser } from '@/integrations/server';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const form = await request.formData().catch(() => null);
  const message = form?.get('message');
  if (!form || typeof message !== 'string') {
    return Response.json({ error: 'invalid-message' }, { status: 400 });
  }

  let input: { subject: unknown; body: unknown };
  try {
    input = JSON.parse(message);
  } catch {
    return Response.json({ error: 'invalid-message' }, { status: 400 });
  }

  const files = form.getAll('files').filter((file) => file instanceof File);
  const user = await sessionUser();
  const result = await postMessage(id, input, files, user?.id ?? null, messageServiceDeps());
  return Response.json(result.body, { status: result.status });
}
