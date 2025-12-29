'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessageCircle, Instagram, Facebook, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Integration {
  id: string;
  type: 'WHATSAPP' | 'INSTAGRAM' | 'FACEBOOK' | 'VAPI' | 'GOOGLE_CALENDAR' | 'EMAIL';
  isActive: boolean;
  platformId: string;
  platformName: string | null;
  createdAt: string;
  metadata: any;
}

export default function IntegrationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrations();
    
    // Remove Facebook OAuth hash fragment immediately
    if (window.location.hash === '#_=_') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    
    // Show success/error messages from URL params
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    
    if (success === 'connected') {
      setTimeout(() => {
        alert('✅ Integration connected successfully!');
        // Clear URL params and remove hash
        router.replace('/dashboard/integrations');
        // Refresh integrations list
        fetchIntegrations();
      }, 100);
    } else if (error) {
      const errorMessages: Record<string, string> = {
        oauth_failed: 'OAuth authentication failed. Please try again.',
        missing_params: 'Missing required parameters. Please try again.',
        invalid_state: 'Invalid state parameter. Please try again.',
        token_exchange_failed: 'Failed to exchange authorization code. Please try again.',
        no_token: 'No access token received. Please try again.',
        no_platform_id: 'Could not retrieve platform information. Make sure WhatsApp is set up in your Meta App.',
        callback_failed: 'Callback processing failed. Please try again.',
      };
      setTimeout(() => {
        alert('❌ ' + (errorMessages[error] || 'An error occurred. Please try again.'));
        // Clear URL params and remove hash
        router.replace('/dashboard/integrations');
      }, 100);
    }
  }, [searchParams, router]);

  const fetchIntegrations = async () => {
    try {
      const res = await fetch('/api/integrations');
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (type: 'WHATSAPP' | 'INSTAGRAM' | 'FACEBOOK') => {
    setConnecting(type);
    try {
      window.location.href = `/api/integrations/meta/connect?type=${type.toLowerCase()}`;
    } catch (error) {
      console.error('Error connecting:', error);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) {
      return;
    }

    try {
      const res = await fetch(`/api/integrations/${integrationId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchIntegrations();
      } else {
        alert('Failed to disconnect integration');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert('Failed to disconnect integration');
    }
  };

  const getIntegrationInfo = (type: string) => {
    switch (type) {
      case 'WHATSAPP':
        return {
          name: 'WhatsApp',
          icon: MessageCircle,
          description: 'Connect your WhatsApp Business account to receive and send messages',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        };
      case 'INSTAGRAM':
        return {
          name: 'Instagram',
          icon: Instagram,
          description: 'Connect your Instagram account to handle direct messages',
          color: 'text-pink-600',
          bgColor: 'bg-pink-50',
        };
      case 'FACEBOOK':
        return {
          name: 'Facebook Messenger',
          icon: Facebook,
          description: 'Connect your Facebook Page to handle Messenger conversations',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        };
      default:
        return {
          name: type,
          icon: MessageCircle,
          description: '',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
        };
    }
  };

  const findIntegration = (type: string) => {
    // For Facebook, find any active Facebook or Instagram integration (they're the same)
    if (type === 'FACEBOOK') {
      return integrations.find((i) => (i.type === 'FACEBOOK' || i.type === 'INSTAGRAM') && i.isActive);
    }
    return integrations.find((i) => i.type === type && i.isActive);
  };

  const platforms = [
    { type: 'WHATSAPP' as const },
    { type: 'INSTAGRAM' as const },
    { type: 'FACEBOOK' as const },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-600 mt-1">
          Connect your business channels to start receiving messages
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {platforms.map((platform) => {
          const info = getIntegrationInfo(platform.type);
          const integration = findIntegration(platform.type);
          const Icon = info.icon;
          const isConnecting = connecting === platform.type;

          return (
            <Card key={platform.type} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${info.bgColor}`}>
                  <Icon className={`w-6 h-6 ${info.color}`} />
                </div>
                {integration?.isActive ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-medium">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400">
                    <XCircle className="w-5 h-5" />
                    <span className="text-sm">Not Connected</span>
                  </div>
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{info.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{info.description}</p>

              {integration && integration.isActive ? (
                <div className="space-y-3">
                  <div className="text-sm">
                    <p className="text-gray-500">Platform ID:</p>
                    <p className="font-mono text-xs text-gray-700 truncate">
                      {integration.platformId}
                    </p>
                  </div>
                  {integration.platformName && (
                    <div className="text-sm">
                      <p className="text-gray-500">Name:</p>
                      <p className="text-gray-700">{integration.platformName}</p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleDisconnect(integration.id)}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => handleConnect(platform.type)}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    `Connect ${info.name}`
                  )}
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {integrations.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Integrations</h2>
          <div className="space-y-2">
            {integrations.map((integration) => {
              const info = getIntegrationInfo(integration.type);
              return (
                <div
                  key={integration.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${info.bgColor}`}>
                      <info.icon className={`w-4 h-4 ${info.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {info.name}
                        {integration.platformName && ` - ${integration.platformName}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        Connected {new Date(integration.createdAt).toLocaleDateString()}
                        {integration.platformId && (
                          <span className="ml-2 font-mono">ID: {integration.platformId}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {integration.isActive ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Active
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

