import { FrameRequest, getFrameAccountAddress, getFrameMessage } from '@coinbase/onchainkit';
import { NextRequest, NextResponse } from 'next/server';
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains';
import { createPublicClient, createWalletClient, http } from 'viem';
import { Reaction, Cast, Frame } from '../../../app/types';

import LimitedAirdropMinter from '../constants/sepolia/LimitedAirdropMinter.json';
const TARGET_ADDRESS = "https://base-mints-frame.vercel.app/api/gated-mint";

require('dotenv').config();

const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
const PROVIDER_URL = process.env.PROVIDER_URL;
const NEYNAR_API_PRIVATE_KEY = process.env.NEYNAR_API_PRIVATE_KEY;

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
      address: LimitedAirdropMinter.address as `0x${string}`,
      abi: LimitedAirdropMinter.abi,
      functionName: 'minted',
      args: [accountAddress]
    });
  } catch (err) {
    console.error("Failure getting minted status");
    console.error(err);
  }

  const bwUrl = `https://base-mints-frame.vercel.app/test-bw.png`;
  const colorUrl = `https://base-mints-frame.vercel.app/test-color.png`;

  if (minted) {
    return new NextResponse(`<!DOCTYPE html><html><head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${colorUrl}" />
    <meta property="fc:frame:button:1" content="You've already minted!" />
  </head></html>`);
  } else {
    /**
     * @dev Optional: Check if the Farcaster user has recast the Frame
     * 
     * We'll only check the last 100 recasts for the user
     */

    const fid = message?.fid;
    console.log(`fid: ${fid}`);
      
    let reactions: any;
    
    // DEBUG
    // reactions = DebugData.reactions;
    const API_URL = `https://api.neynar.com/v2/farcaster/reactions/user?fid=${fid}&type=recasts&limit=50`
    const options = {
      method: 'GET',
      url: API_URL,
      headers: {
        accept: 'application/json',
        api_key: NEYNAR_API_PRIVATE_KEY as string
      }
    };
    const response = await fetch(options.url, { headers: options.headers });
    if (response.status !== 200) {
      console.error(`non-200 status returned from neynar : ${response.status}`);
    }
      
    if (response.ok) {
      const reactionsJson = await response.json();
      reactions = reactionsJson?.reactions;
    } else {
      console.error(`Error fetching reactions from neynar`);
      console.error(response);
    }

    let found = false;

    if (reactions && Array.isArray(reactions)) {
      for (const reaction of reactions as Reaction[]) {
        if (reaction?.cast?.frames) {
          for (const frame of reaction.cast.frames) {
            if (frame.post_url === TARGET_ADDRESS) {
              found = true;
              break;
            }
          }
        }
        if (found) {
          console.log(`Found recast for ${accountAddress}, farcaster user ${fid}`);
          break;
        }
      }
    }

    if (!found) {
      return new NextResponse(`<!DOCTYPE html><html><head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${bwUrl}" />
      <meta property="fc:frame:button:1" content="Recast, wait a moment, and click again!" />
      <meta property="fc:frame:post_url" content="${TARGET_ADDRESS}" />
    </head></html>`);
    } else {
      // Try to mint and airdrop the NFT
      try {
        console.log(`Minting for ${accountAddress}`);
        const { request } = await publicClient.simulateContract({
          account: nftOwnerAccount,
          address: LimitedAirdropMinter.address as `0x${string}`,
          abi: LimitedAirdropMinter.abi,
          functionName: 'mintFor',
          args: [accountAddress]
        });
        await nftOwnerClient.writeContract(request);
      } catch (err) {
        console.error("Failure minting");
        console.error(err);
      }
      return new NextResponse(`<!DOCTYPE html><html><head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${colorUrl}" />
      <meta property="fc:frame:button:1" content="Thanks for Minting!" />
    </head></html>`);
    }
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = 'force-dynamic';
