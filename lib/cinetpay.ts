import crypto from "crypto"

interface CinetPayConfig {
  apiKey: string
  siteId: string
  secretKey: string
  baseUrl: string
}

interface PaymentRequest {
  amount: number
  currency: string
  transactionId: string
  description: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  returnUrl: string
  cancelUrl: string
  channels?: string
  metadata?: Record<string, any>
}

interface PaymentResponse {
  code: string
  message: string
  description: string
  data: {
    payment_url: string
    payment_token: string
  }
}

interface VerificationResponse {
  code: string
  message: string
  data: {
    amount: number
    currency: string
    status: string
    payment_method: string
    description: string
    operator_id: string
    payment_date: string
  }
}

export class CinetPayService {
  private config: CinetPayConfig

  constructor() {
    this.config = {
      apiKey: process.env.CINETPAY_API_KEY || "",
      siteId: process.env.CINETPAY_SITE_ID || "",
      secretKey: process.env.CINETPAY_SECRET_KEY || "",
      baseUrl: process.env.CINETPAY_BASE_URL || "https://api-checkout.cinetpay.com",
    }

    if (!this.config.apiKey || !this.config.siteId || !this.config.secretKey) {
      console.warn("CinetPay configuration is incomplete. Please check your environment variables.")
    }
  }

  /**
   * Initialise un paiement CinetPay
   */
  async initializePayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      const url = `${this.config.baseUrl}/v2/payment`

      const payload = {
        apikey: this.config.apiKey,
        site_id: this.config.siteId,
        transaction_id: paymentData.transactionId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        description: paymentData.description,
        customer_name: paymentData.customerName,
        customer_email: paymentData.customerEmail,
        customer_phone_number: paymentData.customerPhone || "",
        return_url: paymentData.returnUrl,
        cancel_url: paymentData.cancelUrl,
        channels: paymentData.channels || "ALL",
        notify_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/subscription/webhook`,
        metadata: JSON.stringify(paymentData.metadata || {}),
      }

      console.log("Initializing CinetPay payment with payload:", {
        ...payload,
        apikey: "[REDACTED]",
        site_id: "[REDACTED]",
      })

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("CinetPay API error:", errorText)
        throw new Error(`CinetPay API error: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      console.log("CinetPay payment initialized:", data)

      return data as PaymentResponse
    } catch (error) {
      console.error("Error initializing CinetPay payment:", error)
      throw error
    }
  }

  /**
   * Vérifie le statut d'un paiement
   */
  async verifyPayment(transactionId: string): Promise<VerificationResponse> {
    try {
      const url = `${this.config.baseUrl}/v2/payment/check`

      const payload = {
        apikey: this.config.apiKey,
        site_id: this.config.siteId,
        transaction_id: transactionId,
      }

      console.log("Verifying CinetPay payment:", { transactionId })

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("CinetPay verification error:", errorText)
        throw new Error(`CinetPay verification error: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      console.log("CinetPay payment verification result:", data)

      return data as VerificationResponse
    } catch (error) {
      console.error("Error verifying CinetPay payment:", error)
      throw error
    }
  }

  /**
   * Valide la signature du webhook CinetPay
   */
  validateWebhookSignature(payload: any, signature: string): boolean {
    try {
      // CinetPay utilise une signature basée sur le cip_trans_id et la clé secrète
      const dataToSign = `${payload.cpm_trans_id}${this.config.secretKey}`
      const computedSignature = crypto.createHash("sha256").update(dataToSign).digest("hex")

      return computedSignature === signature
    } catch (error) {
      console.error("Error validating webhook signature:", error)
      return false
    }
  }

  /**
   * Génère un ID de transaction unique
   */
  generateTransactionId(prefix = "TRX"): string {
    const timestamp = Date.now().toString()
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    return `${prefix}_${timestamp}_${random}`
  }
}

// Singleton instance
export const cinetpayService = new CinetPayService()
