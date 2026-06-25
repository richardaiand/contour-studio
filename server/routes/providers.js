import { config } from '../config.js';

const AIAND_FALLBACK_MODELS = [
  { id: 'deepseek-ai/deepseek-v4-pro', name: 'DeepSeek V4 Pro' },
  { id: 'deepseek-ai/deepseek-v4-flash', name: 'DeepSeek V4 Flash' },
  { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B' },
  { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B' },
  { id: 'mistralai/Mixtral-8x22B-Instruct-v0.1', name: 'Mixtral 8x22B' },
  { id: 'google/gemma-2-27b-it', name: 'Gemma 2 27B' },
];

export default async function (fastify) {
  fastify.get('/aiand/models', async (req, reply) => {
    const key = config.providers.aiand.apiKey;
    if (!key) {
      return { models: AIAND_FALLBACK_MODELS };
    }

    try {
      const res = await fetch(`${config.providers.aiand.endpoint}/models`, {
        headers: {
          Authorization: `Bearer ${key}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        return { models: AIAND_FALLBACK_MODELS };
      }

      const data = await res.json();
      const models = (data.data || []).map((m) => ({
        id: m.id,
        name: m.name || m.id,
      }));

      return { models: models.length ? models : AIAND_FALLBACK_MODELS };
    } catch (err) {
      req.log.warn({ err }, 'Failed to fetch AIand models');
      return { models: AIAND_FALLBACK_MODELS };
    }
  });
}
