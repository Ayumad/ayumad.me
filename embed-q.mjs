import { pipeline, env } from '@huggingface/transformers';
env.cacheDir = './.hf-cache';
const ex = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { quantized: true, dtype: 'q8' });
const o = await ex('hello', { pooling: 'mean', normalize: true });
console.log('ok', o.dims);
