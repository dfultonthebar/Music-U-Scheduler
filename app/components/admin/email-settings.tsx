

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Save, TestTube, Mail, Server, Lock, Eye, EyeOff } from 'lucide-react';
import { apiService } from '@/lib/api';
import { EmailServerSettings } from '@/lib/types';

export default function EmailSettings() {
  const [settings, setSettings] = useState<EmailServerSettings>({
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_use_tls: true,
    smtp_use_ssl: false,
    imap_host: '',
    imap_port: 993,
    imap_username: '',
    imap_password: '',
    from_email: '',
    from_name: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const emailSettings = await apiService.getEmailSettings();
      setSettings(emailSettings);
    } catch (error) {
      toast.error('Failed to load email settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiService.updateEmailSettings(settings);
      toast.success('Email settings saved successfully');
    } catch (error) {
      toast.error('Failed to save email settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      const result = await apiService.testEmailSettings(settings);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to test email settings');
    } finally {
      setTesting(false);
    }
  };

  const updateSetting = (key: keyof EmailServerSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Server Settings</h2>
          <p className="text-gray-500">Configure SMTP and IMAP settings for email functionality</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleTest} disabled={testing}>
            <TestTube className="w-4 h-4 mr-2" />
            {testing ? 'Testing...' : 'Test Settings'}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SMTP Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              SMTP Settings (Outbound Email)
            </CardTitle>
            <CardDescription>Configure outbound email server settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="smtp_host">SMTP Server Host</Label>
              <Input
                id="smtp_host"
                value={settings.smtp_host}
                onChange={(e) => updateSetting('smtp_host', e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="smtp_port">SMTP Port</Label>
              <Input
                id="smtp_port"
                type="number"
                value={settings.smtp_port}
                onChange={(e) => updateSetting('smtp_port', parseInt(e.target.value))}
                placeholder="587"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="smtp_username">SMTP Username</Label>
              <Input
                id="smtp_username"
                value={settings.smtp_username}
                onChange={(e) => updateSetting('smtp_username', e.target.value)}
                placeholder="your-email@gmail.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="smtp_password">SMTP Password</Label>
              <div className="relative">
                <Input
                  id="smtp_password"
                  type={showPasswords ? 'text' : 'password'}
                  value={settings.smtp_password}
                  onChange={(e) => updateSetting('smtp_password', e.target.value)}
                  placeholder="••••••••"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswords(!showPasswords)}
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="use_tls">Use TLS</Label>
                  <p className="text-sm text-muted-foreground">Enable TLS encryption (recommended)</p>
                </div>
                <Switch
                  id="use_tls"
                  checked={settings.smtp_use_tls}
                  onCheckedChange={(checked) => updateSetting('smtp_use_tls', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="use_ssl">Use SSL</Label>
                  <p className="text-sm text-muted-foreground">Enable SSL encryption</p>
                </div>
                <Switch
                  id="use_ssl"
                  checked={settings.smtp_use_ssl}
                  onCheckedChange={(checked) => updateSetting('smtp_use_ssl', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* IMAP Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              IMAP Settings (Inbound Email)
            </CardTitle>
            <CardDescription>Configure inbound email server settings (optional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imap_host">IMAP Server Host</Label>
              <Input
                id="imap_host"
                value={settings.imap_host}
                onChange={(e) => updateSetting('imap_host', e.target.value)}
                placeholder="imap.gmail.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="imap_port">IMAP Port</Label>
              <Input
                id="imap_port"
                type="number"
                value={settings.imap_port}
                onChange={(e) => updateSetting('imap_port', parseInt(e.target.value))}
                placeholder="993"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="imap_username">IMAP Username</Label>
              <Input
                id="imap_username"
                value={settings.imap_username}
                onChange={(e) => updateSetting('imap_username', e.target.value)}
                placeholder="your-email@gmail.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="imap_password">IMAP Password</Label>
              <div className="relative">
                <Input
                  id="imap_password"
                  type={showPasswords ? 'text' : 'password'}
                  value={settings.imap_password}
                  onChange={(e) => updateSetting('imap_password', e.target.value)}
                  placeholder="••••••••"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswords(!showPasswords)}
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Identity Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Email Identity Settings
          </CardTitle>
          <CardDescription>Configure the sender identity for outbound emails</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from_email">From Email Address</Label>
              <Input
                id="from_email"
                type="email"
                value={settings.from_email}
                onChange={(e) => updateSetting('from_email', e.target.value)}
                placeholder="noreply@musicu.local"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="from_name">From Name</Label>
              <Input
                id="from_name"
                value={settings.from_name}
                onChange={(e) => updateSetting('from_name', e.target.value)}
                placeholder="Music-U-Scheduler"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Help */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Help</CardTitle>
          <CardDescription>Common email provider settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Gmail Settings</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>SMTP Host: smtp.gmail.com</li>
                <li>SMTP Port: 587 (TLS) or 465 (SSL)</li>
                <li>IMAP Host: imap.gmail.com</li>
                <li>IMAP Port: 993</li>
                <li>Note: Use App Password for 2FA enabled accounts</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Office 365 Settings</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>SMTP Host: smtp-mail.outlook.com</li>
                <li>SMTP Port: 587</li>
                <li>IMAP Host: outlook.office365.com</li>
                <li>IMAP Port: 993</li>
                <li>Note: Enable modern authentication</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

