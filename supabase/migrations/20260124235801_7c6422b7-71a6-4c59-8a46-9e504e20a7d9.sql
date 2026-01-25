-- Fix other tables to prevent recursion and enable admin access

-- TRANSACTIONS: Fix policies
DROP POLICY IF EXISTS "Users view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users manage own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins manage all transactions" ON public.transactions;

CREATE POLICY "transactions_select"
ON public.transactions FOR SELECT TO authenticated
USING (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "transactions_insert"
ON public.transactions FOR INSERT TO authenticated
WITH CHECK (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "transactions_update"
ON public.transactions FOR UPDATE TO authenticated
USING (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "transactions_delete"
ON public.transactions FOR DELETE TO authenticated
USING (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- SCHEDULED_PAYMENTS: Fix policies  
DROP POLICY IF EXISTS "Users manage own scheduled payments" ON public.scheduled_payments;
DROP POLICY IF EXISTS "Admins manage all scheduled payments" ON public.scheduled_payments;

CREATE POLICY "scheduled_payments_all"
ON public.scheduled_payments FOR ALL TO authenticated
USING (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- SALARY_CREDITS: Fix policies
DROP POLICY IF EXISTS "Users view own salary credits" ON public.salary_credits;
DROP POLICY IF EXISTS "Admins manage all salary credits" ON public.salary_credits;

CREATE POLICY "salary_credits_all"
ON public.salary_credits FOR ALL TO authenticated
USING (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- CATEGORIES: Fix policies
DROP POLICY IF EXISTS "Users manage own categories" ON public.categories;
DROP POLICY IF EXISTS "Admins manage all categories" ON public.categories;

CREATE POLICY "categories_all"
ON public.categories FOR ALL TO authenticated
USING (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- GOALS: Fix policies
DROP POLICY IF EXISTS "Users manage own goals" ON public.goals;
DROP POLICY IF EXISTS "Admins manage all goals" ON public.goals;

CREATE POLICY "goals_all"
ON public.goals FOR ALL TO authenticated
USING (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- PAYMENT_LOGS: Fix policies
DROP POLICY IF EXISTS "Users view own payment logs" ON public.payment_logs;
DROP POLICY IF EXISTS "Admins manage all payment logs" ON public.payment_logs;

CREATE POLICY "payment_logs_all"
ON public.payment_logs FOR ALL TO authenticated
USING (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  user_matricula IN (SELECT matricula FROM public.users_matricula WHERE auth_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);