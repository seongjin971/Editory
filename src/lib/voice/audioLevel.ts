export function measureRmsFromAnalyser(analyser: AnalyserNode) {
  const samples = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(samples);

  let sumSquares = 0;

  for (const sample of samples) {
    const normalized = (sample - 128) / 128;
    sumSquares += normalized * normalized;
  }

  const rms = Math.sqrt(sumSquares / samples.length);

  // Slightly compress the dynamic range so normal speech sits in the middle band.
  return Math.min(1, Math.pow(rms * 3.8, 0.82));
}

export function smoothLevel(
  current: number,
  target: number,
  attack = 0.55,
  decay = 0.16,
) {
  const factor = target >= current ? attack : decay;
  const next = current + (target - current) * factor;

  if (Math.abs(target - next) < 0.002) {
    return target;
  }

  return next;
}

export function decayLevelTarget(target: number, factor = 0.93, floor = 0) {
  return Math.max(floor, target * factor - 0.0025);
}
