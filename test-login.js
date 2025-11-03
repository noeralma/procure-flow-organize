// Simple login test script
const testLogin = async () => {
  try {
    console.log('Testing admin login...');
    const adminResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: 'admin@example.com',
        password: 'Admin123!'
      }),
    });
    
    const adminData = await adminResponse.json();
    console.log(`Admin login status: ${adminResponse.status}`);
    console.log('Response:', JSON.stringify(adminData, null, 2));
    
    console.log('\nTesting user login...');
    const userResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: 'user@example.com',
        password: 'User123!'
      }),
    });
    
    const userData = await userResponse.json();
    console.log(`User login status: ${userResponse.status}`);
    console.log('Response:', JSON.stringify(userData, null, 2));
  } catch (error) {
    console.error('Error testing login:', error);
  }
};

testLogin();