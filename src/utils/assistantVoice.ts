/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Universal Fitness & Human Performance Platform
 * AxioPersonalAssistant — Dedicated Voice Recognition and Speech Synthesis Engine
 */

export type AssistantVoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface AssistantSpeechRecognitionOptions {
  continuous?: boolean;
  silenceTimeoutMs?: number;
  lang?: string;
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onInterim?: (interimTranscript: string, fullTranscript: string) => void;
  onFinalUtterance?: (finalTranscript: string) => void;
  onError?: (errorMsg: string) => void;
  onEnd?: () => void;
}

export function isSpeechRecognitionSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function cleanTextForAssistantSpeech(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/^[•*\-]\s+/gm, '')
    .replace(/✦/g, '')
    .trim();
}

/**
 * Cancels any active speech synthesis across the window safely
 */
export function stopAssistantSpeech(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // Ignore cancellation failures
    }
  }
}

/**
 * Reads aloud text using SpeechSynthesis
 */
export function speakAssistantResponse(
  text: string,
  options?: {
    lang?: string;
    onStart?: () => void;
    onEnd?: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError?: (err: any) => void;
  }
): SpeechSynthesisUtterance | null {
  if (!isSpeechSynthesisSupported()) {
    return null;
  }

  try {
    stopAssistantSpeech();

    const cleaned = cleanTextForAssistantSpeech(text);
    if (!cleaned) return null;

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.rate = 1.02;
    utterance.pitch = 1.0;

    const isTelugu =
      options?.lang === 'te' ||
      options?.lang === 'te-IN' ||
      /[\u0C00-\u0C7F]/.test(cleaned);

    utterance.lang = isTelugu ? 'te-IN' : options?.lang || 'en-US';

    const voices = window.speechSynthesis.getVoices();
    let preferredVoice: SpeechSynthesisVoice | undefined;

    if (isTelugu) {
      preferredVoice =
        voices.find(
          (v) =>
            v.lang === 'te-IN' ||
            v.lang.startsWith('te') ||
            v.name.toLowerCase().includes('telugu')
        ) ||
        voices.find(
          (v) =>
            v.lang.startsWith('en-IN') ||
            v.name.toLowerCase().includes('india')
        ) ||
        voices.find((v) => v.lang.startsWith('en'));
    } else {
      preferredVoice =
        voices.find(
          (v) =>
            (v.lang.startsWith('en-US') || v.lang.startsWith('en')) &&
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Samantha') ||
              v.name.includes('Daniel') ||
              v.name.includes('Aaron'))
        ) || voices.find((v) => v.lang.startsWith('en'));
    }

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    if (options?.onStart) utterance.onstart = options.onStart;
    if (options?.onEnd) utterance.onend = options.onEnd;
    if (options?.onError) {
      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          options.onError?.(e);
        } else {
          options.onEnd?.();
        }
      };
    }

    window.speechSynthesis.speak(utterance);
    return utterance;
  } catch (err) {
    options?.onError?.(err);
    return null;
  }
}

export interface AssistantSpeechRecognitionSession {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition: any;
  stop: () => void;
  abort: () => void;
  cancel: () => void;
}

/**
 * Initializes and starts a robust SpeechRecognition session with automatic utterance completion detection.
 */
