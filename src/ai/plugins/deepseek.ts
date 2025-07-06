import {
  defineModel,
  modelRef,
  type CandidateData,
  type GenerateRequest,
  type GenerateResponse,
  type Plugin,
} from 'genkit';

const DEEPSEEK_API_BASE_URL = 'https://api.deepseek.com/v1';

// Define model references that flows can use.
export const deepseekChat = modelRef({
  name: 'deepseek-chat',
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
async function deepseekGenerate(
  request: GenerateRequest,
  apiKey: string
): Promise<GenerateResponse> {
  const modelName = request.model.name.split('/')[1];

  const messages = request.messages.map((message) => ({
    role: message.role === 'model' ? 'assistant' : message.role,
    content: message.content.map((part) => part.text).join(''),
  }));

  const body = {
    model: modelName,
    messages: messages,
    temperature: request.config?.temperature,
    max_tokens: request.config?.maxOutputTokens,
    top_p: request.config?.topP,
    stop: request.config?.stopSequences,
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
    const errorData = await response.json();
    throw new Error(
      `DeepSeek API error (${response.status}): ${JSON.stringify(errorData)}`
    );
  }

  const result = await response.json();

  const candidates: CandidateData[] = result.choices.map((choice: any) => ({
    index: choice.index,
    finishReason: choice.finish_reason === 'stop' ? 'stop' : 'other',
    message: {
      role: 'model',
      content: [{ text: choice.message.content }],
    },
  }));

  return {
    candidates,
    usage: {
      inputTokens: result.usage.prompt_tokens,
      outputTokens: result.usage.completion_tokens,
      totalTokens: result.usage.total_tokens,
    },
    custom: result,
  };
}

// The plugin definition.
export const deepseek: Plugin<{ apiKey?: string }> = (params) => {
  const apiKey = params?.apiKey || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured.');
  }

  return {
    name: 'genkit-plugin-custom-deepseek',
    configure: (config) => {
      defineModel(
        {
          name: deepseekChat.name,
          ...deepseekChat.info,
        },
        (request) => deepseekGenerate(request, apiKey)
      );
    },
  };
};
