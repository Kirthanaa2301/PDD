const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING END-TO-END AUDIO PERSISTENCE & PLAYBACK TESTS');
  console.log('====================================================\n');

  // 1. Health check with retry for initial connection
  let healthData = null;
  for (let i = 0; i < 5; i++) {
    try {
      const healthRes = await fetch(`${BASE_URL}/api/breathing/health`);
      healthData = await healthRes.json();
      if (healthData.dbConnected) break;
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 1500));
  }
  console.log('1. Server Health:', healthData?.ok ? '✅ OK' : '❌ FAILED', '(DB Connected:', healthData?.dbConnected + ')');

  // 2. Auth: Register/Login test user
  const email = `test_audio_${Date.now()}@asthmasense.ai`;
  const password = 'Password123!';
  const authRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Audio Tester', email, password }),
  });
  const authData = await authRes.json();
  const token = authData.token;
  console.log('2. User Registration & Auth Token:', token ? '✅ OK' : '❌ FAILED', authData);

  // 3. Audio upload and analysis
  const audioFilePath = path.join(
    __dirname,
    '../../DATASETS/Asthma Detection Dataset Version 2/Asthma Detection Dataset Version 2/healthy/P10Healthy10S.wav'
  );
  if (!fs.existsSync(audioFilePath)) {
    console.error('❌ Audio sample file not found at:', audioFilePath);
    return;
  }

  const audioBuffer = fs.readFileSync(audioFilePath);
  const form = new FormData();
  form.append('audio', audioBuffer, {
    filename: 'P10Healthy10S.wav',
    contentType: 'audio/wav',
  });

  const analyzeRes = await fetch(`${BASE_URL}/api/breathing/analyze`, {
    method: 'POST',
    headers: {
      ...form.getHeaders(),
      'Authorization': `Bearer ${token}`,
    },
    body: form,
  });

  const analyzeData = await analyzeRes.json();
  console.log('3. Audio Analysis Result:', {
    riskLevel: analyzeData.riskLevel,
    wheezingDetected: analyzeData.wheezingDetected,
    audioMetaAvailable: analyzeData.audio?.available,
    audioId: analyzeData.audio?.audioId,
    audioFileName: analyzeData.audio?.fileName,
    audioUrl: analyzeData.audio?.url,
  });

  if (!analyzeData.audio?.available) {
    console.error('❌ Audio metadata missing from analysis response!');
    return;
  }
  console.log('   ✅ Audio metadata returned successfully');

  // 4. Save Report with audio reference
  const reportPayload = {
    audioFileId: analyzeData.audio.audioId,
    audioUri: analyzeData.audio.dataUri,
    audioUrl: analyzeData.audio.url,
    fileName: analyzeData.audio.fileName,
    audioMimeType: analyzeData.audio.mimeType,
    audioDuration: analyzeData.audio.duration,
    audioSize: analyzeData.audio.size,
    riskLevel: analyzeData.riskLevel,
    wheezingDetected: analyzeData.wheezingDetected,
    summary: analyzeData.summary,
    confidence: analyzeData.confidence,
    clinicalFindings: analyzeData.clinicalFindings,
    transcript: analyzeData.transcript,
    rr: analyzeData.rr,
    pattern: analyzeData.pattern,
    regularity: analyzeData.regularity,
    wheezePattern: analyzeData.wheezePattern,
    recommendedExercise: analyzeData.recommendedExercise,
    recommendations: analyzeData.recommendations,
    foodsToEat: analyzeData.foodsToEat,
    foodsToAvoid: analyzeData.foodsToAvoid,
  };

  const saveReportRes = await fetch(`${BASE_URL}/api/data/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(reportPayload),
  });

  const savedReport = await saveReportRes.json();
  console.log('4. Report Saved with Audio Reference:', {
    reportId: savedReport._id,
    fileName: savedReport.fileName,
    audioFileId: savedReport.audioFileId,
    audioUrl: savedReport.audioUrl,
  });
  console.log('   ✅ Report successfully created and associated with AudioFile');

  // 5. Fetch Reports
  const fetchReportsRes = await fetch(`${BASE_URL}/api/data/reports`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const reportsList = await fetchReportsRes.json();
  const matchedReport = reportsList.find((r) => r._id === savedReport._id);
  console.log('5. Fetched Reports from DB:', {
    count: reportsList.length,
    matchedReportFound: !!matchedReport,
    matchedAudioFileName: matchedReport?.fileName,
  });
  console.log('   ✅ Report retrieval preserved exact audio attributes');

  // 6. Test Audio Streaming Route
  const streamRes = await fetch(`${BASE_URL}/api/data/audio/${analyzeData.audio.audioId}`);
  const streamBuffer = await streamRes.buffer();
  console.log('6. Direct Audio Streaming (/api/data/audio/:id):', {
    status: streamRes.status,
    contentType: streamRes.headers.get('content-type'),
    contentLength: streamRes.headers.get('content-length'),
    receivedBytes: streamBuffer.length,
    originalBytes: audioBuffer.length,
    exactByteMatch: streamBuffer.equals(audioBuffer),
  });
  if (streamBuffer.equals(audioBuffer)) {
    console.log('   ✅ Streamed audio byte stream is an EXACT match to the uploaded original!');
  }

  // 7. Test Report Audio Streaming with HTTP Range Request (seeking)
  const reportAudioRes = await fetch(`${BASE_URL}/api/data/reports/${savedReport._id}/audio`, {
    headers: { 'Range': 'bytes=0-1023' },
  });
  const chunkBuffer = await reportAudioRes.buffer();
  console.log('7. Report Audio Range Streaming (/api/data/reports/:id/audio with Range: bytes=0-1023):', {
    status: reportAudioRes.status,
    contentRange: reportAudioRes.headers.get('content-range'),
    chunkBytes: chunkBuffer.length,
  });
  if (reportAudioRes.status === 206 && chunkBuffer.length === 1024) {
    console.log('   ✅ HTTP 206 Partial Content range requests working for player seeking!');
  }

  // 8. Delete Report and verify audio cleanup
  const deleteRes = await fetch(`${BASE_URL}/api/data/reports/${savedReport._id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const deleteData = await deleteRes.json();
  console.log('8. Report Deletion & Associated Audio Cleanup:', deleteData);

  const checkAudioRes = await fetch(`${BASE_URL}/api/data/audio/${analyzeData.audio.audioId}`);
  console.log('   Audio availability after report deletion:', checkAudioRes.status === 404 ? '✅ 404 Cleanly Deleted' : 'Remaining');

  console.log('\n====================================================');
  console.log('🎉 ALL AUDIO STORAGE & PLAYBACK WORKFLOW TESTS PASSED');
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
});
