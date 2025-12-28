/**
 * Meta API Helpers
 * Functions to interact with Meta's WhatsApp and Instagram APIs
 */

import crypto from 'crypto';

interface SendWhatsAppParams {
  accessToken: string;
  phoneNumberId: string;
  to: string;
  text: string;
}

interface SendInstagramParams {
  accessToken: string;
  recipientId: string;
  text: string;
  pageId?: string;
}

/**
 * Send a WhatsApp message via Meta Graph API
 */
export async function sendWhatsAppMessage(params: SendWhatsAppParams) {
  const { accessToken, phoneNumberId, to, text } = params;

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Send an Instagram DM via Meta Graph API
 */
export async function sendInstagramMessage(params: SendInstagramParams) {
  const { accessToken, recipientId, text, pageId } = params;

  // Instagram uses page-scoped ID, so we need the page ID
  const endpoint = pageId 
    ? `https://graph.facebook.com/v18.0/${pageId}/messages`
    : 'https://graph.facebook.com/v18.0/me/messages';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Instagram API error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Verify Meta webhook signature
 */
export function verifyWebhookSignature(body: string, signature: string | null): boolean {
  if (!signature) return false;

  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error('META_APP_SECRET not configured');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(body)
    .digest('hex');

  // Meta sends signature as "sha256=<hash>"
  const receivedHash = signature.replace('sha256=', '');
  
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(receivedHash)
  );
}

