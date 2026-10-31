import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpeechChimeService {
  readonly isVoiceEnabled = signal<boolean>(true);

  /**
   * Synthesizes a clean medical lounge chime using the Web Audio API
   */
  playChime(): Promise<void> {
    return new Promise(resolve => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }

        const now = audioCtx.currentTime;

        // Tone 1: High crisp bell (D5: ~587 Hz)
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now);
        gain1.gain.setValueAtTime(0.25, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.5);

        // Tone 2: Harmonious chime (A5: ~880 Hz)
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.15);
        gain2.gain.setValueAtTime(0.2, now + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.8);

        setTimeout(() => resolve(), 700);
      } catch (e) {
        resolve();
      }
    });
  }

  /**
   * Announces a patient ticket in Arabic via SpeechSynthesis
   */
  async announcePatient(ticketNumber: string, patientName: string, roomNumber: string, departmentAr?: string): Promise<void> {
    await this.playChime();

    if (!this.isVoiceEnabled()) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech

      // Clean spoken ticket e.g. CARD-101 -> كارد مائة وواحد
      const spokenText = `تذكرة رقم ${ticketNumber}. المريض ${patientName}. يرجى التوجه إلى عيادة ${departmentAr || ''}، غرفة رقم ${roomNumber}.`;

      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.9; // Slightly slower for formal clinical clarity
      utterance.pitch = 1.0;

      // Select Arabic voice if available
      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
      if (arabicVoice) {
        utterance.voice = arabicVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[SpeechChimeService] Voice announcement failed:', e);
    }
  }

  toggleVoice(): void {
    this.isVoiceEnabled.update(v => !v);
  }
}
