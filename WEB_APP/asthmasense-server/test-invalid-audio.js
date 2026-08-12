const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Generate a simple synthetic WAV file in memory
function createWavBuffer(samples, sampleRate = 16000) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF identifier
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // 'fmt ' sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // 'data' sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write PCM audio data
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7FFF;
    buffer.writeInt16LE(Math.floor(val), 44 + i * 2);
  }

  return buffer;
}

async function testInvalidAudio() {
  console.log('🧪 Testing API Rejection on Invalid Audio Recordings (Speech, Songs, Music, Noise, Silence)...');
  const sampleRate = 16000;
  const duration = 3.0; // 3 seconds
  const totalSamples = Math.floor(sampleRate * duration);

  // 1. Silent recording
  const silenceSamples = new Float32Array(totalSamples);
  const silenceBuffer = createWavBuffer(silenceSamples, sampleRate);

  // 2. High frequency whistling tone (2000 Hz)
  const whistleSamples = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    whistleSamples[i] = 0.5 * Math.sin(2 * Math.PI * 2000 * t);
  }
  const whistleBuffer = createWavBuffer(whistleSamples, sampleRate);

  // 3. Human speech simulation (Formants + Vocal Cord F0)
  const speechSamples = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    speechSamples[i] = 0.3 * Math.sin(2 * Math.PI * 180 * t) + 
                       0.2 * Math.sin(2 * Math.PI * 360 * t) + 
                       0.25 * Math.sin(2 * Math.PI * 1200 * t);
  }
  const speechBuffer = createWavBuffer(speechSamples, sampleRate);

  // 4. Song / Music chords track simulation
  const songSamples = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    songSamples[i] = 0.3 * Math.sin(2 * Math.PI * 261.63 * t) + 
                     0.3 * Math.sin(2 * Math.PI * 329.63 * t) + 
                     0.3 * Math.sin(2 * Math.PI * 392.00 * t) + 
                     0.15 * Math.sin(2 * Math.PI * 3500 * t);
  }
  const songBuffer = createWavBuffer(songSamples, sampleRate);

  const testCases = [
    { name: 'Pure Silence (0 dB)', buffer: silenceBuffer },
    { name: 'Human Speech / Vocal Phonation', buffer: speechBuffer },
    { name: 'Song / Musical Chords', buffer: songBuffer },
    { name: 'High-Pitch Whistling (2000Hz)', buffer: whistleBuffer }
  ];

  for (const test of testCases) {
    console.log(`\n📡 Dispatching test: ${test.name}`);
    const form = new FormData();
    form.append('audio', test.buffer, {
      filename: 'invalid_test.wav',
      contentType: 'audio/wav',
    });

    try {
      const response = await fetch('http://localhost:5000/api/breathing/analyze', {
        method: 'POST',
        headers: form.getHeaders(),
        body: form,
      });

      const data = await response.json();
      console.log(`HTTP Status: ${response.status}`);
      if (response.status === 400) {
        console.log(`✅ Correctly REJECTED: "${data.error}"`);
      } else {
        console.log(`❌ Unexpected response:`, data);
      }
    } catch (e) {
      console.error(`Request failed: ${e.message}`);
    }
  }
}

testInvalidAudio();
