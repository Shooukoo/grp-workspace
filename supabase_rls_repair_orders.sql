-- ============================================================
-- RLS Policies para la tabla repair_orders
-- EJECUTAR EN: Supabase Dashboard → SQL Editor
-- ============================================================
-- Estas políticas garantizan aislamiento multi-tenant a nivel
-- de base de datos. Sin ellas, cualquier usuario autenticado
-- puede leer/escribir órdenes de otros talleres.
-- ============================================================

-- Asegurarse que RLS esté habilitado en la tabla
ALTER TABLE repair_orders ENABLE ROW LEVEL SECURITY;

-- ── SELECT: solo órdenes del propio taller ──────────────────────────────────
CREATE POLICY "Workshop members can read their orders"
ON repair_orders
FOR SELECT
TO authenticated
USING (
  workshop_id = (
    SELECT workshop_id FROM profiles WHERE id = auth.uid()
  )
);

-- ── INSERT: solo en el propio taller ────────────────────────────────────────
CREATE POLICY "Workshop members can insert orders"
ON repair_orders
FOR INSERT
TO authenticated
WITH CHECK (
  workshop_id = (
    SELECT workshop_id FROM profiles WHERE id = auth.uid()
  )
);

-- ── UPDATE: solo órdenes del propio taller ──────────────────────────────────
CREATE POLICY "Workshop members can update their orders"
ON repair_orders
FOR UPDATE
TO authenticated
USING (
  workshop_id = (
    SELECT workshop_id FROM profiles WHERE id = auth.uid()
  )
)
WITH CHECK (
  workshop_id = (
    SELECT workshop_id FROM profiles WHERE id = auth.uid()
  )
);

-- ── DELETE: solo órdenes del propio taller ──────────────────────────────────
CREATE POLICY "Workshop members can delete their orders"
ON repair_orders
FOR DELETE
TO authenticated
USING (
  workshop_id = (
    SELECT workshop_id FROM profiles WHERE id = auth.uid()
  )
);
