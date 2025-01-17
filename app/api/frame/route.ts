/**
 * This route is not compliant with the latest patterns.
 * It needs to be updated AND MAY BE BROKEN.
 * Use api/follow-gated-mint/route.ts as a reference.
 */

import { FrameRequest, getFrameAccountAddress, getFrameMessage } from '@coinbase/onchainkit';
import { NextRequest, NextResponse } from 'next/server';
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains';
import { createPublicClient, createWalletClient, getContract, http } from 'viem';

import LandSeaSkyNFT from '../constants/sepolia/LandSeaSkyNFT.json';

require('dotenv').config();

const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
const PROVIDER_URL = process.env.PROVIDER_URL;

async function getResponse(req: NextRequest): Promise<NextResponse> {
  let accountAddress: string | undefined = '';
  const body: FrameRequest = await req.json();
  const { isValid, message } = await getFrameMessage(body);
  if (isValid) {
    try {
      accountAddress = await getFrameAccountAddress(message, { NEYNAR_API_KEY: 'NEYNAR_API_DOCS' }) as string;
    } catch (err) {
      console.error(err);
      // For local testing
      // accountAddress = '0x69a5B3aE8598fC5A5419eaa1f2A59Db2D052e346';
      // console.log("Using backup address");
    }
  }
  
  const nftOwnerAccount = privateKeyToAccount(WALLET_PRIVATE_KEY as `0x${string}`);
  
  const nftOwnerClient = createWalletClient({
    account: nftOwnerAccount,
    chain: baseSepolia,
    transport: http(PROVIDER_URL as string)
  });

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(PROVIDER_URL as string)
  });

  let minted = false;

  try {
    minted = !!await publicClient.readContract({
      address: LandSeaSkyNFT.address as `0x${string}`,
      abi: LandSeaSkyNFT.abi,
      functionName: 'minted',
      args: [accountAddress]
    });
  } catch (err) {
    console.error(err);
  }

  const imageUrl = `https://land-sea-and-sky.vercel.app/api/images/nft?minted=${minted}&address=${accountAddress}`;

  if (minted) {
    return new NextResponse(`<!DOCTYPE html><html><head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${imageUrl}" />
    <meta property="fc:frame:button:1" content="You've already minted!" />
  </head></html>`);
  } else {
    // Try to mint and airdrop the NFT
    try {
      const { request } = await publicClient.simulateContract({
        account: nftOwnerAccount,
        address: LandSeaSkyNFT.address as `0x${string}`,
        abi: LandSeaSkyNFT.abi,
        functionName: 'mintFor',
        args: [accountAddress]
      });
      await nftOwnerClient.writeContract(request);
    } catch (err) {
      console.error(err);
    }
    return new NextResponse(`<!DOCTYPE html><html><head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${imageUrl}" />
    <meta property="fc:frame:button:1" content="WIP, but you should have a Testnet NFT" />
  </head></html>`);
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = 'force-dynamic';
