import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

/**
 * Scambia i livelli di razionalità 5 e 6.
 * Livello 5 "Giudizi di valore" (0 lemmi) → diventa numero 6
 * Livello 6 "Istituzioni" (con lemmi) → diventa numero 5
 *
 * Approccio: swap del campo `numero` sulle righe, senza toccare FK.
 * Le FK in definizioni_rels/ricorrenze_rels puntano a `id`, non a `numero`.
 * Script idempotente: esegue solo se livello 5 è ancora "Giudizi di valore".
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    DO $$
    DECLARE
      v_level5_id integer;
      v_level6_id integer;
      v_level5_nome varchar;
    BEGIN
      -- Trova livello 5 per lemmario 1
      SELECT lr.id, lr.nome INTO v_level5_id, v_level5_nome
      FROM livelli_razionalita lr
      JOIN livelli_razionalita_rels lrr ON lrr.parent_id = lr.id AND lrr.path = 'lemmario'
      WHERE lr.numero = 5 AND lrr.lemmari_id = 1;

      -- Idempotenza: esegui solo se livello 5 è ancora "Giudizi di valore"
      IF v_level5_nome = 'Giudizi di valore' THEN
        SELECT lr.id INTO v_level6_id
        FROM livelli_razionalita lr
        JOIN livelli_razionalita_rels lrr ON lrr.parent_id = lr.id AND lrr.path = 'lemmario'
        WHERE lr.numero = 6 AND lrr.lemmari_id = 1;

        -- Swap con valore temporaneo
        UPDATE livelli_razionalita SET numero = 99 WHERE id = v_level5_id;
        UPDATE livelli_razionalita SET numero = 5 WHERE id = v_level6_id;
        UPDATE livelli_razionalita SET numero = 6 WHERE id = v_level5_id;

        RAISE NOTICE 'Livelli scambiati: ID % (5->6), ID % (6->5)', v_level5_id, v_level6_id;
      ELSE
        RAISE NOTICE 'Swap gia applicato (livello 5 = "%"), skip', v_level5_nome;
      END IF;
    END $$;
  `)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    DO $$
    DECLARE
      v_level5_id integer;
      v_level6_id integer;
      v_level5_nome varchar;
    BEGIN
      -- Trova livello 5 per lemmario 1 (dopo lo swap sarà "Istituzioni")
      SELECT lr.id, lr.nome INTO v_level5_id, v_level5_nome
      FROM livelli_razionalita lr
      JOIN livelli_razionalita_rels lrr ON lrr.parent_id = lr.id AND lrr.path = 'lemmario'
      WHERE lr.numero = 5 AND lrr.lemmari_id = 1;

      -- Rollback: esegui solo se livello 5 è "Istituzioni" (già swappato)
      IF v_level5_nome = 'Istituzioni' THEN
        SELECT lr.id INTO v_level6_id
        FROM livelli_razionalita lr
        JOIN livelli_razionalita_rels lrr ON lrr.parent_id = lr.id AND lrr.path = 'lemmario'
        WHERE lr.numero = 6 AND lrr.lemmari_id = 1;

        -- Swap inverso
        UPDATE livelli_razionalita SET numero = 99 WHERE id = v_level5_id;
        UPDATE livelli_razionalita SET numero = 5 WHERE id = v_level6_id;
        UPDATE livelli_razionalita SET numero = 6 WHERE id = v_level5_id;

        RAISE NOTICE 'Rollback livelli: ID % (5->6), ID % (6->5)', v_level5_id, v_level6_id;
      ELSE
        RAISE NOTICE 'Rollback non necessario (livello 5 = "%")', v_level5_nome;
      END IF;
    END $$;
  `)
}