export function startAssistantSpeechRecognition(
  options: AssistantSpeechRecognitionOptions
): AssistantSpeechRecognitionSession | null {
  if (!isSpeechRecognitionSupported()) {
    options.onError?.(
      'Speech recognition is not supported in this browser. You can type commands to AXI below.'
    );
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  try {
    const recognition = new SpeechRecognitionClass();
    recognition.lang = options.lang || 'en-US';
    // Use continuous listening by default so pauses between words don't terminate prematurely
    recognition.continuous = options.continuous !== false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let silenceTimer: ReturnType<typeof setTimeout> | null = null;
    let accumulatedFinalTranscript = '';
    let currentInterimTranscript = '';
    let hasEmittedFinal = false;
    let isCancelled = false;
    let isStoppedManually = false;

    const clearSilenceTimer = () => {
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
    };

    const emitFinalUtterance = (transcript: string) => {
      if (hasEmittedFinal || isCancelled) return;
      const cleaned = transcript.trim();
      if (!cleaned) return;

      hasEmittedFinal = true;
      clearSilenceTimer();

      if (options.onFinalUtterance) {
        options.onFinalUtterance(cleaned);
      } else if (options.onResult) {
        options.onResult(cleaned, true);
      }
    };

    recognition.onstart = () => {
      hasEmittedFinal = false;
      isCancelled = false;
      isStoppedManually = false;
      accumulatedFinalTranscript = '';
      currentInterimTranscript = '';
      options.onStart?.();
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      if (hasEmittedFinal || isCancelled) return;
      clearSilenceTimer();

      let newlyFinalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        const piece = item[0]?.transcript || '';
        if (item.isFinal) {
          newlyFinalText += piece;
        } else {
          interimText += piece;
        }
      }

      if (newlyFinalText) {
        accumulatedFinalTranscript = (accumulatedFinalTranscript + ' ' + newlyFinalText).trim();
      }
      currentInterimTranscript = interimText;

      const liveFullTranscript = (accumulatedFinalTranscript + ' ' + currentInterimTranscript).trim();

      // Report progress to caller
      if (liveFullTranscript) {
        if (options.onInterim) {
          options.onInterim(currentInterimTranscript, liveFullTranscript);
        }
        if (options.onResult) {
          options.onResult(liveFullTranscript, false);
        }
      }

      // If we have accumulated speech (either final segments or active speech), start silence countdown
      // Default fallback silence timeout is 1500ms (configurable)
      const silenceLimit = options.silenceTimeoutMs ?? 1500;
      if (accumulatedFinalTranscript.trim() || currentInterimTranscript.trim()) {
        silenceTimer = setTimeout(() => {
          if (!hasEmittedFinal && !isCancelled) {
            const fullUtterance = (accumulatedFinalTranscript + ' ' + currentInterimTranscript).trim();
            if (fullUtterance) {
              emitFinalUtterance(fullUtterance);
              try {
                recognition.stop();
              } catch {
                // ignore
              }
            }
          }
        }, silenceLimit);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      clearSilenceTimer();

      // Don't report abort as an error if intentionally cancelled or stopped
      if (event.error === 'aborted' && (isCancelled || isStoppedManually)) {
        return;
      }

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        options.onError?.(
          'Microphone permission denied. Please allow microphone access in your browser settings so AXI can hear your commands.'
        );
      } else if (event.error === 'no-speech') {
        options.onError?.('AXI detected no speech. Please tap the mic and try speaking again.');
      } else if (event.error === 'audio-capture') {
        options.onError?.('AXI could not detect microphone hardware on this device.');
      } else if (event.error === 'network') {
        options.onError?.('AXI encountered a speech recognition network error. Please check your connection.');
      } else {
        options.onError?.(`AXI speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      clearSilenceTimer();

      // If speech finished naturally and we haven't emitted final yet, emit what was spoken
      const combined = (accumulatedFinalTranscript + ' ' + currentInterimTranscript).trim();
      if (!hasEmittedFinal && !isCancelled && combined) {
        emitFinalUtterance(combined);
      }

      options.onEnd?.();
    };

    recognition.start();

    return {
      recognition,
      stop: () => {
        isStoppedManually = true;
        clearSilenceTimer();
        const combined = (accumulatedFinalTranscript + ' ' + currentInterimTranscript).trim();
        if (!hasEmittedFinal && !isCancelled && combined) {
          emitFinalUtterance(combined);
        }
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      },
      abort: () => {
        isCancelled = true;
        clearSilenceTimer();
        try {
          recognition.abort();
        } catch {
          // ignore
        }
      },
      cancel: () => {
        isCancelled = true;
        clearSilenceTimer();
        try {
          recognition.abort();
        } catch {
          // ignore
        }
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Access error';
    options.onError?.(`Could not initialize microphone: ${message}`);
    return null;
  }
}
