import crypto from "crypto";

interface CinetPayConfig {
  siteId: string;
  apiKey: string;
  secretKey: string;
  baseUrl: string;
}

interface PaymentInitRequest {
  amount: number;
  currency: string;
  transactionId: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
  cancelUrl: string;
  channels: string;
  metadata?: Record<string, any>;
}

interface CinetPayResponse {
  code: string;
  message: string;
  data?: {
    payment_url: string;
    payment_token: string;
  };
}

class CinetPayService {
  private config: CinetPayConfig;

  constructor() {
    this.config = {
      siteId: process.env.CINETPAY_SITE_ID || "",
      apiKey: process.env.CINETPAY_API_KEY || "",
      secretKey: process.env.CINETPAY_SECRET_KEY || "",
      baseUrl:
        process.env.CINETPAY_BASE_URL || "https://api-checkout.cinetpay.com",
    };
  }

  async initializePayment(
    request: PaymentInitRequest
  ): Promise<CinetPayResponse> {
    try {
      const payload = {
        apikey: this.config.apiKey,
        site_id: this.config.siteId,
        transaction_id: request.transactionId,
        amount: request.amount,
        currency: request.currency,
        description: request.description,
        customer_name: request.customerName,
        customer_surname: "",
        customer_email: request.customerEmail,
        customer_phone_number: request.customerPhone,
        customer_address: "",
        customer_city: "",
        customer_country: "CI", // Côte d'Ivoire
        customer_state: "",
        customer_zip_code: "",
        return_url: request.returnUrl,
        notify_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/mobile-money/callback`,
        cancel_url: request.cancelUrl,
        channels: request.channels,
        metadata: JSON.stringify(request.metadata || {}),
      };

      const response = await fetch(`${this.config.baseUrl}/v2/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("CinetPay initialization error:", error);
      return {
        code: "500",
        message: "Payment initialization failed",
      };
    }
  }

  generateTransactionId(prefix = "TXN"): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  validateWebhookSignature(payload: any, signature: string): boolean {
    try {
      // CinetPay signature validation logic
      const expectedSignature = this.generateSignature(payload);
      return signature === expectedSignature;
    } catch (error) {
      console.error("Signature validation error:", error);
      return false;
    }
  }

  private generateSignature(payload: any): string {
    // Generate signature based on CinetPay documentation
    const data = `${payload.cpm_site_id}${payload.cpm_trans_id}${payload.cpm_amount}${this.config.secretKey}`;
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  generateHash(data: string): string {
    return crypto
      .createHash("sha256")
      .update(data + this.config.secretKey)
      .digest("hex");
  }

  async verifyTransaction(transactionId: string): Promise<CinetPayResponse> {
    try {
      const payload = {
        apikey: this.config.apiKey,
        site_id: this.config.siteId,
        transaction_id: transactionId,
      };

      const response = await fetch(`${this.config.baseUrl}/v2/payment/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      return await response.json();
    } catch (error) {
      console.error("Transaction verification error:", error);
      return {
        code: "500",
        message: "Transaction verification failed",
      };
    }
  }
}

export const cinetpayService = new CinetPayService();
