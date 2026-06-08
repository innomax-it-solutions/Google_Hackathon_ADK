/**
 * pcm-recorder.worklet.js — AudioWorklet that turns mic audio into the format
 * Google Cloud STT streaming wants: 16 kHz, mono, signed 16-bit little-endian PCM.
 *
 * The AudioContext usually runs at 44.1/48 kHz, so we resample to 16 kHz with
 * linear interpolation (carrying the fractional read position across process()
 * blocks), convert Float32 [-1,1] → Int16, and buffer ~100 ms before posting an
 * ArrayBuffer to the main thread — which forwards it over the WebSocket. Posting
 * per 128-sample block would flood the socket with tiny frames.
 *
 * Loaded via audioContext.audioWorklet.addModule("/pcm-recorder.worklet.js").
 */

class PCMRecorder extends AudioWorkletProcessor {
  constructor() {
    super();
    this._carry = 0;        // fractional read position carried between blocks
    this._buf = [];         // accumulated Int16 samples awaiting a flush
    this._flushAt = 1600;   // ~100 ms at 16 kHz
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true; // no mic frame this block
    const ch = input[0];                  // mono Float32 frame
    const ratio = sampleRate / 16000;     // sampleRate = context rate (worklet global)

    let pos = this._carry;
    while (pos < ch.length) {
      const i = Math.floor(pos);
      const frac = pos - i;
      const a = ch[i];
      const b = i + 1 < ch.length ? ch[i + 1] : ch[i];
      let s = a + (b - a) * frac;         // linear interpolation
      s = s < -1 ? -1 : s > 1 ? 1 : s;    // clamp
      this._buf.push(s < 0 ? s * 0x8000 : s * 0x7fff);
      pos += ratio;
    }
    this._carry = pos - ch.length;        // leftover offset for the next block

    if (this._buf.length >= this._flushAt) {
      const out = Int16Array.from(this._buf);
      this._buf.length = 0;
      this.port.postMessage(out.buffer, [out.buffer]); // transfer, no copy
    }
    return true;
  }
}

registerProcessor("pcm-recorder", PCMRecorder);
