const fetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const BASE_URL = 'http://localhost:5000';

const HEALTHY_DIR = path.join(
  'd:',
  'PDD WITH MODEL',
  'DATASETS',
  'Asthma Detection Dataset Version 2',
  'Asthma Detection Dataset Version 2',
  'Healthy'
);

async function runHealthyTest() {
  console.log('🧪 Testing Confirmed Healthy Audio through End-to-End Express API...\n');

  if (!fs.existsSync(HEALTHY_DIR)) {
    console.error(`❌ Healthy directory not found: ${HEALTHY_DIR}`);
    return;
  }

  const files = fs.readdirSync(HEALTHY_DIR).filter(f => f.endsWith('.wav')).slice(0, 10);
  console.log(`Testing ${files.length} healthy sample recordings...\n`);

  let passCount = 0;

  for (const filename of files) {
    const filePath = path.join(HEALTHY_DIR, filename);
    const form = new FormData();
    form.append('audio', fs.createReadStream(filePath));

    try {
      const res = await fetch(`${BASE_URL}/api/breathing/analyze`, {
        method: 'POST',
        headers: form.getHeaders(),
        body: form,
      });

      if (res.ok) {
        const data = await res.json();
        const isPass = data.riskLevel === 'Low' && data.wheezingDetected === 'No';
        if (isPass) passCount++;

        const statusTag = isPass ? '✅ PASS (LOW RISK)' : '❌ FAIL (HIGH RISK)';
        console.log(`[${statusTag}] ${filename} -> Risk: ${data.riskLevel} | Classification: ${data.classification} | Wheezing: ${data.wheezingDetected} | Confidence: ${data.confidence} (${data.rawConfidence})`);
      } else {
        const errText = await res.text();
        console.error(`[ERROR] ${filename} -> HTTP ${res.status}: ${errText}`);
      }
    } catch (err) {
      console.error(`[EXCEPTION] ${filename} -> ${err.message}`);
    }
  }

  console.log(`\n======================================================`);
  console.log(`🎯 HEALTHY AUDIO TEST RESULT: ${passCount}/${files.length} (${(passCount/files.length*100).toFixed(1)}%) ASSESSED AS LOW RISK`);
  console.log(`======================================================`);
}

runHealthyTest();
