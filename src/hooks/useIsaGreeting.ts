// INOVA Greeting Hook - Manages voice greetings for each page
// RULES:
// - Each tab has ONE specific voice that plays ONCE per session
// - No overlapping voices
// - Short messages only (max 2 sentences)
// - User's personal ElevenLabs key is ALWAYS prioritized
// Note: Function names kept as "Isa" for backward compatibility

import { useEffect, useRef, useCallback } from 'react';
import {
  isaSpeak,
  isFirstAccessToday,
  markGreetedToday,
  wasTabGreeted,
  markTabGreeted,
  generateFirstAccessGreeting,
  generateHomeGreeting,
  generatePlannerGreeting,
  generateCardGreeting,
  generateProfileGreeting,
  generateAgendaGreeting,
  generateRotinasGreeting,
  calculateDaysUntilDay,
  isVoiceEnabled,
  setCurrentUserMatricula
} from '@/services/isaVoiceService';
import { stopAllVoice, isVoicePlaying } from '@/services/voiceQueueService';
import { calculateBalance, getTransactions, getGoals } from '@/lib/db';
import {
  getUserSalaryInfo,
  calculateMonthlySummary
} from '@/lib/plannerDb';
import {
  getAgendaItems,
  getRotinas,
  getRotinaCompletionsForDate,
  getRotinasForToday,
  isRotinaCompletedToday,
  getTodayDate
} from '@/lib/agendaDb';

export type PageType = 'dashboard' | 'planner' | 'card' | 'goals' | 'ai' | 'agenda' | 'rotinas' | 'transporte' | 'other';

interface UseIsaGreetingOptions {
  pageType: PageType;
  userId: number;
  userName: string;
  initialBalance: number;
  enabled?: boolean;
  creditLimit?: number;
  creditUsed?: number;
  creditDueDay?: number;
}

