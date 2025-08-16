
'use client';

import { useSession } from 'next-auth/react';
import { signIn, signOut } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestAuthPage() {
  const { data: session, status } = useSession();
  const [credentials, setCredentials] = useState({
    username: 'admin',
    password: 'MusicU2025'
  });
  const [testResult, setTestResult] = useState('');

  const handleTestLogin = async () => {
    setTestResult('Testing login...');
    
    try {
      const result = await signIn('credentials', {
        username: credentials.username,
        password: credentials.password,
        redirect: false
      });
      
      setTestResult(`Result: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setTestResult(`Error: ${error}`);
    }
  };

  const handleTestBackendAPI = async () => {
    setTestResult('Testing backend API...');
    
    try {
      const response = await fetch('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: credentials.username,
          password: credentials.password
        })
      });
      
      const data = await response.json();
      setTestResult(`Backend response: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setTestResult(`Backend error: ${error}`);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Debug Page</CardTitle>
            <CardDescription>Test authentication functionality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Session Status</h3>
              <p>Status: {status}</p>
              <pre className="bg-gray-100 p-2 text-sm rounded">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Test Credentials</h3>
              <Input
                placeholder="Username"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              />
              <Input
                type="password"
                placeholder="Password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Button onClick={handleTestLogin} className="w-full">
                Test NextAuth Login
              </Button>
              <Button onClick={handleTestBackendAPI} variant="outline" className="w-full">
                Test Backend API
              </Button>
              <Button onClick={() => signOut()} variant="destructive" className="w-full">
                Sign Out
              </Button>
            </div>

            {testResult && (
              <div>
                <h3 className="text-lg font-semibold">Test Result</h3>
                <pre className="bg-gray-100 p-2 text-sm rounded max-h-64 overflow-auto">
                  {testResult}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
