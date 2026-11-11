import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { SLUGS_CLASSES } from './classes';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    titulo: z.string(),
    tipo: z.enum(['build', 'combo', 'party', 'talento', 'dica']),
    data: z.coerce.date(),
    resumo: z.string().optional(),
    classe: z.string().optional(),      // ex.: "Paladino 6 / Feiticeiro 6"
    // Para quais classes o post serve. Builds e parties já são detectadas pelo
    // campo `classe` e pelos `membros`; use isto em talentos, combos e dicas.
    classes: z.array(z.enum(SLUGS_CLASSES)).default([]),
    raca: z.string().optional(),
    atributos: z
      .object({
        FOR: z.number(), DES: z.number(), CON: z.number(),
        INT: z.number(), SAB: z.number(), CAR: z.number(),
      })
      .optional(),
    talentos: z.array(z.string()).optional(),
    // Só para tipo "party": quem joga junto e o que cada um faz no combo.
    membros: z
      .array(z.object({
        nome: z.string(),                 // ex.: "Clérigo da Tempestade" ou "Shadowheart"
        classe: z.string(),               // ex.: "Clérigo 12 (Tempestade)"
        papel: z.string(),                // ex.: "Molha o campo e fecha com raio"
        retrato: z.string().optional(),   // arquivo em public/retratos/, sem extensão
      }))
      .optional(),
    tags: z.array(z.string()).default([]),
    rascunho: z.boolean().default(false),
  }),
});

export const collections = { posts };
