import { db } from '@/lib/db';
import { RAGService } from './rag.service';
import { KnowledgeDocType } from '@prisma/client';

export interface CreateKnowledgeDocData {
  title: string;
  content: string;
  docType: KnowledgeDocType;
  sourceUrl?: string;
  fileUrl?: string;
  fileName?: string;
}

export class KnowledgeService {
  static async list(businessId: string, params: {
    docType?: KnowledgeDocType;
    page: number;
    limit: number;
  }) {
    const { docType, page, limit } = params;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      db.knowledgeDoc.findMany({
        where: {
          businessId,
          ...(docType && { docType }),
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.knowledgeDoc.count({
        where: {
          businessId,
          ...(docType && { docType }),
        },
      }),
    ]);

    return { data: docs, meta: { page, limit, total } };
  }

  static async getById(businessId: string, id: string) {
    return db.knowledgeDoc.findFirst({
      where: { id, businessId },
    });
  }

  static async create(businessId: string, data: CreateKnowledgeDocData) {
    // Create the document first
    const doc = await db.knowledgeDoc.create({
      data: {
        businessId,
        ...data,
        isProcessed: false,
      },
    });

    // Process in background (in production, use a queue)
    this.processDocument(businessId, doc.id, data.content).catch(console.error);

    return doc;
  }

  static async processDocument(businessId: string, docId: string, content: string) {
    try {
      // 1. Chunk the content
      const chunks = RAGService.chunkText(content);

      // 2. Index in Pinecone
      const vectorIds = await RAGService.indexDocument(businessId, docId, chunks);

      // 3. Update doc with vector IDs
      await db.knowledgeDoc.update({
        where: { id: docId },
        data: {
          isProcessed: true,
          processedAt: new Date(),
          vectorIds,
          chunkCount: chunks.length,
        },
      });
    } catch (error) {
      console.error('[KnowledgeService] Processing error:', error);
      
      await db.knowledgeDoc.update({
        where: { id: docId },
        data: {
          isProcessed: false,
          processingError: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  static async update(businessId: string, id: string, data: Partial<CreateKnowledgeDocData>) {
    const doc = await db.knowledgeDoc.findFirst({
      where: { id, businessId },
    });

    if (!doc) throw new Error('Document not found');

    // If content changed, reprocess
    const shouldReprocess = data.content && data.content !== doc.content;

    const updated = await db.knowledgeDoc.update({
      where: { id },
      data: {
        ...data,
        ...(shouldReprocess && { isProcessed: false, processedAt: null }),
      },
    });

    if (shouldReprocess && data.content) {
      // Delete old vectors
      if (doc.vectorIds.length > 0) {
        await RAGService.deleteDocument(businessId, doc.vectorIds);
      }
      // Reprocess
      this.processDocument(businessId, id, data.content).catch(console.error);
    }

    return updated;
  }

  static async delete(businessId: string, id: string) {
    const doc = await db.knowledgeDoc.findFirst({
      where: { id, businessId },
    });

    if (!doc) throw new Error('Document not found');

    // Delete vectors from Pinecone
    if (doc.vectorIds.length > 0) {
      await RAGService.deleteDocument(businessId, doc.vectorIds);
    }

    // Delete document
    return db.knowledgeDoc.delete({
      where: { id },
    });
  }
}
