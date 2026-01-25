import { supabase } from '@/integrations/supabase/client';

export type UserStatus = 'pending' | 'approved' | 'rejected';

export type PlanType = 'none' | 'free_trial' | 'paid' | 'blocked';

export interface Profile {
  id: string;
  userId: number; // matricula
  fullName: string;
  email?: string;
  phone?: string;
  cpf?: string;
  initialBalance: number;
  hasCreditCard: boolean;
  creditLimit: number;
  creditAvailable: number;
  creditUsed: number;
  creditDueDay?: number;
  salaryAmount?: number;
  salaryDay?: number;
  createdAt: Date;
  userStatus: UserStatus;
  isAffiliate: boolean;
  affiliateBalance: number;
  saldoAtual: number; // Diferença automática (ganho - gasto)
  ganhoTotal: number; // Soma total de todas as entradas
  gastoTotal: number; // Soma total de todas as saídas
  subscriptionStatus?: string;
  subscriptionEndDate?: Date;
  // New onboarding and plan fields
  onboardingCompleted: boolean;
  onboardingStep: number;
  planType: PlanType;
  trialStartedAt?: Date;
  trialExpiresAt?: Date;
  subscriptionExpiresAt?: Date;
  blocked: boolean;
}

export interface Transaction {
  id?: string;
  amount: number;
  type: 'income' | 'expense';
  paymentMethod: 'debit' | 'credit';
  category: string;
  description: string;
  date: Date;
  userId: number; // user_matricula
}

export interface Goal {
  id?: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  userId: number; // user_matricula
  createdAt: Date;
  isActive: boolean;
}

// Profile functions - using Supabase
export async function getProfile(matricula: number): Promise<Profile | undefined> {
  const { data, error } = await supabase
    .from('users_matricula')
    .select('*')
    .eq('matricula', matricula)
    .maybeSingle();

  if (error || !data) {
    console.error('Error fetching profile:', error);
    return undefined;
  }

  return {
    id: data.id,
    userId: data.matricula,
    fullName: data.full_name || '',
    email: data.email || undefined,
    phone: data.phone || undefined,
    cpf: data.cpf || undefined,
    initialBalance: Number(data.initial_balance) || 0,
    hasCreditCard: data.has_credit_card || false,
    creditLimit: Number(data.credit_limit) || 0,
    creditAvailable: Number(data.credit_available) || 0,
    creditUsed: Number(data.credit_used) || 0,
    creditDueDay: data.credit_due_day || undefined,
    salaryAmount: Number(data.salary_amount) || 0,
    salaryDay: data.salary_day || 5,
    createdAt: new Date(data.created_at),
    userStatus: (data.user_status as UserStatus) || 'pending',
    isAffiliate: data.is_affiliate || false,
    affiliateBalance: Number(data.affiliate_balance) || 0,
    saldoAtual: Number(data.saldo_atual) || 0,
    ganhoTotal: Number(data.ganho_total) || 0,
    gastoTotal: Number(data.gasto_total) || 0,
    subscriptionStatus: data.subscription_status,
    subscriptionEndDate: data.subscription_end_date ? new Date(data.subscription_end_date) : undefined,
    // New onboarding and plan fields
    onboardingCompleted: data.onboarding_completed || false,
    onboardingStep: data.onboarding_step || 0,
    planType: (data.plan_type as PlanType) || 'none',
    trialStartedAt: data.trial_started_at ? new Date(data.trial_started_at) : undefined,
    trialExpiresAt: data.subscription_end_date ? new Date(data.subscription_end_date) : undefined,
    subscriptionExpiresAt: data.subscription_expires_at ? new Date(data.subscription_expires_at) : undefined,
    blocked: data.blocked || false,
  };
}

