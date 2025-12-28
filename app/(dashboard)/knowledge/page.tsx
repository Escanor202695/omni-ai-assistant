'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, FileText, Globe, HelpCircle } from 'lucide-react';

interface KnowledgeDoc {
  id: string;
  title: string;
  docType: string;
  content: string;
  isProcessed: boolean;
  createdAt: string;
}

export default function KnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/knowledge')
      .then(res => res.json())
      .then(data => {
        setDocs(data.documents || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const typeIcons: Record<string, React.ReactNode> = {
    FAQ: <HelpCircle className="h-5 w-5 text-blue-600" />,
    SERVICE: <FileText className="h-5 w-5 text-green-600" />,
    POLICY: <FileText className="h-5 w-5 text-purple-600" />,
    WEBSITE: <Globe className="h-5 w-5 text-orange-600" />,
    DOCUMENT: <FileText className="h-5 w-5 text-gray-600" />,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-gray-500 mt-1">Train your AI with documents and FAQs</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Document
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : docs.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No documents yet</h3>
            <p className="text-gray-500 mt-1">Add FAQs, service info, and policies to train your AI assistant.</p>
            <Button className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="py-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    {typeIcons[doc.docType] || <FileText className="h-5 w-5 text-gray-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.title}</p>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{doc.content.substring(0, 100)}...</p>
                    <div className="flex items-center mt-2 space-x-2">
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{doc.docType}</span>
                      {doc.isProcessed ? (
                        <span className="text-green-600 text-xs">✓ Indexed</span>
                      ) : (
                        <span className="text-yellow-600 text-xs">Processing...</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

