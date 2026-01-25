import { supabase } from "@/integrations/supabase/client";

// Constants
export const SUBSCRIPTION_PRICE = 29.90;
export const RENEWAL_PRICE = 49.90;
export const COMMISSION_RATE = 0.50; // 50%

export interface AffiliateAccount {
  id: string;
  matricula: number;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  affiliate_code: string | null;
  affiliate_balance: number | null;
  is_affiliate: boolean | null;
  blocked: boolean | null;
  created_at: string;
  pix_key: string | null;
  pix_key_type: string | null;
  total_indicacoes: number;
  total_convertidas: number;
  total_sacado: number;
}

export interface Sale {
  id: string;
  created_at: string;
  amount: number;
  payment_status: string;
  full_name: string;
  affiliate_code: number | null;
  affiliate_name?: string | null;
  commission_amount?: number;
  is_affiliate_sale: boolean;
}

export interface Commission {
  id: string;
  affiliate_matricula: number;
  affiliate_name?: string | null;
  invited_matricula: number;
  invited_name?: string | null;
  amount: number;
  status: string;
  created_at: string;
  released_at: string | null;
}

export interface Withdrawal {
  id: string;
  affiliate_matricula: number;
  affiliate_name?: string | null;
  amount: number;
  status: string;
  requested_at: string;
  processed_at: string | null;
  pix_key: string | null;
  pix_key_type: string | null;
  notes: string | null;
}

export interface Subscription {
  matricula: number;
  full_name: string | null;
  email: string | null;
  subscription_status: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  subscription_type: string | null;
  created_at: string;
}

export interface RevenueStats {
  total: number;
  month: number;
  week: number;
  today: number;
  totalSubscribers: number;
  canceledSubscriptions: number;
  totalAffiliates: number;
  totalIndicacoes: number;
  totalCommissionsPaid: number;
  totalWithdrawals: number;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  count: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  count: number;
}

// Get all affiliates with stats
export async function getAffiliateAccounts(): Promise<AffiliateAccount[]> {
  const { data: affiliates, error } = await supabase
    .from('users_matricula')
    .select('*')
    .eq('is_affiliate', true)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Get stats for each affiliate
  const affiliatesWithStats = await Promise.all(
    (affiliates || []).map(async (affiliate) => {
      // Get total indicacoes
      const { count: indicacoes } = await supabase
        .from('affiliate_invites')
        .select('*', { count: 'exact', head: true })
        .eq('inviter_matricula', affiliate.matricula);

      // Get converted indicacoes (approved)
      const { count: convertidas } = await supabase
        .from('affiliate_invites')
        .select('*', { count: 'exact', head: true })
        .eq('inviter_matricula', affiliate.matricula)
        .eq('status', 'approved');

      // Get total withdrawals
      const { data: withdrawals } = await supabase
        .from('affiliate_withdrawals')
        .select('amount')
        .eq('affiliate_matricula', affiliate.matricula)
        .eq('status', 'approved');

      const totalSacado = withdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;

      return {
        id: affiliate.id,
        matricula: affiliate.matricula,
        full_name: affiliate.full_name,
        email: affiliate.email,
        phone: affiliate.phone,
        affiliate_code: affiliate.affiliate_code,
        affiliate_balance: affiliate.affiliate_balance,
        is_affiliate: affiliate.is_affiliate,
        blocked: affiliate.blocked,
        created_at: affiliate.created_at,
        pix_key: affiliate.pix_key,
        pix_key_type: affiliate.pix_key_type,
        total_indicacoes: indicacoes || 0,
        total_convertidas: convertidas || 0,
        total_sacado: totalSacado,
      };
    })
  );

  return affiliatesWithStats;
}

