declare module "@paystack/inline-js" {
  export default class PaystackPop {
    constructor();
    newTransaction(options: {
      key: string;
      email: string;
      amount: number;
      currency?: string;
      ref?: string;
      accessCode?: string;
      phone?: string;
      metadata?: Record<string, unknown>;
      onSuccess: (transaction: { reference: string; status: string }) => void;
      onCancel: () => void;
    }): void;
    resumeTransaction(accessCode: string, options?: Record<string, unknown>): void;
  }
}
