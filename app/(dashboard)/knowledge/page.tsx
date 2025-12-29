'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, Plus, Trash2, FileText, HelpCircle, 
  ScrollText, Globe, Upload, Loader2, Search, X 
} from 'lucide-react';
import { toast } from 'sonner';

interface KnowledgeDoc {
  id: string;
  title: string;
  content: string;
  docType: 'FAQ' | 'SERVICE' | 'POLICY' | 'WEBSITE' | 'DOCUMENT';
  createdAt: string;
  updatedAt: string;
}

const DOC_TYPE_INFO = {
  FAQ: { icon: HelpCircle, label: 'FAQ', color: 'text-blue-500', bg: 'bg-blue-50' },
  SERVICE: { icon: ScrollText, label: 'Service', color: 'text-green-500', bg: 'bg-green-50' },
  POLICY: { icon: FileText, label: 'Policy', color: 'text-orange-500', bg: 'bg-orange-50' },
  WEBSITE: { icon: Globe, label: 'Website', color: 'text-purple-500', bg: 'bg-purple-50' },
  DOCUMENT: { icon: FileText, label: 'Document', color: 'text-gray-500', bg: 'bg-gray-50' },
};

export default function KnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [newDoc, setNewDoc] = useState({
    title: '',
    content: '',
    docType: 'FAQ' as 'FAQ' | 'SERVICE' | 'POLICY' | 'WEBSITE' | 'DOCUMENT',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await fetch('/api/knowledge');
      const data = await res.json();
      setDocs(data.data || []);
    } catch (error) {
      toast.error('Failed to load knowledge base');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newDoc.title.trim() || !newDoc.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoc),
      });

      if (res.ok) {
        toast.success('Document added to knowledge base!');
        setShowAddModal(false);
        setNewDoc({ title: '', content: '', docType: 'FAQ' });
        fetchDocs();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to add document');
      }
    } catch {
      toast.error('Failed to add document');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/knowledge/${id}`, { method: 'DELETE' });

      if (res.ok) {
        toast.success('Document deleted');
        setDocs(docs.filter(d => d.id !== id));
      } else {
        toast.error('Failed to delete document');
      }
    } catch {
      toast.error('Failed to delete document');
    } finally {
      setDeleting(null);
    }
  };

  const filteredDocs = docs.filter(doc => {
    const matchesSearch = !searchQuery || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !selectedType || doc.docType === selectedType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-gray-500 mt-1">Train your AI with business-specific information</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Add Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(DOC_TYPE_INFO).map(([type, info]) => {
          const count = docs.filter(d => d.docType === type).length;
          const Icon = info.icon;
          return (
            <button
              key={type}
              onClick={() => setSelectedType(selectedType === type ? null : type)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedType === type
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon className={`h-5 w-5 ${info.color} mb-1`} />
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-500">{info.label}s</div>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Documents List */}
      {filteredDocs.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {docs.length === 0 ? 'No documents yet' : 'No matching documents'}
          </h3>
          <p className="text-gray-500 mb-4">
            {docs.length === 0
              ? 'Add FAQs, services, and policies to train your AI'
              : 'Try a different search term or filter'}
          </p>
          {docs.length === 0 && (
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Document
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDocs.map((doc) => {
            const typeInfo = DOC_TYPE_INFO[doc.docType];
            const Icon = typeInfo.icon;

            return (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${typeInfo.bg}`}>
                        <Icon className={`h-5 w-5 ${typeInfo.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900">{doc.title}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {doc.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo.bg} ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            Updated {new Date(doc.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deleting === doc.id}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      {deleting === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Add Knowledge Document</h2>
              <p className="text-sm text-gray-500">This information will help your AI answer customer questions</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Document Type</label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(DOC_TYPE_INFO).map(([type, info]) => {
                    const Icon = info.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => setNewDoc({ ...newDoc, docType: type as any })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          newDoc.docType === type
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${info.color} mx-auto mb-1`} />
                        <div className="text-xs text-center">{info.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Title</label>
                <Input
                  placeholder={
                    newDoc.docType === 'FAQ' ? 'What are your business hours?' :
                    newDoc.docType === 'SERVICE' ? 'Deep Tissue Massage' :
                    newDoc.docType === 'POLICY' ? 'Cancellation Policy' :
                    'Document title'
                  }
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Content</label>
                <textarea
                  className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder={
                    newDoc.type === 'FAQ' ? 'We are open Monday to Friday, 9 AM to 6 PM...' :
                    newDoc.type === 'SERVICE' ? 'A therapeutic massage focusing on deeper layers of muscle tissue. Duration: 60 minutes. Price: $120...' :
                    newDoc.type === 'POLICY' ? 'Appointments can be cancelled or rescheduled up to 24 hours in advance without penalty...' :
                    'Enter the document content...'
                  }
                  value={newDoc.content}
                  onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                />
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Document
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
