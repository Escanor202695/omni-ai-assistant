'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, PhoneOff, Loader2 } from 'lucide-react';
import Vapi from '@vapi-ai/web';
import { Business } from '@/types';

interface VoiceCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoiceCallDialog({ open, onOpenChange }: VoiceCallDialogProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [appointmentType, setAppointmentType] = useState('');
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'active' | 'ended'>('idle');
  const [transcript, setTranscript] = useState<Array<{ role: string; message: string }>>([]);
  const [bookedAppointment, setBookedAppointment] = useState<any>(null);
  const vapiRef = useRef<Vapi | null>(null);

  const [business, setBusiness] = useState<Business | null>(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => {
          setBusiness(data.business);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, []);

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
        console.log('Vapi message received:', message);
        if (message.type === 'transcript') {
          console.log(`${message.role}: ${message.transcript}`);
          setTranscript((prev) => [
            ...prev,
            { role: message.role, message: message.transcript },
          ]);
        } else if (message.type === 'function-call' && message.functionCall?.name === 'book_appointment') {
          console.log('Appointment booking function called:', message.functionCall);
          // Handle appointment booking
          handleAppointmentBooking(message.functionCall.arguments);
        } else if (message.type === 'tool-calls' && message.toolCalls) {
          // Alternative format for function calls
          console.log('Tool calls received:', message.toolCalls);
          const bookAppointmentCall = message.toolCalls.find((call: any) => 
            call.function?.name === 'book_appointment' || call.name === 'book_appointment'
          );
          if (bookAppointmentCall) {
            const args = bookAppointmentCall.function?.arguments || bookAppointmentCall.arguments;
            if (args) {
              handleAppointmentBooking(typeof args === 'string' ? JSON.parse(args) : args);
            }
          }
        } else if (message.type === 'function-call') {
          console.log('Other function call:', message.functionCall);
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
    if (!business?.vapiAssistantId) {
      alert('No Vapi assistant configured. Please create one in Settings first.');
      return;
    }

    setCallStatus('connecting');
    setTranscript([]);

    try {
      // Start the call with the existing assistant
      await vapiRef.current?.start(business.vapiAssistantId);
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

  const handleAppointmentBooking = async (appointmentData: any) => {
    console.log('=== APPOINTMENT BOOKING STARTED ===');
    console.log('Raw appointment data received:', appointmentData);

    try {
      // Validate appointment data
      if (!appointmentData || !appointmentData.startTime || !appointmentData.customerName || !appointmentData.customerPhone) {
        console.error('Invalid appointment data - missing required fields:', appointmentData);
        alert('Invalid appointment data received - missing customer information or appointment time');
        return;
      }

      console.log('Creating customer...');
      // Create a new customer using data from the AI conversation
      let customerId = null;
      const customerData: any = {
        name: appointmentData.customerName,
        phone: appointmentData.customerPhone,
      };
      if (appointmentData.customerEmail) {
        customerData.email = appointmentData.customerEmail;
      }
      console.log('Customer data to create:', customerData);

      const customerResponse = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });
      console.log('Customer creation response status:', customerResponse.status);

      const customer = await customerResponse.json();
      console.log('Customer creation result:', customer);

      if (customerResponse.ok && customer.id) {
        customerId = customer.id;
        console.log('Customer created successfully with ID:', customerId);
      } else {
        console.error('Failed to create customer:', customer);
        alert('Failed to create customer record');
        return;
      }

      // Validate and format startTime
      console.log('Processing startTime:', appointmentData.startTime);
      let startTime: string;
      try {
        const startDate = new Date(appointmentData.startTime);
        console.log('Parsed date:', startDate);
        if (isNaN(startDate.getTime())) {
          throw new Error('Invalid date');
        }
        startTime = startDate.toISOString();
        console.log('Formatted startTime:', startTime);
      } catch (error) {
        console.error('Invalid startTime format:', appointmentData.startTime, error);
        alert('Invalid appointment time provided');
        return;
      }

      // Create the appointment
      const appointmentPayload = {
        customerId,
        serviceName: appointmentData.serviceName || 'General Appointment',
        startTime,
        duration: appointmentData.duration || 60,
        notes: appointmentData.notes || `Booked via voice call - ${appointmentData.customerName}`,
      };
      console.log('Appointment payload:', appointmentPayload);

      const appointmentResponse = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentPayload),
      });

      console.log('Appointment creation response status:', appointmentResponse.status);

      if (appointmentResponse.ok) {
        const appointment = await appointmentResponse.json();
        console.log('Appointment created successfully:', appointment);
        setBookedAppointment(appointment);
        
        // Send success message back to Vapi
        if (vapiRef.current) {
          const successMessage = `Perfect! I've successfully booked your ${appointment.serviceName} appointment for ${new Date(appointment.startTime).toLocaleDateString()} at ${new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
          console.log('Sending success message to Vapi:', successMessage);
          // Note: Vapi SDK might have a method to send messages, but for now we'll rely on the UI feedback
        }
      } else {
        const errorText = await appointmentResponse.text();
        console.error('Failed to create appointment. Response:', errorText);
        alert(`Failed to create appointment: ${errorText}`);
      }
    } catch (error) {
      console.error('Error in appointment booking:', error);
      alert(`Error booking appointment: ${error}`);
    }
    console.log('=== APPOINTMENT BOOKING FINISHED ===');
  };

  const resetDialog = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setAppointmentType('');
    setCallStatus('idle');
    setTranscript([]);
    setBookedAppointment(null);
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
            Start a voice call with the AI agent. The assistant will collect customer information and handle appointment bookings automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {callStatus === 'idle' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name (Optional - AI will collect)</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional - AI will collect)</Label>
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

              <Button
                onClick={startCall}
                className="w-full mt-4"
                disabled={!business?.vapiAssistantId}
              >
                <Phone className="mr-2 h-4 w-4" />
                Start Call
              </Button>

              {/* Test button for appointment booking */}
              <Button
                onClick={() => handleAppointmentBooking({
                  customerName: customerName || 'Test Customer',
                  customerPhone: customerPhone || '+1234567890',
                  customerEmail: customerEmail || 'test@example.com',
                  serviceName: 'Test Service',
                  startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
                  duration: 60,
                  notes: 'Test appointment booking'
                })}
                className="w-full mt-2"
                variant="outline"
              >
                Test Appointment Booking
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

              {bookedAppointment && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Appointment Booked!</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Service:</strong> {bookedAppointment.serviceName}</p>
                    <p><strong>Date & Time:</strong> {new Date(bookedAppointment.startTime).toLocaleString()}</p>
                    <p><strong>Duration:</strong> {bookedAppointment.duration} minutes</p>
                    {bookedAppointment.notes && <p><strong>Notes:</strong> {bookedAppointment.notes}</p>}
                  </div>
                </div>
              )}

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
