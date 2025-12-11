
import { Agreement, AgreementStatus, AppSettings } from "../types";

export const checkAndSendNotifications = async (
  agreements: Agreement[],
  settings: AppSettings
): Promise<{ sent: number; errors: number; details: string[] }> => {
  let sentCount = 0;
  let errorCount = 0;
  const details: string[] = [];

  // Filter for Expiring Soon (within 30 days) or Expired
  const targets = agreements.filter(a => {
    // Check if exactly 30 days remaining for "Expiring Soon" alert
    // Or if it is already expired (and maybe we haven't notified yet - in a real app we'd track 'notified' state)
    // For this dashboard, we will process all marked as EXPIRING_SOON or EXPIRED
    return a.status === AgreementStatus.EXPIRING_SOON || a.status === AgreementStatus.EXPIRED;
  });

  if (targets.length === 0) {
    return { sent: 0, errors: 0, details: ["No agreements require notification."] };
  }

  for (const agreement of targets) {
    const isExpired = agreement.status === AgreementStatus.EXPIRED;
    
    // Construct Message
    const message = isExpired
      ? `🚨 *URGENT: Agreement Expired*\n\nReference: ${agreement.type}\nParty: ${agreement.partyB}\nExpired On: ${agreement.expiryDate}\n\nPlease take immediate action via the Skynet Dashboard.`
      : `⚠️ *Agreement Expiring Soon*\n\nReference: ${agreement.type}\nParty: ${agreement.partyB}\nExpires On: ${agreement.expiryDate}\n\nThis agreement expires in less than 60 days. Please initiate renewal.`;

    // 1. Send WhatsApp
    if (settings.waInstanceId && settings.waAccessToken && settings.adminPhone) {
      try {
        await sendWhatsApp(settings, settings.adminPhone, message);
        details.push(`WhatsApp sent for ${agreement.partyB}`);
        sentCount++;
      } catch (e) {
        console.error("WA Failed", e);
        details.push(`WhatsApp failed for ${agreement.partyB}`);
        errorCount++;
      }
    }

    // 2. Send Email (Simulation)
    if (settings.adminEmail) {
      try {
        await sendEmailMock(settings.adminEmail, `LegalEagle Alert: ${agreement.partyB}`, message);
        details.push(`Email sent for ${agreement.partyB}`);
        sentCount++;
      } catch (e) {
        console.error("Email Failed", e);
        errorCount++;
      }
    }
  }

  return { sent: sentCount, errors: errorCount, details };
};

const sendWhatsApp = async (settings: AppSettings, to: string, message: string) => {
  // Constructing URL based on common gateway patterns for flyencart or similar
  // URL provided: https://flyencart.in/api/send
  // Common params: number, type=text, message, instance_id, access_token
  
  const url = new URL(settings.waApiUrl);
  url.searchParams.append("number", to);
  url.searchParams.append("type", "text");
  url.searchParams.append("message", message);
  url.searchParams.append("instance_id", settings.waInstanceId);
  url.searchParams.append("access_token", settings.waAccessToken);

  // Note: In a real production environment, calling 3rd party APIs directly from frontend 
  // exposes credentials. This should be done via a backend proxy.
  // For this demo, we call directly.
  
  try {
    const response = await fetch(url.toString());
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error("Failed to connect to WhatsApp Gateway");
  }
};

const sendEmailMock = async (to: string, subject: string, body: string) => {
  // Simulating an email service API call
  console.log(`[EMAIL SERVICE] Sending to: ${to}`);
  console.log(`[Subject]: ${subject}`);
  console.log(`[Body]: ${body}`);
  
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  return true;
};