export async function createProfile(profile: Omit<Profile, 'id' | 'createdAt'>): Promise<string | null> {
  const { data, error } = await supabase
    .from('users_matricula')
    .insert({
      matricula: profile.userId,
      full_name: profile.fullName,
      email: profile.email || null,
      phone: profile.phone || null,
      initial_balance: profile.initialBalance,
      has_credit_card: profile.hasCreditCard,
      credit_limit: profile.creditLimit,
      credit_available: profile.creditAvailable,
      credit_used: profile.creditUsed,
      credit_due_day: profile.creditDueDay || null,
      user_status: profile.userStatus || 'pending',
      saldo_atual: profile.saldoAtual || profile.initialBalance || 0, // Initialize saldo_atual
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating profile:', error);
    return null;
  }

  return data?.id || null;
}

export async function updateProfile(matricula: number, updates: Partial<Profile>): Promise<boolean> {
  const updateData: Record<string, unknown> = {};

  if (updates.fullName !== undefined) updateData.full_name = updates.fullName;
  if (updates.email !== undefined) updateData.email = updates.email;
  if (updates.phone !== undefined) updateData.phone = updates.phone;
  if (updates.cpf !== undefined) updateData.cpf = updates.cpf;
  if (updates.initialBalance !== undefined) updateData.initial_balance = updates.initialBalance;
  if (updates.salaryAmount !== undefined) updateData.salary_amount = updates.salaryAmount;
  if (updates.hasCreditCard !== undefined) updateData.has_credit_card = updates.hasCreditCard;
  if (updates.creditLimit !== undefined) updateData.credit_limit = updates.creditLimit;
  if (updates.creditAvailable !== undefined) updateData.credit_available = updates.creditAvailable;
  if (updates.creditUsed !== undefined) updateData.credit_used = updates.creditUsed;
  if (updates.creditDueDay !== undefined) updateData.credit_due_day = updates.creditDueDay;
  if (updates.saldoAtual !== undefined) updateData.saldo_atual = updates.saldoAtual;

  const { error } = await supabase
    .from('users_matricula')
    .update(updateData)
    .eq('matricula', matricula);

  if (error) {
    console.error('Error updating profile:', error);
    return false;
  }

  return true;
}

// Transaction functions - using Supabase
export async function getTransactions(userId: number): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, categories(name)')
    .eq('user_matricula', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return (data || []).map((t) => ({
    id: t.id,
    amount: Number(t.amount),
    type: t.type as 'income' | 'expense',
    paymentMethod: (t.payment_method as 'debit' | 'credit') || 'debit',
    category: (t.categories as { name: string } | null)?.name || t.description || 'Outros',
    description: t.description || '',
    date: new Date(t.created_at), // Use created_at for full timestamp
    userId: t.user_matricula,
  }));
}

export async function addTransaction(transaction: Omit<Transaction, 'id'>): Promise<string | null> {
  // First, find or create the category
  let categoryId: string | null = null;

  const { data: existingCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('user_matricula', transaction.userId)
    .eq('name', transaction.category)
    .maybeSingle();

  if (existingCategory) {
    categoryId = existingCategory.id;
  } else {
    // Create new category
    const categoryType = transaction.type === 'income' ? 'income' : 'expense';
    const { data: newCategory } = await supabase
      .from('categories')
      .insert({
        name: transaction.category,
        type: categoryType,
        user_matricula: transaction.userId,
      })
      .select('id')
      .single();

    if (newCategory) {
      categoryId = newCategory.id;
    }
  }

  // Insert the transaction
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      amount: transaction.amount,
      type: transaction.type,
      payment_method: transaction.paymentMethod,
      category_id: categoryId,
      description: transaction.description,
      date: transaction.date.toISOString().split('T')[0],
      user_matricula: transaction.userId,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error adding transaction:', error);
    return null;
  }

  // Get current state to update totals
  const { data: profile } = await supabase
    .from('users_matricula')
    .select('ganho_total, gasto_total, credit_used, initial_balance, salary_amount, saldo_atual')
    .eq('matricula', transaction.userId)
    .single();

  if (profile) {
    let newGanhoTotal = Number(profile.ganho_total) || 0;
    let newGastoTotal = Number(profile.gasto_total) || 0;
    let newCreditUsed = Number(profile.credit_used) || 0;
    let currentSaldoAtual = Number(profile.saldo_atual) || 0;

    if (transaction.type === 'income') {
      newGanhoTotal += transaction.amount;
      currentSaldoAtual += transaction.amount;
    } else if (transaction.type === 'expense') {
      if (transaction.paymentMethod === 'credit') {
        newCreditUsed += transaction.amount;
      } else {
        newGastoTotal += transaction.amount;
        currentSaldoAtual -= transaction.amount;
      }
    }

    // Update the database
    const { error: updateError } = await supabase
      .from('users_matricula')
      .update({
        ganho_total: newGanhoTotal,
        gasto_total: newGastoTotal,
        saldo_atual: currentSaldoAtual,
        credit_used: newCreditUsed,
      })
      .eq('matricula', transaction.userId);

    if (updateError) {
      console.error('Error updating profile with transaction:', updateError);
    }
  }

  return data?.id || null;
}

// Goal functions - using Supabase
export async function getGoals(userId: number): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_matricula', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching goals:', error);
    return [];
  }

  return (data || []).map((g) => ({
    id: g.id,
    title: g.name,
    targetAmount: Number(g.target_amount),
    currentAmount: Number(g.current_amount) || 0,
    deadline: new Date(g.deadline || Date.now()),
    userId: g.user_matricula,
    createdAt: new Date(g.created_at),
    isActive: g.is_active ?? true,
  }));
}

