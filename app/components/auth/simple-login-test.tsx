
'use client';

import { useState } from 'react';
import { signIn, getCsrfToken } from 'next-auth/react';

export default function SimpleLoginTest() {
  const [credentials, setCredentials] = useState({
    username: 'admin',
    password: 'MusicU2025',
  });
  const [result, setResult] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult('Attempting login...');
    
    try {
      const csrfToken = await getCsrfToken();
      console.log('CSRF Token:', csrfToken);
      
      const result = await signIn('credentials', {
        username: credentials.username,
        password: credentials.password,
        redirect: false,
      });
      
      console.log('SignIn result:', result);
      setResult(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Login error:', error);
      setResult(`Error: ${error}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Simple Login Test</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input 
            type="text" 
            value={credentials.username}
            onChange={(e) => setCredentials({...credentials, username: e.target.value})}
          />
        </div>
        <div>
          <label>Password:</label>
          <input 
            type="password" 
            value={credentials.password}
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
          />
        </div>
        <button type="submit">Test Login</button>
      </form>
      <div>
        <h3>Result:</h3>
        <pre>{result}</pre>
      </div>
    </div>
  );
}
