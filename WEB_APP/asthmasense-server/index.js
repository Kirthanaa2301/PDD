require('dotenv').config();
const app = require('./api/index');
const connectDB = require('./lib/db');
const { spawn } = require('child_process');
const path = require('path');

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`
======================================================
🚀 AsthmaSense AI Backend Server is Running!
📡 Listening on: http://localhost:${PORT}
------------------------------------------------------
📋 Key Endpoints:
   • Health Check : GET  http://localhost:${PORT}/api/breathing/health
   • Local AI Chat: POST http://localhost:${PORT}/api/chat
   • Chat History : GET  http://localhost:${PORT}/api/chat/history
   • Auth Login   : POST http://localhost:${PORT}/api/auth/login
   • Symptoms Log : POST http://localhost:${PORT}/api/data/symptoms
======================================================
`);

  // Connect to MongoDB immediately on startup
  try {
    const conn = await connectDB();
    if (conn) {
      console.log('✅ MongoDB status: CONNECTED to database.');
    } else {
      console.log('⚠️ MongoDB status: NOT CONNECTED (Check MONGO_URI in .env)');
    }
  } catch (err) {
    console.log('⚠️ MongoDB connection error:', err.message);
  }

  // Spawn the Python local ML prediction service
  try {
    const pythonPath = path.resolve(__dirname, '..', '..', '.venv', 'Scripts', 'python.exe');
    const scriptPath = path.resolve(__dirname, '..', '..', 'ml', 'predict_service.py');
    const projectRoot = path.resolve(__dirname, '..', '..');

    console.log(`[Python ML] Launching local ML service:`);
    console.log(`  Python: ${pythonPath}`);
    console.log(`  Script: ${scriptPath}`);

    const pythonProcess = spawn(pythonPath, [scriptPath], {
      cwd: projectRoot,
      env: { ...process.env, PYTHONPATH: projectRoot }
    });

    pythonProcess.stdout.on('data', (data) => {
      console.log(`[Python ML stdout] ${data.toString().trim()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`[Python ML stderr] ${data.toString().trim()}`);
    });

    pythonProcess.on('close', (code) => {
      console.log(`[Python ML] Service exited with code ${code}`);
    });

    // Terminate child process when Node process exits
    process.on('exit', () => {
      console.log('[Node Backend] Exiting, killing Python ML service...');
      pythonProcess.kill();
    });
    process.on('SIGINT', () => {
      pythonProcess.kill();
      process.exit();
    });
    process.on('SIGTERM', () => {
      pythonProcess.kill();
      process.exit();
    });
    
  } catch (spawnErr) {
    console.error('⚠️ [Python ML] Failed to spawn local ML service:', spawnErr.message);
  }
});

