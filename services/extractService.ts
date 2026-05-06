type ReceiptExtractResult = {
  total_amount?: number | null;
};

const DEFAULT_EXTRACT_URL = process.env.EXPO_PUBLIC_RECEIPT_EXTRACT_URL;
const RECEIPT_EXTRACT_URL =  DEFAULT_EXTRACT_URL;

export async function extractReceiptData(imageUri: string): Promise<ReceiptExtractResult> {
  if (!RECEIPT_EXTRACT_URL) {
    throw new Error('Missing EXPO_PUBLIC_RECEIPT_EXTRACT_URL');
  }

  const formData = new FormData();
  formData.append(
    'image',
    {
      uri: imageUri,
      name: 'receipt.jpg',
      type: 'image/jpeg',
    } as any
  );

  const response = await fetch(RECEIPT_EXTRACT_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Receipt extraction failed');
  }

  return (await response.json()) as ReceiptExtractResult;
}
