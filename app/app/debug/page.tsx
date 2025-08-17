
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { apiService } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DebugPage() {
  const { data: session, status } = useSession();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testForm, setTestForm] = useState({
    username: 'debug_frontend_test',
    email: 'frontend_test@test.com', 
    password: 'testpass123',
    first_name: 'Frontend',
    last_name: 'Test',
    phone: '555-9999',
    role: 'student' as 'student' | 'instructor'
  });

  useEffect(() => {
    if (session) {
      setDebugInfo({
        sessionStatus: status,
        sessionUser: session.user,
        backendToken: (session.user as any)?.backendToken
      });
    }
  }, [session, status]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testBackendConnection = async () => {
    addTestResult('Testing backend connection...');
    try {
      const response = await fetch('http://localhost:8080/health');
      const data = await response.json();
      addTestResult(`✅ Backend healthy: ${data.status}`);
    } catch (error) {
      addTestResult(`❌ Backend connection failed: ${error}`);
    }
  };

  const testAuthenticatedRequest = async () => {
    addTestResult('Testing authenticated request...');
    try {
      const users = await apiService.getAllUsers();
      addTestResult(`✅ Got ${users.length} users from API`);
    } catch (error: any) {
      addTestResult(`❌ Authenticated request failed: ${error.message}`);
    }
  };

  const testUserCreation = async () => {
    addTestResult('Testing user creation...');
    try {
      const newUser = await apiService.createUser(testForm);
      addTestResult(`✅ User created: ${newUser.username} (ID: ${newUser.id})`);
    } catch (error: any) {
      addTestResult(`❌ User creation failed: ${error.message}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  if (status === 'loading') {
    return <div className="p-4">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Debug Page - Not Authenticated</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please login first to access debug features.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Frontend Debug Page</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Session Info:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={testBackendConnection}>
                Test Backend Connection
              </Button>
              <Button onClick={testAuthenticatedRequest}>
                Test Auth Request
              </Button>
              <Button onClick={testUserCreation}>
                Test User Creation
              </Button>
              <Button onClick={clearResults} variant="outline">
                Clear Results
              </Button>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Test User Form:</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Username</Label>
                  <Input 
                    value={testForm.username}
                    onChange={(e) => setTestForm({...testForm, username: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input 
                    value={testForm.email}
                    onChange={(e) => setTestForm({...testForm, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label>First Name</Label>
                  <Input 
                    value={testForm.first_name}
                    onChange={(e) => setTestForm({...testForm, first_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input 
                    value={testForm.last_name}
                    onChange={(e) => setTestForm({...testForm, last_name: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <div className="bg-black text-green-400 p-3 rounded font-mono text-sm min-h-32 max-h-64 overflow-auto">
                {testResults.length === 0 ? (
                  <div className="text-gray-500">Run tests to see results...</div>
                ) : (
                  testResults.map((result, index) => (
                    <div key={index}>{result}</div>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
