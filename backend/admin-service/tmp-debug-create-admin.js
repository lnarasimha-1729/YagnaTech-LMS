import fetch from 'node-fetch';
import FormData from 'form-data';

const main = async () => {
  try {
    const loginResp = await fetch('http://localhost:4000/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'college-admin@gmail.com', password: 'college123' }),
    });
    const loginData = await loginResp.json();
    console.log('login status', loginResp.status, loginData);
    if (!loginResp.ok) return;

    const token = loginData.token;
    const fd = new FormData();
    fd.append('name', 'Test Admin');
    fd.append('email', 'test-admin-123@example.com');
    fd.append('password', 'password123');
    fd.append('college_id', 'COLLEGE001');

    const createResp = await fetch('http://localhost:4000/api/admin/admins', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const createText = await createResp.text();
    console.log('create status', createResp.status, createText);
  } catch (err) {
    console.error('error', err);
  }
};

main();
