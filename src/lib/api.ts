import type { StudyPlanData } from '../types/result';

export interface GenerateApiOptions {
  prompt: string;
  signal?: AbortSignal;
}

export interface RefineApiOptions {
  currentData: StudyPlanData;
  refinementInstruction: string;
  signal?: AbortSignal;
}

// In development, Vite proxies /api to http://localhost:3001
const API_BASE_URL = '';

/**
 * Call backend proxy /api/generate
 * Never accesses LLM API directly from the browser to keep API keys secure.
 */
export async function callGenerateApi({
  prompt,
  signal,
}: GenerateApiOptions): Promise<string> {
  const timeoutId = setTimeout(() => {
    // If not aborted, let browser fetch timeout or proceed
  }, 45000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
      }),
      signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMsg = `Server error ${response.status}: ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson.error) {
          errorMsg = errJson.error;
        }
      } catch {
        // Fallback to generic message
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return data.raw;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if ((err as Error).name === 'AbortError') {
      throw new Error('Request was canceled.');
    }
    throw err;
  }
}

/**
 * Call backend proxy /api/refine
 */
export async function callRefineApi({
  currentData,
  refinementInstruction,
  signal,
}: RefineApiOptions): Promise<string> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 60000);

  const forwardAbort = () => controller.abort();
  signal?.addEventListener('abort', forwardAbort, { once: true });

  try {
    const response = await fetch(`${API_BASE_URL}/api/refine`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentData,
        refinementInstruction,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorMsg = `Server error ${response.status}: ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson.error) {
          errorMsg = errJson.error;
        }
      } catch {
        // Fallback
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    if (typeof data?.raw !== 'string' || !data.raw.trim()) {
      throw new Error('The refinement service returned an empty response. Please retry.');
    }
    return data.raw;
  } catch (err: unknown) {
    if ((err as Error).name === 'AbortError') {
      throw new Error(signal?.aborted ? 'Refinement request was canceled.' : 'Refinement request timed out after 60 seconds. Please retry.');
    }
    throw err;
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener('abort', forwardAbort);
  }
}

/**
 * Check backend health
 */
export async function checkBackendHealth(): Promise<{ status: string; geminiKeyConfigured: boolean }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    return await res.json();
  } catch (e) {
    return { status: 'offline', geminiKeyConfigured: false };
  }
}