// Get all sales
export async function getSales(filters?: {
  startDate?: string;
  endDate?: string;
  affiliateCode?: number;
}): Promise<Sale[]> {
  let query = supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate);
  }
  if (filters?.affiliateCode) {
    query = query.eq('affiliate_code', filters.affiliateCode);
  }

  const { data: payments, error } = await query;
  if (error) throw error;

  // Get affiliate names
  const affiliateCodes = [...new Set((payments || []).filter(p => p.affiliate_code).map(p => p.affiliate_code))];
  
  const { data: affiliates } = await supabase
    .from('users_matricula')
    .select('matricula, full_name')
    .in('matricula', affiliateCodes.length > 0 ? affiliateCodes : [0]);

  const affiliateMap = new Map(affiliates?.map(a => [a.matricula, a.full_name]) || []);

  return (payments || []).map(payment => ({
    id: payment.id,
    created_at: payment.created_at,
    amount: Number(payment.amount),
    payment_status: payment.payment_status,
    full_name: payment.full_name,
    affiliate_code: payment.affiliate_code,
    affiliate_name: payment.affiliate_code ? affiliateMap.get(payment.affiliate_code) : null,
    commission_amount: payment.affiliate_code ? SUBSCRIPTION_PRICE * COMMISSION_RATE : 0,
    is_affiliate_sale: !!payment.affiliate_code,
  }));
}

// Get all commissions
export async function getCommissions(): Promise<Commission[]> {
  const { data: commissions, error } = await supabase
    .from('affiliate_commissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Get names
  const matriculas = [
    ...new Set([
      ...(commissions || []).map(c => c.affiliate_matricula),
      ...(commissions || []).map(c => c.invited_matricula)
    ])
  ];

  const { data: users } = await supabase
    .from('users_matricula')
    .select('matricula, full_name')
    .in('matricula', matriculas.length > 0 ? matriculas : [0]);

  const userMap = new Map(users?.map(u => [u.matricula, u.full_name]) || []);

  return (commissions || []).map(c => ({
    id: c.id,
    affiliate_matricula: c.affiliate_matricula,
    affiliate_name: userMap.get(c.affiliate_matricula),
    invited_matricula: c.invited_matricula,
    invited_name: userMap.get(c.invited_matricula),
    amount: Number(c.amount),
    status: c.status,
    created_at: c.created_at,
    released_at: c.released_at,
  }));
}

// Get all withdrawals
export async function getWithdrawals(): Promise<Withdrawal[]> {
  const { data: withdrawals, error } = await supabase
    .from('affiliate_withdrawals')
    .select('*')
    .order('requested_at', { ascending: false });

  if (error) throw error;

  // Get affiliate names
  const matriculas = [...new Set((withdrawals || []).map(w => w.affiliate_matricula))];

  const { data: users } = await supabase
    .from('users_matricula')
    .select('matricula, full_name')
    .in('matricula', matriculas.length > 0 ? matriculas : [0]);

  const userMap = new Map(users?.map(u => [u.matricula, u.full_name]) || []);

  return (withdrawals || []).map(w => ({
    id: w.id,
    affiliate_matricula: w.affiliate_matricula,
    affiliate_name: userMap.get(w.affiliate_matricula),
    amount: Number(w.amount),
    status: w.status,
    requested_at: w.requested_at,
    processed_at: w.processed_at,
    pix_key: w.pix_key,
    pix_key_type: w.pix_key_type,
    notes: w.notes,
  }));
}

// Get subscriptions
export async function getSubscriptions(): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from('users_matricula')
    .select('matricula, full_name, email, subscription_status, subscription_start_date, subscription_end_date, subscription_type, created_at')
    .not('subscription_status', 'is', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get revenue stats
export async function getRevenueStats(): Promise<RevenueStats> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Get all approved payments
  const { data: allPayments } = await supabase
    .from('payments')
    .select('amount, created_at')
    .eq('payment_status', 'approved');

  const payments = allPayments || [];
  
  const total = payments.length * SUBSCRIPTION_PRICE;
  const today = payments.filter(p => p.created_at >= startOfDay).length * SUBSCRIPTION_PRICE;
  const week = payments.filter(p => p.created_at >= startOfWeek).length * SUBSCRIPTION_PRICE;
  const month = payments.filter(p => p.created_at >= startOfMonth).length * SUBSCRIPTION_PRICE;

  // Get active subscribers
  const { count: totalSubscribers } = await supabase
    .from('users_matricula')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_status', 'active');

  // Get canceled subscriptions
  const { count: canceledSubscriptions } = await supabase
    .from('users_matricula')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_status', 'canceled');

  // Get total affiliates
  const { count: totalAffiliates } = await supabase
    .from('users_matricula')
    .select('*', { count: 'exact', head: true })
    .eq('is_affiliate', true)
    .neq('blocked', true);

  // Get total indicacoes
  const { count: totalIndicacoes } = await supabase
    .from('affiliate_invites')
    .select('*', { count: 'exact', head: true });

  // Get total commissions paid
  const { data: paidCommissions } = await supabase
    .from('affiliate_commissions')
    .select('amount')
    .eq('status', 'released');

  const totalCommissionsPaid = paidCommissions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

  // Get total withdrawals
  const { data: approvedWithdrawals } = await supabase
    .from('affiliate_withdrawals')
    .select('amount')
    .eq('status', 'approved');

  const totalWithdrawals = approvedWithdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;

  return {
    total,
    month,
    week,
    today,
    totalSubscribers: totalSubscribers || 0,
    canceledSubscriptions: canceledSubscriptions || 0,
    totalAffiliates: totalAffiliates || 0,
    totalIndicacoes: totalIndicacoes || 0,
    totalCommissionsPaid,
    totalWithdrawals,
  };
}

// Get daily revenue for chart
export async function getDailyRevenue(days: number = 30): Promise<DailyRevenue[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: payments } = await supabase
    .from('payments')
    .select('created_at')
    .eq('payment_status', 'approved')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  // Group by date
  const dailyMap = new Map<string, number>();
  
  // Initialize all days
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    dailyMap.set(dateStr, 0);
  }

  // Count payments per day
  (payments || []).forEach(p => {
    const dateStr = p.created_at.split('T')[0];
    dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);
  });

  return Array.from(dailyMap.entries()).map(([date, count]) => ({
    date,
    revenue: count * SUBSCRIPTION_PRICE,
    count,
  }));
}

