// @dev values taken from sample response
export type EtherscanEventResponse = {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  from: string;
  contractAddress: string;
  to: string;
  tokenID: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  confirmations: string;
};

export type EtherscanResponse = {
  status: '0' | '1';
  message: string;
  result: EtherscanEventResponse[];
};

// Define interfaces to represent the JSON structure
export interface Reaction {
  cast: Cast;
}

export interface Cast {
  frames?: Frame[];
}

export interface Frame {
  post_url: string;
}

export interface User {
  fid: number;
}
