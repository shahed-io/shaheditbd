import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const NOTIFICATION_SOUND_URL = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgiKu0pHdMOkiHqbOwi1Y5QYWnr7KLVDdDh6ixsItVOUGEpq2wiVU6RIenrbGJVDdDiKixsYtVOUGEpq2wiVU6RIenrbGJVDdDiKixsYtVOUGDpa2wiVU5RIanrbGJVTdDiKexsYtWOUGEpq2wiVU6RIenrbGJVDdDiKixsYtVOUGDpa2wiVU5RIanrbGJVDhDiKexsYtVOkGEpq2wiVU5RIenrbGJVTdDiKixsYtVOUGDpa2wiVU5RIanrbGJVDhDh6exsYtVOkGEpq2wiVU5RIenrbGJVTdDiKixsYtVOUGDpa2wiVU5RIanrrKJVDhDh6ixsYtVOkGEpq2wiVU6Q4enrbKJVDhDh6ixsYtWOUGDpq2wiVU5RIenrrGJVDdDh6ixsYtVOkGEpq2wiVU5RIinrrKJVDhDh6ixsotVOkGDpq6wiVU5RIenrbKJVDdDh6ixsYtVOkKEpq2wiVU5RIinrrGJVDhDh6ixsYtWOUKDpq2wiVU5Q4inrrKJVDhDh6ixsYtWOkKDpq2wiVU5RIinrrKJVDhDiKixsYtWOkKDpq6wiVU5RIinrrKJVDhDiKmxsotWOkKDpq6wiVY5RIinrrKJVThDiKmxsotWOkKEpq6wiVU5RIinrrKJVThDiKmxsotWOkKEp66xiVU5RIinrrKJVThDiKmxsotWOkKEp66xiVU5RIinrrKJVTlDiKmxsotXOkKEp66xiVY5RYinrrKKVTlDiKmxsotXOkKEp66xiVY6RYinr7KKVTlDiamxs4tXO0KEp6+xiVY6RYmor7KKVjlEiamys4tXO0OFp6+yiVY6Romor7OKVjpEiamys4xXO0OFqK+yilY6Romps7OKVzpEiqmys4xYO0OFqK+zilc6R4mps7OLVztEiqmys4xYPEOGqK+zilc7R4mps7OLVztEi6mzs4xYPEOGqbCzilc7R4qps7OLWDtFi6mzs4xZPEOGqbCzilc7R4qps7SLWDtFi6mztI1ZPEOHqbCzi1g7R4qqtLSLWDxFi6q0tI1ZPESHqrC0i1g8R4qqtLWMWTxFjKq0tI1aPUSHq7G0jFk8R4qqtbWMWj1FjKu1tY1aPUWIq7G1jFo9SIurtbWNWj1GjKu1tY5bPkWIrLK1jVo+SYurtbaPWz5GjKy1to5bPkaJrLK2jls+SYustraPXD5HjKy2to9cP0eJrbO2j1w+SoustrePXD9HjK22to9dP0iKrbO3j109SouttriPXT9Ija22t5BdQEiKrrS3kF0/Soyu';

export const useAdminOrderNotification = (enabled: boolean = true) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastOrderIdRef = useRef<string | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      // Create a simple beep using Web Audio API
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Play 3 beeps
      const playBeep = (startTime: number, frequency: number) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime + startTime);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime + startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + startTime + 0.3);
        oscillator.start(audioCtx.currentTime + startTime);
        oscillator.stop(audioCtx.currentTime + startTime + 0.3);
      };

      playBeep(0, 880);    // A5
      playBeep(0.35, 1100); // C#6
      playBeep(0.7, 1320);  // E6
    } catch (e) {
      console.warn('Could not play notification sound:', e);
    }
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('admin-new-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const newOrder = payload.new as any;
          if (lastOrderIdRef.current === newOrder.id) return;
          lastOrderIdRef.current = newOrder.id;

          // Play sound
          playNotificationSound();

          // Show toast notification
          toast.success(`🔔 নতুন অর্ডার এসেছে!`, {
            description: `#${newOrder.order_number} — ${newOrder.customer_name} — ৳${newOrder.total}`,
            duration: 10000,
            action: {
              label: 'দেখুন',
              onClick: () => {
                window.location.href = '/ceo/orders';
              },
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playNotificationSound]);
};