// Get monthly revenue for chart
export async function getMonthlyRevenue(months: number = 12): Promise<MonthlyRevenue[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const { data: payments } = await supabase
    .from('payments')
    .select('created_at')
    .eq('payment_status', 'approved')
    .gte('created_at', startDate.toISOString());

  // Group by month
  const monthlyMap = new Map<string, number>();
  
  // Initialize all months
  for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap.set(monthStr, 0);
  }

  // Count payments per month
  (payments || []).forEach(p => {
    const date = new Date(p.created_at);
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap.set(monthStr, (monthlyMap.get(monthStr) || 0) + 1);
  });

  return Array.from(monthlyMap.entries()).map(([month, count]) => ({
    month,
    revenue: count * SUBSCRIPTION_PRICE,
    count,
  }));
}

// Admin actions
export async function blockAffiliate(matricula: number): Promise<void> {
  const { error } = await supabase
    .from('users_matricula')
    .update({ blocked: true })
    .eq('matricula', matricula);

  if (error) throw error;

  // Log action
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('admin_logs').insert({
      admin_id: user.id,
      action: 'affiliate_blocked',
      details: { matricula }
    });
  }
}

export async function unblockAffiliate(matricula: number): Promise<void> {
  const { error } = await supabase
    .from('users_matricula')
    .update({ blocked: false })
    .eq('matricula', matricula);

  if (error) throw error;

  // Log action
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('admin_logs').insert({
      admin_id: user.id,
      action: 'affiliate_unblocked',
      details: { matricula }
    });
  }
}

