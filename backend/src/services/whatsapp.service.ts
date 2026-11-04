import axios from 'axios';

type PropertyRegistrationNotice = {
  phone: string | null;
  ownerName: string;
  propertyTitle: string;
};

function toWhatsAppAddress(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null;
}

/** Send the pre-approved WhatsApp template after a paid listing is registered. */
export async function sendPropertyRegistrationWhatsApp(
  notice: PropertyRegistrationNotice
): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_GRAPH_API_VERSION;
  const templateName = process.env.WHATSAPP_PROPERTY_REGISTERED_TEMPLATE;
  const recipient = notice.phone ? toWhatsAppAddress(notice.phone) : null;

  if (!accessToken || !phoneNumberId || !apiVersion || !templateName) {
    console.info('[WhatsApp] Registration message skipped: WhatsApp Cloud API is not configured.');
    return;
  }
  if (!recipient) {
    console.warn('[WhatsApp] Registration message skipped: owner phone number is missing or invalid.');
    return;
  }

  try {
    await axios.post(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'template',
        template: {
          name: templateName,
          language: { code: process.env.WHATSAPP_PROPERTY_REGISTERED_LANGUAGE || 'en' },
          components: [{
            type: 'body',
            parameters: [
              { type: 'text', text: notice.ownerName.slice(0, 100) || 'Owner' },
              { type: 'text', text: notice.propertyTitle.slice(0, 100) || 'your property' },
            ],
          }],
        },
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  } catch (error: any) {
    // WhatsApp delivery must not undo a completed payment or listing registration.
    console.error('[WhatsApp] Could not send property registration message:', error?.response?.data || error?.message);
  }
}
