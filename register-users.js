// Script to register new users
const registerUsers = async () => {
  try {
    console.log('Registering admin user...');
    const adminResponse = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        email: 'admin@example.com',
        password: 'Admin123!',
        firstName: 'Admin',
        lastName: 'User'
      }),
    });
    
    const adminData = await adminResponse.json();
    console.log(`Admin registration status: ${adminResponse.status}`);
    console.log('Response:', JSON.stringify(adminData, null, 2));
    
    console.log('\nRegistering regular user...');
    const userResponse = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'user',
        email: 'user@example.com',
        password: 'User123!',
        firstName: 'Regular',
        lastName: 'User'
      }),
    });
    
    const userData = await userResponse.json();
    console.log(`User registration status: ${userResponse.status}`);
    console.log('Response:', JSON.stringify(userData, null, 2));
  } catch (error) {
    console.error('Error registering users:', error);
  }
};

registerUsers();