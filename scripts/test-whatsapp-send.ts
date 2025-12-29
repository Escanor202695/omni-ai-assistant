/**
 * Test script to send WhatsApp messages
 * 
 * Usage:
 * 1. Get your access token from the Integration table (decrypt it)
 * 2. Get your phone number ID from Meta App dashboard
 * 3. Run: npx tsx scripts/test-whatsapp-send.ts
 */

import { sendWhatsAppMessage } from '../lib/integrations/meta';

// Replace these with your actual values
const ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN_HERE'; // Get from Integration table, decrypt it
const PHONE_NUMBER_ID = 'YOUR_PHONE_NUMBER_ID_HERE'; // From Meta App → WhatsApp → API Setup
const TO_PHONE_NUMBER = '8801517310359'; // Recipient phone number (with country code, no +)

async function testSendMessage() {
  try {
    console.log('Sending WhatsApp message...');
    console.log('To:', TO_PHONE_NUMBER);
    console.log('Phone Number ID:', PHONE_NUMBER_ID);

    const result = await sendWhatsAppMessage({
      accessToken: ACCESS_TOKEN,
      phoneNumberId: PHONE_NUMBER_ID,
      to: TO_PHONE_NUMBER,
      text: 'Hello! This is a test message from Omni AI Assistant. 🚀',
    });

    console.log('✅ Message sent successfully!');
    console.log('Response:', JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('❌ Error sending message:', error.message);
    if (error.message.includes('Invalid OAuth')) {
      console.error('   → Your access token might be expired or invalid');
      console.error('   → Try reconnecting the integration');
    }
    if (error.message.includes('phone_number_id')) {
      console.error('   → Check that PHONE_NUMBER_ID is correct');
    }
  }
}

testSendMessage();

