/**
 * Follow to mint, mint using custom ERC-721
 */

import { FrameRequest, getFrameAccountAddress, getFrameMessage } from '@coinbase/onchainkit';
import { NextRequest, NextResponse } from 'next/server';
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains';
import { createPublicClient, createWalletClient, http } from 'viem';

import LimitedAirdropMinter from '../constants/base/getOnchainToday.json';
import { call } from 'viem/_types/actions/public/call';

const TARGET_ADDRESS = "https://base-mints-frame.vercel.app/api/get-onchain-today";

require('dotenv').config();

// CRITICAL UPDATE FOR MAINNET!!!
const PROVIDER_URL = process.env.PROVIDER_URL_MAINNET;
const NEYNAR_API_PRIVATE_KEY = process.env.NEYNAR_API_PRIVATE_KEY;
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
// const CASTER_FID = 10426; // Brian Doyle
const CASTER_FID = 12142; // @Base: The user sending the frame, who needs to be followed

 
async function callIfFollowed(fid: number): Promise<boolean> {
  let follows = false;
  const API_URL = `https://api.neynar.com/v1/farcaster/user?fid=${CASTER_FID}&viewerFid=${fid}`;
  // console.log(API_URL);
  
  // const API_URL_2 = 'https://api.neynar.com/v1/farcaster/user?fid=12142&viewerFid=10426';
  // console.log(API_URL_2);

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
    console.error(`GET ONCHAIN TODAY: non-200 status returned from neynar : ${response.status}`);
  }
  
  if (response.ok) {
    console.log(`GET ONCHAIN TODAY: Response OK`);
    // console.log(response);
    const followsJson = await response.json();
    console.log("followsJson%%%%", followsJson?.result);
    follows = followsJson?.result?.user?.viewerContext?.following; // The viewer of this info is following the CASTER_FID

    console.log(`GET ONCHAIN TODAY: Is ${fid} following ${CASTER_FID}: ${follows}`)
  } else {
    console.error(`GET ONCHAIN TODAY: Error fetching reactions from neynar`);
    console.error(response);
  }
  
  return follows;
}

async function getResponse(req: NextRequest): Promise<NextResponse> {

  // const test = await callIfFollowed(10426);
  console.log(`GET ONCHAIN TODAY: Test: ${test}`);

  console.log("GET ONCHAIN TODAY: Get Onchain Today");
  
  let accountAddress: string | undefined = '';
  const body: FrameRequest = await req.json();
  const { isValid, message } = await getFrameMessage(body);
  if (isValid) {
    try {
      accountAddress = await getFrameAccountAddress(message, { NEYNAR_API_KEY: 'NEYNAR_API_DOCS' }) as string;
    } catch (err) {
      console.log("GET ONCHAIN TODAY: Failed to get address");
      console.error(err);
      // For local testing
      // accountAddress = '0x69a5B3aE8598fC5A5419eaa1f2A59Db2D052e346';
      // console.log("Using backup address");
    }
  }
  
  const nftOwnerAccount = privateKeyToAccount(WALLET_PRIVATE_KEY as `0x${string}`);
  
  const nftOwnerClient = createWalletClient({
    account: nftOwnerAccount,
    chain: base,
    transport: http(PROVIDER_URL as string)
  });

  const publicClient = createPublicClient({
    chain: base,
    transport: http(PROVIDER_URL as string)
  });

  let minted = false;

  console.log(`GET ONCHAIN TODAY: Account address: ${accountAddress}`);

  try {
    minted = !!await publicClient.readContract({
      address: LimitedAirdropMinter.address as `0x${string}`,
      abi: LimitedAirdropMinter.abi,
      functionName: 'minted',
      args: [accountAddress]
    });
    console.log(`GET ONCHAIN TODAY: Minted status: ${minted}`);
  } catch (err) {
    console.error("GET ONCHAIN TODAY: Failure getting minted status");
    console.error(err);
  }

  const beforeMintUrl = `https://base-mints-frame.vercel.app/get-onchain-today.png`;
  const colorUrl = `https://base-mints-frame.vercel.app/get-onchain-today-minted.png`;

  if (minted) {
    return new NextResponse(`<!DOCTYPE html><html><head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${colorUrl}" />
    <meta property="fc:frame:button:1" content="Thanks for getting onchain!" />
  </head></html>`);
  } else {
    /**
     * @dev Optional: Check if the Farcaster user follows the caster
     * 
     */

    const fid = message?.fid;
    // const fid = 1;
    console.log(`GET ONCHAIN TODAY: fid: ${fid}`);
      
    let found = false;

    if (fid) {
      found = await callIfFollowed(fid);
    }

    console.log(`GET ONCHAIN TODAY: Did we find folow for farcaster user ${fid}: ${found}`)
    
    if (!found) {
      return new NextResponse(`<!DOCTYPE html><html><head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${beforeMintUrl}" />
      <meta property="fc:frame:button:1" content="Follow us & retry!" />
      <meta property="fc:frame:post_url" content="${TARGET_ADDRESS}" />
    </head></html>`);
    } else {
      // Try to mint and airdrop the NFT
      try {
        console.log(`GET ONCHAIN TODAY: Minting for ${accountAddress}`);
        const { request } = await publicClient.simulateContract({
          account: nftOwnerAccount,
          address: LimitedAirdropMinter.address as `0x${string}`,
          abi: LimitedAirdropMinter.abi,
          functionName: 'mintFor',
          args: [accountAddress]
        });
        await nftOwnerClient.writeContract(request);
      } catch (err) {
        console.error("GET ONCHAIN TODAY: Failure minting");
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
