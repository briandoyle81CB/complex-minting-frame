/**
 * Follow to mint, mint using custom ERC-721
 */

import { FrameRequest, getFrameAccountAddress, getFrameMessage } from '@coinbase/onchainkit';
import { NextRequest, NextResponse } from 'next/server';
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains';
import { createPublicClient, createWalletClient, http } from 'viem';

import LimitedAirdropMinter from '../constants/sepolia/LimitedAirdropMinter.json';
import { User } from '../../types';
const TARGET_ADDRESS = "https://base-mints-frame.vercel.app/api/follow-gated-mint";

require('dotenv').config();

const PROVIDER_URL = process.env.PROVIDER_URL_TESTNET;
const NEYNAR_API_PRIVATE_KEY = process.env.NEYNAR_API_PRIVATE_KEY;
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
// const CASTER_FID = 10426; // Brian Doyle
const CASTER_FID = 12142; // *base: The user sending the frame, who needs to be followed

function checkForFollower(fid: number, followers: User[]): boolean {
  let found = false;
  for (const follower of followers) {
    // console.log(`Checking follower ${follower.fid}`);
    if (follower.fid === fid) {
      found = true;
      break;
    }
  }
  return found;
}

async function getIfFollowed(fid: number) {
  let lastCursor;
  let calls = 0;
  do
  {
    const { followers, cursor } = await callIfFollowed(fid, lastCursor);
    calls++;
    console.log(`Call ${calls} to getIfFollowed`);
    lastCursor = cursor;

    let found = checkForFollower(fid, followers);
    if (found) {
      return found;
    }
    console.log("lastCursor: ", lastCursor);
  } while (lastCursor);
  
  return false;
}

async function callIfFollowed(fid: number, cursor: string | undefined) {
  let followers: any;

  let API_URL = `https://api.neynar.com/v1/farcaster/followers?fid=${CASTER_FID}&viewerFid=${CASTER_FID}&limit=150`
  if (cursor) {
    API_URL += `&cursor=${cursor}`;
  }
  
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
    const followersJson = await response.json();
    followers = followersJson?.result?.users;
    cursor = followersJson?.result?.next?.cursor;
  } else {
    console.error(`Error fetching reactions from neynar`);
    console.error(response);
  }
  
  return {followers, cursor};
}

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
     * @dev Optional: Check if the Farcaster user follows the caster
     * 
     */

    const fid = message?.fid;
    // const fid = 1;
    console.log(`fid: ${fid}`);
      
    let found = false;

    if (fid) {
      console.log(`Checking if ${fid} follows ${CASTER_FID}`);
      found = await getIfFollowed(fid);
      console.log(`Did we find recast for farcaster user ${fid}: ${found}`)
    }
    
    if (!found) {
      return new NextResponse(`<!DOCTYPE html><html><head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${bwUrl}" />
      <meta property="fc:frame:button:1" content="Follow, wait a moment, and click again!" />
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