export async function deleteAffiliate(matricula: number): Promise<void> {
  // Delete affiliate related data first
  await supabase.from('affiliate_invites').delete().eq('inviter_matricula', matricula);
  await supabase.from('affiliate_commissions').delete().eq('affiliate_matricula', matricula);
  await supabase.from('affiliate_withdrawals').delete().eq('affiliate_matricula', matricula);
  
  // Delete user record
  const { error } = await supabase
    .from('users_matricula')
    .delete()
    .eq('matricula', matricula);

  if (error) throw error;

  // Log action
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('admin_logs').insert({
      admin_id: user.id,
      action: 'affiliate_deleted_permanently',
      details: { matricula }
    });
  }
}

// Bulk delete affiliates
export async function deleteAffiliatesBulk(matriculas: number[]): Promise<void> {
  for (const matricula of matriculas) {
    await deleteAffiliate(matricula);
  }
  
  // Log bulk action
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('admin_logs').insert({
      admin_id: user.id,
      action: 'affiliates_bulk_deleted',
      details: { matriculas, count: matriculas.length }
    });
  }
}

export async function recalculateAffiliateBalance(matricula: number): Promise<number> {
  // Get all commissions for this affiliate
  const { data: commissions } = await supabase
    .from('affiliate_commissions')
    .select('amount')
    .eq('affiliate_matricula', matricula)
    .eq('status', 'released');

  // Get all withdrawals
  const { data: withdrawals } = await supabase
    .from('affiliate_withdrawals')
    .select('amount')
    .eq('affiliate_matricula', matricula)
    .eq('status', 'approved');

  const totalCommissions = commissions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
  const totalWithdrawals = withdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;
  const newBalance = totalCommissions - totalWithdrawals;

  // Update balance
  const { error } = await supabase
    .from('users_matricula')
    .update({ affiliate_balance: newBalance })
    .eq('matricula', matricula);

  if (error) throw error;

  // Log action
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('admin_logs').insert({
      admin_id: user.id,
      action: 'affiliate_balance_recalculated',
      details: { matricula, newBalance }
    });
  }

  return newBalance;
}

export async function approveWithdrawal(withdrawalId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('affiliate_withdrawals')
    .update({ 
      status: 'approved',
      processed_at: new Date().toISOString(),
      processed_by: user?.id
    })
    .eq('id', withdrawalId);

  if (error) throw error;

  // Log action
  if (user) {
    await supabase.from('admin_logs').insert({
      admin_id: user.id,
      action: 'withdrawal_approved',
      details: { withdrawalId }
    });
  }
}

export async function rejectWithdrawal(withdrawalId: string, notes: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get withdrawal info to restore balance
  const { data: withdrawal } = await supabase
    .from('affiliate_withdrawals')
    .select('affiliate_matricula, amount')
    .eq('id', withdrawalId)
    .single();

  if (withdrawal) {
    // Restore balance
    const { data: affiliate } = await supabase
      .from('users_matricula')
      .select('affiliate_balance')
      .eq('matricula', withdrawal.affiliate_matricula)
      .single();

    if (affiliate) {
      await supabase
        .from('users_matricula')
        .update({ 
          affiliate_balance: (Number(affiliate.affiliate_balance) || 0) + Number(withdrawal.amount)
        })
        .eq('matricula', withdrawal.affiliate_matricula);
    }
  }
  
  const { error } = await supabase
    .from('affiliate_withdrawals')
    .update({ 
      status: 'rejected',
      processed_at: new Date().toISOString(),
      processed_by: user?.id,
      notes
    })
    .eq('id', withdrawalId);

  if (error) throw error;

  // Log action
  if (user) {
    await supabase.from('admin_logs').insert({
      admin_id: user.id,
      action: 'withdrawal_rejected',
      details: { withdrawalId, notes }
    });
  }
}
