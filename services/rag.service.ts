import { pineconeIndex } from '@/lib/pinecone';
import OpenAI from 'openai';

// Use OpenAI directly for embeddings (OpenRouter doesn't support embeddings well)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class RAGService {
  static async search(businessId: string, query: string, topK = 5): Promise<string> {
    try {
      // 1. Generate embedding for query
      const embedding = await Promise.race([
        this.getEmbedding(query),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Embedding timeout')), 5000)
        )
      ]);
      
      // 2. Query Pinecone with timeout
      const results = await Promise.race([
        pineconeIndex.namespace(businessId).query({
          vector: embedding,
          topK,
          includeMetadata: true,
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Pinecone timeout')), 3000)
        )
      ]);
      
      // 3. Format results as context
      if (!results.matches?.length) return '';
      
      return results.matches
        .map(m => m.metadata?.text as string)
        .filter(Boolean)
        .join('\n\n');
    } catch (error) {
      console.log('[RAGService] Search failed (continuing without RAG):', error instanceof Error ? error.message : 'Unknown error');
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
