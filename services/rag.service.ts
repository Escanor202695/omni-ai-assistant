import { pineconeIndex } from '@/lib/pinecone';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class RAGService {
  static async search(businessId: string, query: string, topK = 5): Promise<string> {
    try {
      // 1. Generate embedding for query
      const embedding = await this.getEmbedding(query);
      
      // 2. Query Pinecone
      const results = await pineconeIndex.namespace(businessId).query({
        vector: embedding,
        topK,
        includeMetadata: true,
      });
      
      // 3. Format results as context
      if (!results.matches?.length) return '';
      
      return results.matches
        .map(m => m.metadata?.text as string)
        .filter(Boolean)
        .join('\n\n');
    } catch (error) {
      console.error('[RAGService] Search error:', error);
      return '';
    }
  }

  static async indexDocument(businessId: string, docId: string, chunks: string[]) {
    const vectors = await Promise.all(
      chunks.map(async (text, i) => ({
        id: `${docId}_${i}`,
        values: await this.getEmbedding(text),
        metadata: { text, docId, businessId },
      }))
    );

    await pineconeIndex.namespace(businessId).upsert(vectors);
    return vectors.map(v => v.id);
  }

  static async deleteDocument(businessId: string, vectorIds: string[]) {
    if (vectorIds.length > 0) {
      await pineconeIndex.namespace(businessId).deleteMany(vectorIds);
    }
  }

  private static async getEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }

  static chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start += chunkSize - overlap;
    }
    
    return chunks;
  }
}