export async function addGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'isActive'>): Promise<string | null> {
  const { data, error } = await supabase
    .from('goals')
    .insert({
      name: goal.title,
      target_amount: goal.targetAmount,
      current_amount: goal.currentAmount,
      deadline: goal.deadline.toISOString().split('T')[0],
      user_matricula: goal.userId,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error adding goal:', error);
    return null;
  }

  return data?.id || null;
}

export async function updateGoal(id: string, updates: Partial<Goal>): Promise<boolean> {
  const updateData: Record<string, unknown> = {};

  if (updates.title !== undefined) updateData.name = updates.title;
  if (updates.targetAmount !== undefined) updateData.target_amount = updates.targetAmount;
  if (updates.currentAmount !== undefined) updateData.current_amount = updates.currentAmount;
  if (updates.deadline !== undefined) updateData.deadline = updates.deadline.toISOString().split('T')[0];
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

  const { error } = await supabase
    .from('goals')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating goal:', error);
    return false;
  }

  return true;
}

export async function deleteGoal(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('goals')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting goal:', error);
    return false;
  }

  return true;
}

// Calculate balance and totals using the new columns from DB
export async function calculateBalance(userId: number): Promise<{
  balance: number;
  totalIncome: number;
  totalExpense: number;
  debitBalance: number;
  creditUsed: number;
  ganhoTotal: number;
  gastoTotal: number;
  saldoAtual: number;
}> {
  // Version 2026-01-25-13:00 - Using saldo_atual as single source of truth

  // Get data directly from profile to ensure accuracy
  const { data: profile, error } = await supabase
    .from('users_matricula')
    .select('*')
    .eq('matricula', userId)
    .maybeSingle();

  if (error) {
    // Silent error handling - no console exposure
  }

  if (!profile) {
    return {
      balance: 0, totalIncome: 0, totalExpense: 0, debitBalance: 0, creditUsed: 0, ganhoTotal: 0, gastoTotal: 0, saldoAtual: 0
    };
  }

  const rawProfile = profile as any;
  const saldoAtual = Number(rawProfile.saldo_atual) || 0;
  const ganhoTotal = Number(rawProfile.ganho_total) || 0;
  const gastoTotal = Number(rawProfile.gasto_total) || 0;
  const creditUsed = Number(rawProfile.credit_used) || 0;

  return {
    balance: saldoAtual,
    totalIncome: ganhoTotal,
    totalExpense: gastoTotal,
    debitBalance: saldoAtual,
    creditUsed: creditUsed,
    ganhoTotal: ganhoTotal,
    gastoTotal: gastoTotal,
    saldoAtual: saldoAtual
  };
}

// Categories for transactions
export const EXPENSE_CATEGORIES = [
  { id: 'Alimentação', label: 'Alimentação', icon: 'Utensils' },
  { id: 'Transporte', label: 'Transporte', icon: 'Car' },
  { id: 'Lazer', label: 'Lazer', icon: 'Gamepad2' },
  { id: 'Compras', label: 'Compras', icon: 'ShoppingBag' },
  { id: 'Saúde', label: 'Saúde', icon: 'Heart' },
  { id: 'Educação', label: 'Educação', icon: 'GraduationCap' },
  { id: 'Contas', label: 'Contas', icon: 'Receipt' },
  { id: 'Outros', label: 'Outros', icon: 'MoreHorizontal' },
];

export const INCOME_CATEGORIES = [
  { id: 'Salário', label: 'Salário', icon: 'Briefcase' },
  { id: 'Freelance', label: 'Freelance', icon: 'Laptop' },
  { id: 'Investimentos', label: 'Investimentos', icon: 'TrendingUp' },
  { id: 'Presente', label: 'Presente', icon: 'Gift' },
  { id: 'Outros', label: 'Outros', icon: 'MoreHorizontal' },
];
