// Simple API connection test
export const testApiConnection = async () => {
  try {
    console.log('Testing API connection to http://localhost:5000/api');
    
    // Test basic connectivity
    const response = await fetch('http://localhost:5000/api/auth/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('API Response Status:', response.status);
    console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.status === 401) {
      console.log('✅ API is running and responding (401 is expected without auth token)');
      return true;
    } else if (response.ok) {
      console.log('✅ API is running and responding');
      return true;
    } else {
      console.log('❌ API responded with unexpected status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ API connection failed:', error);
    return false;
  }
};

// Test login endpoint specifically
export const testLoginEndpoint = async () => {
  try {
    console.log('Testing login endpoint...');
    
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword'
      }),
    });
    
    console.log('Login endpoint response status:', response.status);
    const responseData = await response.text();
    console.log('Login endpoint response:', responseData);
    
    return response.status !== 404; // 404 means endpoint doesn't exist
  } catch (error) {
    console.error('Login endpoint test failed:', error);
    return false;
  }
};
