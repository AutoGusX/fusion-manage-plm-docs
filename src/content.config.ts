import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		// `description` is required (not optional) so every page has the
		// one-line summary needed for llms.txt (see scripts/generate-llms-txt.mjs).
		schema: docsSchema({
			extend: () =>
				z.object({
					description: z.string(),
				}),
		}),
	}),
};
