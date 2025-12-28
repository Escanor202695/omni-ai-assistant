'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, User, Phone, Calendar, Download, Loader2 } from 'lucide-react';

interface CallLogDetailsProps {
  callId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Message {
  role: string;
  message: string;
  time?: number;
  endTime?: number;
  secondsFromStart?: number;
}

interface CallDetails {
  id: string;
  status: string;
  type: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  cost?: number;
  transcript?: string;
  recordingUrl?: string;
  messages?: Message[];
  metadata?: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
  };
  assistant?: {
    name?: string;
  };
}

export function CallLogDetails({ callId, open, onOpenChange }: CallLogDetailsProps) {
  const [loading, setLoading] = useState(false);
  const [callDetails, setCallDetails] = useState<CallDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (callId && open) {
      fetchCallDetails();
    }
  }, [callId, open]);

  const fetchCallDetails = async () => {
    if (!callId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/vapi/calls/${callId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch call details');
      }

      setCallDetails(data.call);
    } catch (err) {
      console.error('Error fetching call details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load call details');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const downloadRecording = () => {
    if (callDetails?.recordingUrl) {
      window.open(callDetails.recordingUrl, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Call Log Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-sm text-gray-600">Loading call details...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchCallDetails} variant="outline">
              Retry
            </Button>
          </div>
        ) : callDetails ? (
          <div className="space-y-6">
            {/* Call Info */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Call Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Customer</p>
                    <p className="font-medium">
                      {callDetails.metadata?.customerName || 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium">
                      {callDetails.metadata?.customerPhone || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Started At</p>
                    <p className="font-medium">{formatDate(callDetails.startedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Duration</p>
                    <p className="font-medium">{formatDuration(callDetails.duration)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs mt-1 ${
                      callDetails.status === 'ended'
                        ? 'bg-gray-100 text-gray-700'
                        : callDetails.status === 'in-progress'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {callDetails.status}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500">Type</p>
                  <p className="font-medium capitalize">{callDetails.type || 'N/A'}</p>
                </div>
              </div>
            </Card>

            {/* Recording */}
            {callDetails.recordingUrl && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Recording</h3>
                  <Button onClick={downloadRecording} size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                <audio controls className="w-full" src={callDetails.recordingUrl}>
                  Your browser does not support the audio element.
                </audio>
              </Card>
            )}

            {/* Transcript */}
            {callDetails.messages && callDetails.messages.length > 0 ? (
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Transcript</h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {callDetails.messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        msg.role === 'assistant'
                          ? 'bg-blue-50 border border-blue-100'
                          : msg.role === 'user'
                          ? 'bg-gray-50 border border-gray-100'
                          : 'bg-yellow-50 border border-yellow-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-700">
                          {msg.role === 'assistant'
                            ? 'AI Agent'
                            : msg.role === 'user'
                            ? 'Customer'
                            : msg.role === 'system'
                            ? 'System'
                            : msg.role}
                        </span>
                        {msg.secondsFromStart !== undefined && (
                          <span className="text-xs text-gray-500">
                            {Math.floor(msg.secondsFromStart)}s
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-800">{msg.message}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ) : callDetails.transcript ? (
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Transcript</h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {callDetails.transcript}
                  </p>
                </div>
              </Card>
            ) : (
              <Card className="p-4">
                <p className="text-sm text-gray-500 text-center py-4">
                  No transcript available for this call
                </p>
              </Card>
            )}

            {/* Cost Info */}
            {callDetails.cost !== undefined && (
              <div className="text-right text-sm text-gray-600">
                Call cost: ${callDetails.cost.toFixed(4)}
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            No call details available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
