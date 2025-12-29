'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Bot, Save, Sparkles, MessageSquare, AlertTriangle, 
  Zap, Send, Loader2, RotateCcw, Volume2
} from 'lucide-react';
import { toast } from 'sonner';

interface AISettings {
  aiPersonality: string;
  aiGreeting: string | null;
  aiInstructions: string | null;
  aiTone?: string;
  aiResponseLength?: string;
  aiLanguage?: string;
  aiFallbackMessage?: string;
  aiEscalationKeywords?: string;
  aiMaxResponseTokens?: number;
}

const PERSONALITY_OPTIONS = [
  { value: 'professional', label: 'Professional', description: 'Formal, business-like communication' },
  { value: 'friendly', label: 'Friendly', description: 'Warm, approachable, and personable' },
  { value: 'casual', label: 'Casual', description: 'Relaxed, conversational tone' },
  { value: 'formal', label: 'Formal', description: 'Very formal, traditional communication' },
  { value: 'enthusiastic', label: 'Enthusiastic', description: 'Energetic and excited about helping' },
  { value: 'empathetic', label: 'Empathetic', description: 'Understanding and compassionate' },
];

const TONE_OPTIONS = [
  { value: 'helpful', label: 'Helpful' },
  { value: 'concise', label: 'Concise' },
  { value: 'detailed', label: 'Detailed' },
  { value: 'persuasive', label: 'Persuasive' },
  { value: 'supportive', label: 'Supportive' },
];

const RESPONSE_LENGTH_OPTIONS = [
  { value: 'brief', label: 'Brief', description: '1-2 sentences', tokens: 100 },
  { value: 'moderate', label: 'Moderate', description: '2-4 sentences', tokens: 250 },
  { value: 'detailed', label: 'Detailed', description: 'Comprehensive responses', tokens: 500 },
  { value: 'thorough', label: 'Thorough', description: 'Very detailed explanations', tokens: 1000 },
];

