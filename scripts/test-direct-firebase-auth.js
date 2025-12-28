// Direct Firebase Auth REST API test
const https = require('https');

async function testAuth() {
  const email = 'denemeberber@gmail.com';
  const password = 'Test12345!';
  const apiKey = 'AIzaSyDvHXqfYhep4VnaoitI-I72mjG8iuhusi0';
  
  console.log('🔐 Testing Firebase Auth REST API');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('');
  
  const requestData = JSON.stringify({
    email: email,
    password: password,
    returnSecureToken: true
  });
  
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'identitytoolkit.googleapis.com',
      path: `/v1/accounts:signInWithPassword?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': requestData.length
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('📡 Response Status:', res.statusCode);
        console.log('📡 Response Body:', data);
        console.log('');
        
        if (res.statusCode === 200) {
          const parsed = JSON.parse(data);
          console.log('✅ AUTH SUCCESSFUL!');
          console.log('   User ID:', parsed.localId);
          console.log('   Email:', parsed.email);
          console.log('   ID Token (first 50 chars):', parsed.idToken.substring(0, 50));
        } else {
          const error = JSON.parse(data);
          console.log('❌ AUTH FAILED!');
          console.log('   Error code:', error.error?.code);
          console.log('   Error message:', error.error?.message);
        }
        
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.error('❌ Request error:', err);
      reject(err);
    });
    
    req.write(requestData);
    req.end();
  });
}

testAuth().then(() => process.exit(0));
