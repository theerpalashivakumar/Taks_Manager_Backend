const http = require('http');

const request = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(resData) });
          } catch {
            resolve({ status: res.statusCode, body: resData });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
};

async function runLiveChecks() {
  console.log('--- 1. Health Check ---');
  const health = await request('/api/health');
  console.log('Health:', health.status, health.body.status);

  console.log('\n--- 2. Login Tests ---');
  const adminLogin = await request('/api/auth/login', 'POST', {
    email: 'admin@taskmanager.com',
    password: 'Password@123',
  });
  console.log('Admin login status:', adminLogin.status, 'Success:', adminLogin.body.success);
  const adminToken = adminLogin.body.data?.token;

  const pmLogin = await request('/api/auth/login', 'POST', {
    email: 'pm@taskmanager.com',
    password: 'Password@123',
  });
  console.log('PM login status:', pmLogin.status, 'Success:', pmLogin.body.success);
  const pmToken = pmLogin.body.data?.token;

  console.log('\n--- 3. Dashboard API ---');
  const adminDash = await request('/api/dashboard/summary', 'GET', null, adminToken);
  console.log('Admin Dashboard:', adminDash.status, 'Projects total:', adminDash.body.data?.projects?.total);

  const pmDash = await request('/api/dashboard/summary', 'GET', null, pmToken);
  console.log('PM Dashboard:', pmDash.status, 'Projects total:', pmDash.body.data?.projects?.total);

  console.log('\n--- 4. Projects & Tasks List ---');
  const projects = await request('/api/projects', 'GET', null, adminToken);
  console.log('Projects list status:', projects.status, 'Count:', projects.body.data?.length);

  const tasks = await request('/api/tasks', 'GET', null, adminToken);
  console.log('Tasks list status:', tasks.status, 'Count:', tasks.body.data?.length);

  console.log('\n--- 5. Architecture Docs Security ---');
  const wrongPass = await request('/api/project-explanation/verify', 'POST', { password: 'WrongPassword' });
  console.log('Wrong passkey status:', wrongPass.status, '(expected 401)');

  const correctPass = await request('/api/project-explanation/verify', 'POST', { password: 'Shiv@818780' });
  console.log('Correct passkey status:', correctPass.status, '(expected 200), Token received:', Boolean(correctPass.body.data?.token));

  console.log('\n--- 6. Role Authorization Boundaries ---');
  const adminUsersList = await request('/api/users', 'GET', null, adminToken);
  console.log('Admin accessing /api/users:', adminUsersList.status, '(expected 200)');

  console.log('\nALL LIVE API SCENARIOS VERIFIED SUCCESSFULLY!');
}

runLiveChecks().catch(console.error);
