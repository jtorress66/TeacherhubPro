import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = `${window.location.origin}/api`;

const SetupAdmin = () => {
  const [email, setEmail] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post(`${API}/setup/first-admin`, {
        email: email,
        setup_key: setupKey
      });
      
      setSuccess(true);
      toast.success(res.data.message);
    } catch (err) {
      const message = err.response?.data?.detail || 'Setup failed. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Setup Complete!</h2>
            <p className="text-slate-600 mb-6">
              You are now a Super Admin. You have full access to the Admin Panel.
            </p>
            <Button onClick={() => window.location.href = '/dashboard'} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-slate-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <Shield className="h-7 w-7 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Super Admin Setup</CardTitle>
          <CardDescription>
            One-time setup to create the first Super Admin account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Your Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-slate-500">
                Must be the email you used to login/register
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="setupKey">Setup Key</Label>
              <Input
                id="setupKey"
                type="password"
                placeholder="Enter the setup key"
                value={setupKey}
                onChange={(e) => setSetupKey(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Become Super Admin
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-3 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Note:</strong> This page only works once. After the first Super Admin is created, this endpoint is automatically disabled for security.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupAdmin;