export function useIsaGreeting({
  pageType,
  userId,
  userName,
  initialBalance,
  enabled = true,
  creditLimit = 0,
  creditUsed = 0,
  creditDueDay = 5
}: UseIsaGreetingOptions) {
  const hasSpoken = useRef(false);
  const isProcessing = useRef(false);

  // Reset hasSpoken when component mounts (new page)
  useEffect(() => {
    hasSpoken.current = false;
    isProcessing.current = false;
    console.log(`[InovaGreeting] Mounted for ${pageType}, resetting state`);
  }, [pageType]);

  const speakGreeting = useCallback(async () => {
    // Check global voice setting
    if (!isVoiceEnabled()) {
      console.log('[InovaGreeting] Voice is globally disabled');
      return;
    }

    if (!enabled || !userId) {
      console.log('[InovaGreeting] Not enabled or no userId');
      return;
    }

    // Set current user matricula for voice services (prioritizes user's personal key)
    setCurrentUserMatricula(userId);

    if (isProcessing.current) {
      console.log('[InovaGreeting] Already processing');
      return;
    }

    if (hasSpoken.current) {
      console.log('[InovaGreeting] Already spoken on this page');
      return;
    }

    // Check if tab was already greeted this session
    const alreadyGreeted = wasTabGreeted(pageType);
    console.log(`[InovaGreeting] Tab ${pageType} already greeted: ${alreadyGreeted}`);


    if (alreadyGreeted) {
      console.log('[InovaGreeting] Tab already greeted this session:', pageType);
      hasSpoken.current = true;
      return;
    }

    // Check if any voice is currently playing
    if (isVoicePlaying()) {
      console.log(`[InovaGreeting] Another voice is playing, will retry once...`);
      // Wait and retry once
      setTimeout(() => {
        if (!hasSpoken.current && !isVoicePlaying()) {
          console.log('[InovaGreeting] Retrying after voice finished');
          speakGreeting();
        }
      }, 2000);
      return;
    }

    console.log(`[InovaGreeting] ✅ Starting greeting for ${pageType}`);
    isProcessing.current = true;

    try {
      const isFirstAccess = isFirstAccessToday();

      // For first access of the day, give special greeting (only on dashboard)
      if (isFirstAccess && pageType === 'dashboard') {
        const greeting = generateFirstAccessGreeting(userName);
        console.log('[InovaGreeting] 🎤 Speaking first access greeting:', greeting);
        await isaSpeak(greeting, pageType);
        markGreetedToday();
        markTabGreeted(pageType);
        hasSpoken.current = true;

        // After first greeting, continue with page-specific info
        await speakPageSpecificGreeting();
      } else {
        // Normal page-specific greeting
        await speakPageSpecificGreeting();
      }
    } catch (error) {
      console.error('[InovaGreeting] ❌ Error:', error);
    } finally {
      isProcessing.current = false;
    }
  }, [pageType, userId, userName, enabled, initialBalance, creditLimit, creditUsed, creditDueDay]);

  const speakPageSpecificGreeting = async () => {
    // Stop any playing audio before starting
    stopAllVoice();

    try {
      let message = '';

      switch (pageType) {
        case 'dashboard': {
          const balanceData = await calculateBalance(userId);

          message = generateHomeGreeting(
            userName,
            balanceData.saldoAtual,
            balanceData.ganhoTotal,
            balanceData.gastoTotal
          );
          break;
        }


        case 'planner': {
          const salaryInfo = await getUserSalaryInfo(userId);

          // Use the same calculation as Planner page - calculateMonthlySummary
          const salaryAmount = salaryInfo?.salaryAmount || 0;
          const salaryDay = salaryInfo?.salaryDay || 5;
          const advanceAmount = salaryInfo?.advanceAmount || 0;

          // Use same function as Planner page (already imported)
          const summary = await calculateMonthlySummary(userId, salaryAmount, salaryDay, advanceAmount);

          const daysUntilSalary = salaryInfo?.salaryDay
            ? calculateDaysUntilDay(salaryInfo.salaryDay)
            : 0;

          // Get biggest expense from summary (same as displayed)
          const biggestExpense = summary.heaviestPayment
            ? { name: summary.heaviestPayment.category || summary.heaviestPayment.name, amount: summary.heaviestPayment.amount }
            : null;

          message = generatePlannerGreeting(
            salaryAmount,
            salaryDay,
            daysUntilSalary,
            summary.totalPayments,
            summary.projectedBalance,
            biggestExpense
          );
          break;
        }

        case 'card': {
          const dueDay = creditDueDay;
          const today = new Date();
          let dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
          if (today.getDate() > dueDay) {
            dueDate = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
          }
          const diffTime = dueDate.getTime() - today.getTime();
          const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          message = generateCardGreeting(creditLimit, creditUsed, dueDay, daysUntilDue);
          break;
        }

        case 'goals': {
          const goals = await getGoals(userId);
          message = generateProfileGreeting(goals.length);
          break;
        }

        case 'agenda': {
          // Get today's agenda items
          const today = getTodayDate();
          const todayItems = await getAgendaItems(userId, today, today);

          // Get next 3 days
          const upcomingDays: { date: string; label: string; items: { titulo: string; hora: string }[] }[] = [];
          const dayLabels = ['Amanhã', 'Depois de amanhã', 'Em 3 dias'];

          for (let i = 1; i <= 3; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const dayItems = await getAgendaItems(userId, dateStr, dateStr);
            upcomingDays.push({
              date: dateStr,
              label: dayLabels[i - 1],
              items: dayItems.map(item => ({ titulo: item.titulo, hora: item.hora }))
            });
          }

          message = generateAgendaGreeting(
            todayItems.map(item => ({ titulo: item.titulo, hora: item.hora })),
            upcomingDays
          );
          break;
        }

        case 'rotinas': {
          // Get today's rotinas
          const allRotinas = await getRotinas(userId);
          const todayRotinas = getRotinasForToday(allRotinas);
          const completions = await getRotinaCompletionsForDate(userId, getTodayDate());

          const completedCount = todayRotinas.filter(r => isRotinaCompletedToday(r.id, completions)).length;
          const totalCount = todayRotinas.length;

          // Get pending rotinas (not completed)
          const pendingRotinas = todayRotinas
            .filter(r => !isRotinaCompletedToday(r.id, completions))
            .map(r => ({ titulo: r.titulo, hora: r.hora }));

          message = generateRotinasGreeting(pendingRotinas, completedCount, totalCount);
          break;
        }

        case 'transporte': {
          message = 'Rotina Inteligente. Configure seu trajeto casa-trabalho e eu aviso quando for hora de sair.';
          break;
        }

        default:
          return; // Don't speak on other pages
      }

      if (message) {
        console.log(`[InovaGreeting] Speaking for ${pageType}:`, message.substring(0, 50) + '...');
        await isaSpeak(message, pageType);
        markTabGreeted(pageType);
        hasSpoken.current = true;
      }
    } catch (error) {
      console.error('[InovaGreeting] Page greeting error:', error);
    }
  };

  useEffect(() => {
    // Delay to ensure page is loaded and data is available
    console.log(`[InovaGreeting] Effect triggered for ${pageType}, waiting 500ms...`);
    const timer = setTimeout(() => {
      console.log(`[InovaGreeting] Timer fired, calling speakGreeting for ${pageType}`);
      speakGreeting();
    }, 500); // Reduced from 1500ms to 500ms for faster response

    return () => {
      clearTimeout(timer);
      console.log(`[InovaGreeting] Cleanup for ${pageType}`);
    };
  }, [pageType, userId, enabled]);

  return {
    speakGreeting,
    speakCustomMessage: async (message: string) => {
      await isaSpeak(message, pageType);
    }
  };
}
