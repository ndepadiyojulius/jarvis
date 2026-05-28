let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Creates and plays a synthetic audio tone using Web Audio API
 */
export function playSyntheticAlert(type: "beep" | "chirp" | "radar" | "voice_only") {
  const ctx = getAudioContext();
  if (!ctx || type === "voice_only") return;

  // Ensure AudioContext is running (might be suspended by browser autoplay policy until user interaction)
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const startTime = ctx.currentTime;

  if (type === "beep") {
    // Cybernetic alarm chime (high double beep)
    const playBeep = (timeOffset: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, startTime + timeOffset); // A5 note
      
      gain.gain.setValueAtTime(0.12, startTime + timeOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + timeOffset + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime + timeOffset);
      osc.stop(startTime + timeOffset + 0.16);
    };

    playBeep(0);
    playBeep(0.2);

  } else if (type === "chirp") {
    // Technical upward chirp
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(200, startTime);
    osc.frequency.exponentialRampToValueAtTime(2400, startTime + 0.25);

    gain.gain.setValueAtTime(0.1, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.26);

  } else if (type === "radar") {
    // Sonar/radar style deep ping with eco
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(440, startTime);
    osc.frequency.setValueAtTime(330, startTime + 0.08);

    gain.gain.setValueAtTime(0.15, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);

    // Subtle bandpass filter to give "sonar" hollow depth
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 5;
    filter.frequency.setValueAtTime(1000, startTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 1.2);
  }
}

/**
 * Executes a text-to-speech notification using SpeechSynthesis
 */
export function speakAlertText(phrase: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve(false);
      return;
    }

    // Cancel active speech to avoid buffering multiple rapid alerts
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(phrase);
    
    // Choose professional/robotic/British voice if available to emulate JARVIS
    const voices = window.speechSynthesis.getVoices();
    let preferredVoice = voices.find(
      (v) =>
        v.name.includes("Google UK English Male") ||
        v.name.includes("Microsoft David") ||
        v.name.includes("Daniel") ||
        v.lang === "en-GB" ||
        v.name.includes("Male")
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    // Adjust speech configurations for elegant, polite pace
    utterance.rate = 1.05; // Slightly faster but crisp
    utterance.pitch = 0.95; // Slightly deeper, modern sound
    utterance.volume = 1.0;

    utterance.onend = () => resolve(true);
    utterance.onerror = () => resolve(false);

    window.speechSynthesis.speak(utterance);
  });
}
