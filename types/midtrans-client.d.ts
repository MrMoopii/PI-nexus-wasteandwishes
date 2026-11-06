declare module "midtrans-client" {
  export interface ClientOptions {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  export interface SnapTransactionParameters {
    transaction_details: {
      order_id: string;
      gross_amount: number;
    };
    customer_details: {
      first_name: string;
      email: string;
      phone?: string;
    };
    item_details: Array<{
      id: string;
      price: number;
      quantity: number;
      name: string;
    }>;
  }

  export interface SnapTransactionResponse {
    token: string;
    redirect_url: string;
  }

  export interface TransactionNotification {
    order_id: string;
    transaction_status: string;
    fraud_status?: string;
    transaction_id?: string;
    status_code: string;
    gross_amount: string;
  }

  export class Snap {
    constructor(options: ClientOptions);
    createTransaction(
      parameters: SnapTransactionParameters,
    ): Promise<SnapTransactionResponse>;
    transaction: {
      notification(
        payload: Record<string, unknown>,
      ): Promise<TransactionNotification>;
    };
  }

  const midtransClient: { Snap: typeof Snap };
  export default midtransClient;
}
