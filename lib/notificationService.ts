import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';

export interface NotificationPayload {
  targetType: 'ALL_BARBERS' | 'ALL_USERS' | 'ALL_EMPLOYEES' | 'CUSTOM';
  customRecipients?: string[];
  title: string;
  body: string;
  type: string;
  dryRun: boolean;
}

export interface NotificationResult {
  success: boolean;
  targetType: string;
  totalTargets: number;
  inAppCreated: number;
  fcmSent: number;
  fcmFailed: number;
  fcmSkipped: number;
  totalErrors: number;
  durationMs: number;
  message: string;
}

/**
 * Send notification via CMS
 * Production-only (dryRun: false)
 */
export async function sendNotificationFromCMS(
  payload: Omit<NotificationPayload, 'dryRun'>
): Promise<NotificationResult> {
  const functions = getFunctions(app);
  const sendCmsNotification = httpsCallable<NotificationPayload, NotificationResult>(
    functions,
    'sendCmsNotification'
  );

  // Always production mode
  const productionPayload: NotificationPayload = {
    ...payload,
    dryRun: false,
  };

  const response = await sendCmsNotification(productionPayload);
  return response.data;
}

/**
 * Get actual recipient count from Firestore
 */
export async function getRecipientCount(
  targetType: 'ALL_BARBERS' | 'ALL_USERS' | 'ALL_EMPLOYEES' | 'CUSTOM',
  customRecipients?: string[]
): Promise<number> {
  const functions = getFunctions(app);
  const getCount = httpsCallable<
    { targetType: string; customRecipients?: string[] },
    { success: boolean; count: number }
  >(functions, 'getRecipientCount');

  const response = await getCount({
    targetType,
    customRecipients,
  });

  return response.data.count;
}
