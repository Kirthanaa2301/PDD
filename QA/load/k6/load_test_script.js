import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 10 },  // Ramp-up to 10 virtual users
    { duration: '20s', target: 10 },  // Stay at 10 VUs
    { duration: '10s', target: 0 },   // Ramp-down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'], // 95% of requests must complete under 1.5s
    http_req_failed: ['rate<0.01'],    // Error rate must be less than 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  // Scenario 1: Health endpoint check
  let resHealth = http.get(`${BASE_URL}/api/health`);
  check(resHealth, {
    'health check status is 200': (r) => r.status === 200,
    'health check is ok': (r) => r.json().ok === true,
  });
  sleep(1);

  // Scenario 2: Try login with test account
  const loginPayload = JSON.stringify({
    email: 'qa_load_tester@asthmasense.ai',
    password: 'Password123!',
  });
  const headers = { 'Content-Type': 'application/json' };
  
  let resLogin = http.post(`${BASE_URL}/api/auth/login`, loginPayload, { headers });
  check(resLogin, {
    'login status is 200 or 400': (r) => r.status === 200 || r.status === 400,
  });
  sleep(1);
}