export default function AISettingsPage() {
  const [settings, setSettings] = useState<AISettings>({
    aiPersonality: 'professional',
    aiGreeting: '',
    aiInstructions: '',
    aiTone: 'helpful',
    aiResponseLength: 'moderate',
    aiLanguage: 'en',
    aiFallbackMessage: "I'm not sure how to help with that. Let me connect you with a team member.",
    aiEscalationKeywords: 'angry, frustrated, complaint, speak to human, manager',
    aiMaxResponseTokens: 250,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.business) {
          setSettings(prev => ({
            ...prev,
            aiPersonality: data.business.aiPersonality || 'professional',
            aiGreeting: data.business.aiGreeting || '',
            aiInstructions: data.business.aiInstructions || '',
          }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/businesses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiPersonality: settings.aiPersonality,
          aiGreeting: settings.aiGreeting,
          aiInstructions: buildFullInstructions(),
        }),
      });
      
      if (res.ok) {
        toast.success('AI settings saved successfully!');
      } else {
        toast.error('Failed to save settings');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const buildFullInstructions = () => {
    let instructions = settings.aiInstructions || '';
    
    // Add tone preference
    if (settings.aiTone) {
      instructions += `\n\nTONE: Be ${settings.aiTone} in all responses.`;
    }
    
    // Add response length preference
    const lengthOption = RESPONSE_LENGTH_OPTIONS.find(o => o.value === settings.aiResponseLength);
    if (lengthOption) {
      instructions += `\n\nRESPONSE LENGTH: Keep responses ${lengthOption.value} (${lengthOption.description}).`;
    }
    
    // Add escalation keywords
    if (settings.aiEscalationKeywords) {
      instructions += `\n\nESCALATION: If the customer mentions any of these words or phrases, offer to connect them with a human: ${settings.aiEscalationKeywords}`;
    }
    
    // Add fallback message
    if (settings.aiFallbackMessage) {
      instructions += `\n\nFALLBACK: If you cannot answer a question, say: "${settings.aiFallbackMessage}"`;
    }
    
    return instructions;
  };

  const handleTest = async () => {
    if (!testMessage.trim()) return;
    
    setTesting(true);
    setTestResponse('');
    
    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: testMessage,
          settings: {
            personality: settings.aiPersonality,
            instructions: buildFullInstructions(),
          }
        }),
      });
      
      const data = await res.json();
      setTestResponse(data.response || 'No response generated');
    } catch {
      setTestResponse('Error testing AI. Please try again.');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Agent Settings</h1>
          <p className="text-gray-500 mt-1">Control how your AI assistant behaves and responds</p>
        </div>
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      {/* Personality Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
            AI Personality
          </CardTitle>
          <CardDescription>Choose how your AI should present itself to customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PERSONALITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSettings({ ...settings, aiPersonality: option.value })}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  settings.aiPersonality === option.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{option.label}</div>
                <div className="text-sm text-gray-500">{option.description}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tone & Style */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Volume2 className="h-5 w-5 mr-2 text-blue-500" />
            Tone & Style
          </CardTitle>
          <CardDescription>Fine-tune the communication style</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Primary Tone</label>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSettings({ ...settings, aiTone: option.value })}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    settings.aiTone === option.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Response Length</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {RESPONSE_LENGTH_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSettings({ 
                    ...settings, 
                    aiResponseLength: option.value,
                    aiMaxResponseTokens: option.tokens,
                  })}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    settings.aiResponseLength === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Greeting & Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-green-500" />
            Greeting & Messages
          </CardTitle>
          <CardDescription>Customize automatic messages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Welcome Greeting</label>
            <Input 
              placeholder="Hi! Welcome to [Business]. How can I help you today?"
              value={settings.aiGreeting || ''} 
              onChange={(e) => setSettings({ ...settings, aiGreeting: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">Shown when a customer starts a new conversation</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Fallback Message</label>
            <Input 
              placeholder="I'm not sure about that. Let me connect you with someone who can help."
              value={settings.aiFallbackMessage || ''} 
              onChange={(e) => setSettings({ ...settings, aiFallbackMessage: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">Used when the AI can't answer a question</p>
          </div>
        </CardContent>
      </Card>

      {/* Custom Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-500" />
            Custom Instructions
          </CardTitle>
          <CardDescription>Give specific guidance to your AI</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea 
            className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder={`Examples:
- Always mention our current promotion: 20% off first visit
- If asked about pricing, direct them to our website
- For appointments, always confirm the service, date, and time
- Be extra helpful with elderly customers
- Never discuss competitor products`}
            value={settings.aiInstructions || ''} 
            onChange={(e) => setSettings({ ...settings, aiInstructions: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">These instructions are added to every AI conversation</p>
        </CardContent>
      </Card>

      {/* Escalation Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
            Escalation Rules
          </CardTitle>
          <CardDescription>Define when conversations should be handed to humans</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Escalation Keywords</label>
            <Input 
              placeholder="angry, frustrated, complaint, manager, refund, cancel"
              value={settings.aiEscalationKeywords || ''} 
              onChange={(e) => setSettings({ ...settings, aiEscalationKeywords: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated words that trigger escalation offer</p>
          </div>
        </CardContent>
      </Card>

      {/* Test Your AI */}
      <Card className="border-2 border-dashed border-purple-200 bg-purple-50/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bot className="h-5 w-5 mr-2 text-purple-500" />
            Test Your AI
          </CardTitle>
          <CardDescription>Preview how your AI will respond with current settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input 
              placeholder="Type a test message..."
              value={testMessage} 
              onChange={(e) => setTestMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTest()}
            />
            <Button onClick={handleTest} disabled={testing || !testMessage.trim()}>
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
            {testResponse && (
              <Button variant="outline" onClick={() => { setTestMessage(''); setTestResponse(''); }}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {testResponse && (
            <div className="p-4 bg-white rounded-lg border">
              <div className="text-xs text-gray-500 mb-2">AI Response:</div>
              <div className="text-gray-900">{testResponse}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

