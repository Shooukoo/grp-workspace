-- ============================================================
-- RLS Policies necesarias para el módulo de Clientes
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Permite que cada usuario autenticado lea su propio perfil
--    (necesario para que createCustomerAction obtenga el workshop_id)
CREATE POLICY "Users can read their own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);


-- 2. Permite que usuarios autenticados inserten clientes
--    solo en su propio taller (workshop_id debe coincidir con su perfil)
CREATE POLICY "Workshop members can insert customers"
ON customers
FOR INSERT
TO authenticated
WITH CHECK (
  workshop_id = (
    SELECT workshop_id FROM profiles WHERE id = auth.uid()
  )
);


-- 3. Permite que usuarios autenticados lean los clientes de su taller
--    (si no existe ya esta policy, la tabla se verá vacía aunque haya datos)
CREATE POLICY "Workshop members can read their customers"
ON customers
FOR SELECT
TO authenticated
USING (
  workshop_id = (
    SELECT workshop_id FROM profiles WHERE id = auth.uid()
  )
);
