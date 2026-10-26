import type { SqlClient } from "./migrate";

/**
 * The columns of `stage_packs` that come from a content pack.
 *
 * Deliberately structural rather than `StagePack`, so this package does not
 * depend on the content package. The caller passes the packs it has.
 */
export interface PackRow {
  id: string;
  kind: string;
  stageIndex: number;
  stageUnit: string;
  locale: string;
  country: string;
  title: string;
  subtitle?: string | null;
  baby?: { development?: string | null } | null;
  you?: { body?: string | null } | null;
  reviewedBy: string;
  reviewedAt: string;
}

/**
 * Writes the packs into `stage_packs`, updating the ones already there.
 *
 * The table is not a cache: `shared_items`, `item_state` and `stage_progress`
 * all carry a foreign key to it, so a pack that is not in the table cannot be
 * referenced. That is why the app syncs on first use rather than waiting for
 * somebody to run the seed.
 */
export async function syncPacks(db: SqlClient, packs: readonly PackRow[]): Promise<number> {
  let written = 0;
  for (const pack of packs) {
    await db.query(
      `insert into stage_packs (
         id, kind, stage_index, stage_unit, locale, country, title, subtitle,
         baby, you, payload, status, reviewed_by, reviewed_at, published_at
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'published',$12,$13,now())
       on conflict (id) do update set
         kind = excluded.kind,
         stage_index = excluded.stage_index,
         stage_unit = excluded.stage_unit,
         title = excluded.title,
         subtitle = excluded.subtitle,
         baby = excluded.baby,
         you = excluded.you,
         payload = excluded.payload,
         status = excluded.status,
         reviewed_by = excluded.reviewed_by,
         reviewed_at = excluded.reviewed_at`,
      [
        pack.id,
        pack.kind,
        pack.stageIndex,
        pack.stageUnit,
        pack.locale,
        pack.country,
        pack.title,
        pack.subtitle ?? null,
        pack.baby?.development ?? null,
        pack.you?.body ?? null,
        JSON.stringify(pack),
        pack.reviewedBy,
        pack.reviewedAt,
      ],
    );
    written += 1;
  }
  return written;
}
