import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/api';

export const useRouletteTimer = (initialTimer: string | null | undefined) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [canClaim, setCanClaim] = useState(false);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (!initialTimer) {
        setCanClaim(true);
        return;
    }

    const calculateTimeRemaining = () => {
      const timerDate = new Date(initialTimer);
      const now = new Date();
      const diff = timerDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining(0);
        setCanClaim(true);
        return 0;
      }

      setTimeRemaining(Math.floor(diff / 1000));
      setCanClaim(false);
      return diff;
    };

    calculateTimeRemaining();

    intervalRef.current = setInterval(() => {
      const remaining = calculateTimeRemaining();
      if (remaining <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [initialTimer]);

  const formatTime = () => {
    if (timeRemaining <= 0) return '00:00:00';
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const claimSpin = async (onSuccess?: () => void) => {
    try {
      const { data, error } = await supabase.rpc('check_and_add_timer_spin');
      if (error) throw error;
      if (data?.spin_added) {
        setCanClaim(false);
        // Chama callback para atualizar UI sem reload
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Erro ao reclamar giro:', error);
    }
  };

  return { timeRemaining, canClaim, formatTime: formatTime(), claimSpin };
};