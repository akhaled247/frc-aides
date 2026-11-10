import { z } from 'zod';

export const defeatMetricSchema = z.literal('worst_record');

export const defeatTeamSchema = z.object({
  number: z.number().int().positive(),
  name: z.string().min(1).max(120).optional(),
});

export const defeatEdgeSchema = z.object({
  from: z.number().int().positive(),
  to: z.number().int().positive(),
  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  ties: z.number().int().nonnegative().optional(),
});

export const defeatBasinSchema = z.object({
  id: z.string().min(1),
  cycle: z.array(z.number().int().positive()).min(1),
  memberCount: z.number().int().nonnegative(),
});

export const defeatMetaSchema = z.object({
  metric: defeatMetricSchema,
  officialOnly: z.literal(true),
  generatedAt: z.string().min(1),
  source: z.string().min(1),
  /** Documented ranking: lower win% worse; then more losses; then lower opponent team #. */
  tieBreak: z.literal('winpct_then_losses_then_team_number'),
  years: z.array(z.number().int()).optional(),
  matchCount: z.number().int().nonnegative().optional(),
  teamCount: z.number().int().nonnegative().optional(),
});

export const defeatEdgesCatalogSchema = z
  .object({
    meta: defeatMetaSchema,
    teams: z.record(z.string(), defeatTeamSchema),
    /** Successor adjacency: team number string → nemesis team number. */
    graph: z.record(z.string(), z.number().int().positive()),
    edges: z.array(defeatEdgeSchema),
    basins: z.array(defeatBasinSchema).optional(),
  })
  .superRefine((catalog, ctx) => {
    const fromCounts = new Map<number, number>();
    for (const edge of catalog.edges) {
      fromCounts.set(edge.from, (fromCounts.get(edge.from) ?? 0) + 1);
      if (!catalog.teams[String(edge.from)]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `edge from ${edge.from} missing teams entry`,
        });
      }
      if (!catalog.teams[String(edge.to)]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `edge to ${edge.to} missing teams entry`,
        });
      }
      if (catalog.graph[String(edge.from)] !== edge.to) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `graph[${edge.from}] !== edge.to (${catalog.graph[String(edge.from)]} vs ${edge.to})`,
        });
      }
    }
    for (const [from, count] of fromCounts) {
      if (count > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `team ${from} has ${count} outgoing edges; expected ≤ 1`,
        });
      }
    }
    for (const key of Object.keys(catalog.graph)) {
      if (!catalog.edges.some((e) => String(e.from) === key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `graph key ${key} has no matching edge`,
        });
      }
    }
  });

export type DefeatTeam = z.infer<typeof defeatTeamSchema>;
export type DefeatEdge = z.infer<typeof defeatEdgeSchema>;
export type DefeatBasin = z.infer<typeof defeatBasinSchema>;
export type DefeatMeta = z.infer<typeof defeatMetaSchema>;
export type DefeatEdgesCatalog = z.infer<typeof defeatEdgesCatalogSchema>;
