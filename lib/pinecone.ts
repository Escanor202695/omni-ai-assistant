import { Pinecone } from '@pinecone-database/pinecone';

const pineconeClient = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export const pineconeIndex = pineconeClient.index(process.env.PINECONE_INDEX!);

export default pineconeClient;
