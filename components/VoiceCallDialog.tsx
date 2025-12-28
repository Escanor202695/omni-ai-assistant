'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, PhoneOff, Loader2 } from 'lucide-react';
import Vapi from '@vapi-ai/web';

interface VoiceCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoiceCallDialog({ open, onOpenChange }: VoiceCallDialogProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [appointmentType, setAppointmentType] = useState('');
  const [businessServices, setBusinessServices] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [agentInstructions, setAgentInstructions] = useState('');
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'active' | 'ended'>('idle');
  const [transcript, setTranscript] = useState<Array<{ role: string; message: string }>>([]);
  const vapiRef = useRef<Vapi | null>(null);

  useEffect(() => {
    // Initialize Vapi with public key
    if (!vapiRef.current) {
      vapiRef.current = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '');
      
      // Set up event listeners
      vapiRef.current.on('call-start', () => {
        console.log('Call started');
        setCallStatus('active');
      });

      vapiRef.current.on('call-end', () => {
        console.log('Call ended');
        setCallStatus('ended');
      });

      vapiRef.current.on('message', (message: any) => {
        if (message.type === 'transcript') {
          console.log(`${message.role}: ${message.transcript}`);
          setTranscript((prev) => [
            ...prev,
            { role: message.role, message: message.transcript },
          ]);
        }
      });

      vapiRef.current.on('error', (error: any) => {
        console.error('Vapi error:', error);
        setCallStatus('idle');
      });
    }

    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
    };
  }, []);

  const startCall = async () => {
    if (!customerName || !customerPhone) {
      alert('Please fill in customer name and phone number');
      return;
    }

    setCallStatus('connecting');
    setTranscript([]);

    try {
      // Call API to create assistant with customer context
      const response = await fetch('/api/vapi/start-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          appointmentType,
          businessServices,
          businessHours,
          agentInstructions,
        }),
      });

      const data = await response.json();

      if (!data.assistantId) {
        throw new Error('Failed to create assistant');
      }

      // Start the call with the assistant
      await vapiRef.current?.start(data.assistantId);
    } catch (error) {
      console.error('Failed to start call:', error);
      setCallStatus('idle');
      alert('Failed to start call. Please try again.');
    }
  };

  const endCall = () => {
    vapiRef.current?.stop();
    setCallStatus('ended');
  };

  const resetDialog = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setAppointmentType('');
    setBusinessServices('');
    setBusinessHours('');
    setAgentInstructions('');
    setCallStatus('idle');
    setTranscript([]);
  };

  const handleClose = (open: boolean) => {
    if (!open && callStatus === 'active') {
      endCall();
    }
    if (!open) {
      resetDialog();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Simulate Incoming Call</DialogTitle>
          <DialogDescription>
            Fill in customer information and start a voice call with the AI agent.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {callStatus === 'idle' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="+1234567890"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointmentType">Appointment Type (Optional)</Label>
                <Input
                  id="appointmentType"
                  placeholder="e.g., Haircut, Massage, Consultation"
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value)}
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold mb-3 text-gray-700">Business Context (Optional)</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="businessServices">Services Offered</Label>
                  <textarea
                    id="businessServices"
                    className="flex min-h-[60px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Haircuts ($30), Massage ($80), Facials ($60)"
                    value={businessServices}
                    onChange={(e) => setBusinessServices(e.target.value)}
                  />
                </div>

                <div className="space-y-2 mt-3">
                  <Label htmlFor="businessHours">Business Hours</Label>
                  <Input
                    id="businessHours"
                    placeholder="e.g., Mon-Fri 9AM-6PM, Sat 10AM-4PM"
                    value={businessHours}
                    onChange={(e) => setBusinessHours(e.target.value)}
                  />
                </div>

                <div className="space-y-2 mt-3">
                  <Label htmlFor="agentInstructions">Agent Instructions</Label>
                  <textarea
                    id="agentInstructions"
                    className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Provide specific instructions for the AI agent (e.g., promotions, booking policies, FAQs to address)"
                    value={agentInstructions}
                    onChange={(e) => setAgentInstructions(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={startCall}
                className="w-full mt-4"
                disabled={!customerName || !customerPhone}
              >
                <Phone className="mr-2 h-4 w-4" />
                Start Call
              </Button>
            </>
          )}

          {callStatus === 'connecting' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">Connecting call...</p>
            </div>
          )}

          {callStatus === 'active' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-green-900">Call Active</span>
                </div>
                <Button onClick={endCall} variant="destructive" size="sm">
                  <PhoneOff className="mr-2 h-4 w-4" />
                  End Call
                </Button>
              </div>

              <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto space-y-2 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Live Transcript</h4>
                {transcript.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Waiting for conversation...</p>
                ) : (
                  transcript.map((item, index) => (
                    <div
                      key={index}
                      className={`text-sm p-2 rounded ${
                        item.role === 'assistant'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-white text-gray-900'
                      }`}
                    >
                      <span className="font-semibold">
                        {item.role === 'assistant' ? 'AI Agent' : 'Customer'}:
                      </span>{' '}
                      {item.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {callStatus === 'ended' && (
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-700">Call ended</p>
              </div>

              {transcript.length > 0 && (
                <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto space-y-2 bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Call Transcript</h4>
                  {transcript.map((item, index) => (
                    <div
                      key={index}
                      className={`text-sm p-2 rounded ${
                        item.role === 'assistant'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-white text-gray-900'
                      }`}
                    >
                      <span className="font-semibold">
                        {item.role === 'assistant' ? 'AI Agent' : 'Customer'}:
                      </span>{' '}
                      {item.message}
                    </div>
                  ))}
                </div>
              )}

              <Button onClick={resetDialog} className="w-full" variant="outline">
                Start New Call
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
