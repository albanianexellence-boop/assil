export interface TransferPending {
  hash: string;
  type?: number;
  accessList?: any;
  blockHash?: string | null;
  blockNumber?: number | null;
  transactionIndex?: number | null;
  confirmations?: number;
  from?: string;
  gasPrice?: any;
  maxPriorityFeePerGas?: any;
  maxFeePerGas?: any;
  gasLimit?: any;
  to?: string;
  value?: any;
  nonce?: number;
  data?: string;
  r?: string;
  s?: string;
  v?: number;
  creates?: any;
  chainId?: number;
}
