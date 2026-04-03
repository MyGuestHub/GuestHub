"use client";

let lastPlayedAt = 0;

export function playNotificationSound(minGapMs = 900) {
  if (typeof window === "undefined") return;

  const nowMs = Date.now();
  if (nowMs - lastPlayedAt < minGapMs) return;

  const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(740, now);
    osc1.frequency.exponentialRampToValueAtTime(980, now + 0.12);
    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.exponentialRampToValueAtTime(0.09, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.22);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1100, now + 0.09);
    gain2.gain.setValueAtTime(0.0001, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.06, now + 0.11);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.3);

    lastPlayedAt = nowMs;
    setTimeout(() => {
      void ctx.close();
    }, 500);
  } catch {
    // Ignore audio errors silently (browser policy/device limitations)
  }
}
