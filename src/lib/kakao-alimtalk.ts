import { SolapiMessageService } from 'solapi';
import { formatPrice } from './format';

const solapi = new SolapiMessageService(
  process.env.SOLAPI_API_KEY ?? '',
  process.env.SOLAPI_API_SECRET ?? '',
);

const PFID = process.env.SOLAPI_PFID ?? '';
const SENDER = process.env.SOLAPI_SENDER ?? '';

// 알림톡 템플릿 ID — Solapi 대시보드에서 등록 후 env에 입력
const TEMPLATE_IDS: Record<string, string> = {
  order_complete: process.env.SOLAPI_TPL_ORDER_COMPLETE ?? '',
  deposit_confirmed: process.env.SOLAPI_TPL_DEPOSIT_CONFIRMED ?? '',
  shipping_started: process.env.SOLAPI_TPL_SHIPPING_STARTED ?? '',
};

interface AlimtalkData {
  orderId: string;
  name: string;
  phone: string;
  totalAmount: number;
  trackingNumber?: string;
}

export async function sendAlimtalk(
  templateType: keyof typeof TEMPLATE_IDS,
  data: AlimtalkData,
): Promise<void> {
  const templateId = TEMPLATE_IDS[templateType];

  // 템플릿 ID가 없으면 (아직 심사 전) 건너뛰기
  if (!templateId || !PFID || !SENDER) {
    console.warn(`[alimtalk] Skipped: missing config for ${templateType}`);
    return;
  }

  const to = data.phone.replace(/[^0-9]/g, '');

  const variables: Record<string, string> = {
    '#{고객명}': data.name,
    '#{주문번호}': data.orderId,
    '#{결제금액}': formatPrice(data.totalAmount) + '원',
  };

  if (data.trackingNumber) {
    variables['#{운송장번호}'] = data.trackingNumber;
  }

  await solapi.send({
    to,
    from: SENDER,
    kakaoOptions: {
      pfId: PFID,
      templateId,
      variables,
    },
  });

  const maskedPhone = to.slice(0, 3) + '****' + to.slice(-4);
  console.log(`[alimtalk] Sent ${templateType} to ${maskedPhone} for order ${data.orderId}`);
}
