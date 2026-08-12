const fetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const BASE_URL = 'http://localhost:5000';

// Use a sample lung sound file from our dataset for testing
const SAMPLE_AUDIO_PATH = path.join(
  'd:',
  'PDD WITH MODEL',
  'DATASETS',
  'Asthma Detection Dataset Version 2',
  'Asthma Detection Dataset Version 2',
  'asthma',
  'P2AsthmaIE_9.wav'
);

async function runAnalyzeTest() {
  console.log('🧪 Starting end-to-end Respiratory Audio Analysis Integration Test...\n');

  if (!fs.existsSync(SAMPLE_AUDIO_PATH)) {
    console.error(`❌ Sample audio file not found at: ${SAMPLE_AUDIO_PATH}`);
    console.log('Please verify the dataset path in the test script.');
    return;
  }

  console.log(`📂 Using sample audio file: ${path.basename(SAMPLE_AUDIO_PATH)}`);
  
  try {
    const form = new FormData();
    form.append('audio', fs.createReadStream(SAMPLE_AUDIO_PATH));

    console.log('📡 Dispatching request to Express backend /api/breathing/analyze...');
    const startTime = Date.now();
    const res = await fetch(`${BASE_URL}/api/breathing/analyze`, {
      method: 'POST',
      headers: form.getHeaders(),
      body: form,
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️ Response received in ${duration}s. Status code: ${res.status}`);

    if (res.ok) {
      const data = await res.json();
      console.log('✅ End-to-End Analysis Succeeded!\n');
      console.log('📋 Response Payload:');
      console.log(JSON.stringify(data, null, 2));

      // Key validations
      const requiredFields = [
        'isValidAudio',
        'wheezingDetected',
        'riskLevel',
        'summary',
        'confidence',
        'recommendedExercise',
        'recommendations',
        'rr',
        'pattern',
        'regularity'
      ];
      
      const missing = requiredFields.filter(field => !(field in data));
      if (missing.length === 0) {
        console.log('\n✨ Validation: PASSED! All expected fields are present in the response.');
      } else {
        console.warn(`\n⚠️ Validation: FAILED! Missing fields: ${missing.join(', ')}`);
      }
    } else {
      const errText = await res.text();
      console.error(`❌ Request Failed: ${res.statusText} (${res.status})`);
      console.error('Error Details:', errText);
    }
  } catch (err) {
    console.error('❌ Integration Test Exception:', err.message);
  }
}

runAnalyzeTest();
