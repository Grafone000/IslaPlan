import { useState } from 'react';
import { useWizard } from '@/components/wizard/WizardProvider';
import { estimateContent as content } from '@/content/estimate';
import type { RequestCommand } from '@/domain/commands';
import { requestsApi } from '@/integrations';

export function useRequestCommand() {
  const wizard = useWizard();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolves to false when the command failed, so callers can stay on the page.
  async function run(command: RequestCommand): Promise<boolean> {
    if (!wizard) {
      return false;
    }
    setBusy(true);
    setError(null);
    try {
      const request = await requestsApi.command(wizard.state.id, command);
      wizard.dispatch({ type: 'SET_REQUEST', request });
      return true;
    } catch {
      setError(content.error);
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { run, busy, error };
}
