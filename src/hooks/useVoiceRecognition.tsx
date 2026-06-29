// Web Speech API hook — browser-native voice recognition (Bengali/English).
import { useEffect, useRef, useState } from 'react';

interface Options {
  lang?: string; // 'bn-BD' | 'en-US'
  continuous?: boolean;
  interim?: boolean;
}

export function useVoiceRecognition({ lang = 'bn-BD', continuous = true, interim = true }: Options = {}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<any>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  const start = () => {
    setError(null);
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError('আপনার browser-এ voice input সাপোর্ট নেই (Chrome/Edge ব্যবহার করুন)।'); return; }
    try {
      const rec = new SR();
      rec.lang = lang;
      rec.continuous = continuous;
      rec.interimResults = interim;
      rec.onresult = (event: any) => {
        let finalT = '';
        let interimT = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const r = event.results[i];
          if (r.isFinal) finalT += r[0].transcript;
          else interimT += r[0].transcript;
        }
        if (finalT) setTranscript((prev) => (prev ? prev + ' ' : '') + finalT.trim());
        setInterimText(interimT);
      };
      rec.onerror = (e: any) => {
        setError(e?.error === 'not-allowed' ? 'Microphone permission denied।' : `Voice error: ${e?.error || 'unknown'}`);
        setListening(false);
      };
      rec.onend = () => { setListening(false); setInterimText(''); };
      rec.start();
      recRef.current = rec;
      setListening(true);
    } catch (e: any) {
      setError(e?.message || 'Voice recognition শুরু করা যায়নি।');
    }
  };

  const stop = () => {
    try { recRef.current?.stop(); } catch {}
    setListening(false);
  };

  const reset = () => { setTranscript(''); setInterimText(''); };

  return { supported, listening, transcript, interimText, error, start, stop, reset, setTranscript };
}
