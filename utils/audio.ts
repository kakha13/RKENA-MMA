let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

let noiseBuffer: AudioBuffer | null = null;

const createNoiseBuffer = (ctx: AudioContext) => {
  if (noiseBuffer) return noiseBuffer;
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return buffer;
};

export const playHitSound = (isMuted: boolean = false, heavy: boolean = false) => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const buffer = createNoiseBuffer(ctx);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = heavy ? 800 : 1000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(heavy ? 0.8 : 0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (heavy ? 0.2 : 0.1));
    noise.connect(noiseFilter);
    noiseFilter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.2);
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(heavy ? 150 : 200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.3, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) { console.warn('Audio error', e); }
};

export const playBlockSound = (isMuted: boolean = false) => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const buffer = createNoiseBuffer(ctx);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 400;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    noise.connect(noiseFilter);
    noiseFilter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.1);
  } catch (e) {}
};

export const playWhooshSound = (isMuted: boolean = false) => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const buffer = createNoiseBuffer(ctx);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(600, ctx.currentTime);
    noiseFilter.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.1);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    noise.connect(noiseFilter);
    noiseFilter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.15);
  } catch (e) {}
};

export const playTakedownSound = (isMuted: boolean = false) => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.3);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {}
};

export const playSlamSound = (isMuted: boolean = false) => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const buffer = createNoiseBuffer(ctx);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 300;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.8, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    noise.connect(noiseFilter);
    noiseFilter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.5);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.4);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.5, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {}
};

export const playKOSound = (isMuted: boolean = false) => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(20, ctx.currentTime + 1.5);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 1.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
    playSlamSound(isMuted);
  } catch (e) {}
};

export const playSpecialSound = (isMuted: boolean = false) => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    // Rising power tone
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(60, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);
    osc1.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.4);
    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.6, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    const filter1 = ctx.createBiquadFilter();
    filter1.type = 'lowpass';
    filter1.frequency.value = 1200;
    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.5);

    // Impact noise
    const buffer = createNoiseBuffer(ctx);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 500;
    const gainN = ctx.createGain();
    gainN.gain.setValueAtTime(0, ctx.currentTime);
    gainN.gain.setValueAtTime(1.0, ctx.currentTime + 0.15);
    gainN.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    noise.connect(noiseFilter);
    noiseFilter.connect(gainN);
    gainN.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.6);
  } catch (e) {}
};

export const playRoundBellSound = (isMuted: boolean = false) => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    // Bell tone - multiple harmonics
    const freqs = [440, 880, 1320, 1760];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3 / (i + 1), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 2.0);
    });
  } catch (e) {}
};

export const playVictorySound = (isMuted: boolean = false) => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    // Triumphant ascending notes
    const melody = [
      { freq: 523, time: 0 },
      { freq: 659, time: 0.15 },
      { freq: 784, time: 0.3 },
      { freq: 1047, time: 0.5 },
      { freq: 784, time: 0.75 },
      { freq: 1047, time: 0.9 }
    ];
    melody.forEach(({ freq, time }) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime + time);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + 0.15);
    });
  } catch (e) {}
};

export const playCrowdCheer = (isMuted: boolean = false) => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const buffer = createNoiseBuffer(ctx);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.2);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 1.6);
  } catch (e) {}
};

export const playParrySound = (isMuted: boolean = false) => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    // Sharp metallic "ting" - high sine harmonics with fast decay
    const freqs = [1200, 1800, 2400];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25 / (i + 1), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    });
    // Short click for punch contact
    const buffer = createNoiseBuffer(ctx);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    const gainN = ctx.createGain();
    gainN.gain.setValueAtTime(0.3, ctx.currentTime);
    gainN.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    noise.connect(filter);
    filter.connect(gainN);
    gainN.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.08);
  } catch (e) {}
};

export const playDodgeSound = (isMuted: boolean = false) => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    // Quick airy swish, higher pitched than an attack whoosh
    const buffer = createNoiseBuffer(ctx);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
    filter.Q.value = 1.2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.2);
  } catch (e) {}
};

export const playDizzySound = (isMuted: boolean = false) => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    // Wobbly descending tone - the "rocked" wail
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(700, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(250, ctx.currentTime + 0.8);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 9;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 40;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    lfo.start();
    osc.start();
    osc.stop(ctx.currentTime + 0.85);
    lfo.stop(ctx.currentTime + 0.85);
  } catch (e) {}
};

export const playComboSound = (isMuted: boolean = false, count: number = 2) => {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const baseFreq = 220 + count * 60;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.05);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {}
};
