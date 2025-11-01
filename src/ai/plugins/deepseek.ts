
import { modelRef } from 'genkit';

const DEEPSEEK_API_BASE_URL = 'https://api.deepseek.com/v1';

// Define model references that flows can use.
export const deepseekChat = modelRef({
  name: 'deepseek/deepseek-chat',
  info: {
    label: 'DeepSeek Chat',
    supports: {
      multiturn: true,
      tools: false,
      media: false,
      systemRole: true,
    },
  },
});

// The core function that calls the DeepSeek API.
async function deepseekGenerate(request: any, apiKey: string): Promise<any> {
  // Lightweight compatibility wrapper that calls the DeepSeek REST API and
  // returns a permissive result shape. We avoid depending on genkit's
  // internal types here so the plugin remains resilient to genkit API
  // changes.
  const modelName = request?.model?.name?.split?.('/')?.[1] ?? 'deepseek-chat';

  const messages = (request?.messages || []).map((message: any) => ({
    role: message.role === 'model' ? 'assistant' : message.role,
    content: message.content?.map((part: any) => part.text).join('') || '',
  }));

  const body: any = {
    model: modelName,
    messages,
    temperature: request?.config?.temperature,
    max_tokens: request?.config?.maxOutputTokens,
    top_p: request?.config?.topP,
    stop: request?.config?.stopSequences,
  };

  const response = await fetch(`${DEEPSEEK_API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(`DeepSeek API error (${response.status}): ${JSON.stringify(errorData)}`);
  }

  const result = await response.json().catch(() => ({}));

  // Return a permissive shape similar to what older genkit plugins expected.
  const candidates = (result.choices || []).map((choice: any, index: number) => ({
    index: choice.index ?? index,
    finishReason: choice.finish_reason === 'stop' ? 'stop' : 'other',
    message: { role: 'model', content: [{ text: choice?.message?.content ?? choice?.text ?? '' }] },
  }));

  return {
    candidates,
    usage: {
      inputTokens: result?.usage?.prompt_tokens ?? 0,
      outputTokens: result?.usage?.completion_tokens ?? 0,
      totalTokens: result?.usage?.total_tokens ?? 0,
    },
    custom: result,
  };
}

// The plugin definition, now exported as a function.
export const deepseekPlugin = (): any => ({
  name: 'genkit-plugin-custom-deepseek',
  configure: (_config: any) => {
    // We intentionally avoid calling genkit internal registration APIs here.
    // Newer genkit versions may provide different plugin hooks; to keep this
    // plugin low-risk we only ensure the environment variable exists and log
    // a registration hint. The REST wrapper deepseekGenerate is exported
    // and can be used directly by flows when needed.
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.warn('DeepSeek plugin: DEEPSEEK_API_KEY not set; plugin inactive');
    } else {
      console.info('DeepSeek plugin registered (no-op configure)');
    }
  },
});

// Also export the low-level generator in case code wants to call DeepSeek directly.
export { deepseekGenerate };
