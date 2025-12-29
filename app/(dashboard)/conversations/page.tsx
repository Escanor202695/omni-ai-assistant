'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, User, Clock, Phone, PhoneCall, Calendar } from 'lucide-react';
import { VoiceCallDialog } from '@/components/VoiceCallDialog';
import { CallLogDetails } from '@/components/CallLogDetails';

interface Conversation {
  id: string;
  customer: { name: string | null; email: string | null };
  status: string;
  channel: string;
  createdAt: string;
  _count: { messages: number };
}

interface CallLog {
  id: string;
  status: string;
  type: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  metadata?: {
    customerName?: string;
    customerPhone?: string;
  };
  assistant?: {
    name?: string;
  };
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVoiceDialog, setShowVoiceDialog] = useState(false);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [showCallDetails, setShowCallDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'conversations' | 'calls'>('calls');

  useEffect(() => {
    fetchConversations();
    fetchCallLogs();
  }, []);

  const fetchConversations = () => {
    fetch('/api/conversations')
      .then(res => res.json())
      .then(data => {
        setConversations(data.conversations || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const fetchCallLogs = () => {
    fetch('/api/vapi/calls')
      .then(res => res.json())
      .then(data => {
        setCallLogs(data.calls || []);
      })
      .catch(err => console.error('Failed to fetch call logs:', err));
  };

  const handleCallClick = (callId: string) => {
    setSelectedCallId(callId);
    setShowCallDetails(true);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conversations</h1>
          <p className="text-gray-500 mt-1">Manage customer conversations and call logs</p>
        </div>
        <Button onClick={() => setShowVoiceDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Phone className="mr-2 h-4 w-4" />
          Simulate Incoming Call
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('calls')}
            className={`${
              activeTab === 'calls'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <PhoneCall className="h-4 w-4 mr-2" />
            Voice Call Logs
            {callLogs.length > 0 && (
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                {callLogs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('conversations')}
            className={`${
              activeTab === 'conversations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Text Conversations
            {conversations.length > 0 && (
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                {conversations.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : activeTab === 'conversations' ? (
        conversations.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No conversations yet</h3>
              <p className="text-gray-500 mt-1">Conversations will appear here when customers start chatting.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {conversations.map((conv) => (
              <Card key={conv.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{conv.customer?.name || conv.customer?.email || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{conv._count.messages} messages • {conv.channel}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        conv.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        conv.status === 'RESOLVED' ? 'bg-gray-100 text-gray-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {conv.status}
                      </span>
                      <div className="flex items-center text-gray-400 text-sm">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(conv.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        callLogs.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <PhoneCall className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No call logs yet</h3>
              <p className="text-gray-500 mt-1">
                Call logs will appear here when voice calls are made.
              </p>
              <Button
                onClick={() => setShowVoiceDialog(true)}
                className="mt-4"
                variant="outline"
              >
                <Phone className="mr-2 h-4 w-4" />
                Start Your First Call
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {callLogs.map((call) => (
              <Card
                key={call.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleCallClick(call.id)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${
                        call.status === 'ended' ? 'bg-gray-100' :
                        call.status === 'in-progress' ? 'bg-green-100' :
                        'bg-yellow-100'
                      }`}>
                        <PhoneCall className={`h-5 w-5 ${
                          call.status === 'ended' ? 'text-gray-600' :
                          call.status === 'in-progress' ? 'text-green-600' :
                          'text-yellow-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium">
                          {call.metadata?.customerName || 'Unknown Caller'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {call.metadata?.customerPhone || 'No phone'} • {formatDuration(call.duration)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        call.status === 'ended' ? 'bg-gray-100 text-gray-700' :
                        call.status === 'in-progress' ? 'bg-green-100 text-green-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {call.status}
                      </span>
                      <div className="flex items-center text-gray-400 text-sm">
                        <Calendar className="h-4 w-4 mr-1" />
                        {call.startedAt
                          ? new Date(call.startedAt).toLocaleString()
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      <VoiceCallDialog open={showVoiceDialog} onOpenChange={setShowVoiceDialog} />
      <CallLogDetails
        callId={selectedCallId}
        open={showCallDetails}
        onOpenChange={setShowCallDetails}
      />
    </div>
  );
}

