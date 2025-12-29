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

interface SendFacebookParams {
  accessToken: string;
  pageId: string;
  recipientId: string;
  text: string;
}

/**
 * Send a Facebook Page message via Meta Graph API
 */
export async function sendFacebookMessage(params: SendFacebookParams) {
  const { accessToken, pageId, recipientId, text } = params;

  // Debug: Check token type
  console.log('[Facebook] Token preview:', accessToken.substring(0, 20) + '...');
  console.log('[Facebook] Token length:', accessToken.length);
  console.log('[Facebook] Is page token?', accessToken.startsWith('EAA') && accessToken.length > 100);

  // First, verify the token works by checking page info
  try {
    const verifyResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=name,access_token&access_token=${accessToken}`
    );
    const verifyData = await verifyResponse.json();
    if (verifyData.error) {
      console.error('[Facebook] Token verification failed:', verifyData.error);
      throw new Error(`Invalid access token: ${verifyData.error.message}`);
    }
    console.log('[Facebook] Token verified for page:', verifyData.name);
  } catch (verifyError: any) {
    console.error('[Facebook] Token verification error:', verifyError.message);
    throw verifyError;
  }

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        messaging_type: 'RESPONSE',
        message: { text },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('Facebook API error response:', error);
    console.error('Facebook API request URL:', `https://graph.facebook.com/v18.0/${pageId}/messages`);
    console.error('Facebook API request body:', JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }, null, 2));
    
    // Provide helpful error message
    if (error.error?.code === 1) {
      console.error('\n💡 OAuthException code 1 usually means:');
      console.error('   1. Recipient is not a tester/admin of the app (in development mode)');
      console.error('   2. App needs Advanced Access for pages_messaging permission');
      console.error('   3. 24-hour messaging window expired');
      console.error('\n🔧 To fix:');
      console.error('   - Go to Meta Developer Console → Roles → Roles');
      console.error('   - Add the recipient as a Tester');
      console.error('   - OR request Advanced Access for pages_messaging');
    }
    
    throw new Error(`Facebook API error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Send an Instagram DM via Meta Graph API
 */
export async function sendInstagramMessage(params: SendInstagramParams) {
  const { accessToken, recipientId, text, pageId } = params;

  // Instagram uses the page ID endpoint
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
      messaging_type: 'RESPONSE',
      message: { text },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('Instagram API error response:', error);
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

