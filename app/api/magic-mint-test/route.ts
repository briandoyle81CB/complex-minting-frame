/**
 * Follow to mint, mint using custom ERC-721
 */

import { FrameRequest, getFrameAccountAddress, getFrameHtmlResponse, getFrameMessage } from '@coinbase/onchainkit';
import { NextRequest, NextResponse } from 'next/server';
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains';
import { createPublicClient, createWalletClient, http } from 'viem';

import ERC1155ABI from '../constants/base/erc1155.json';

const CONTRACT_ADDRESS = "0xCbD226Ad2Aae2C658063F4E3eF610AAe378513E6";

const bwUrl = `https://base-mints-frame.vercel.app/test-bw.png`;
const colorUrl = `https://base-mints-frame.vercel.app/test-color.png`;

const TARGET_ADDRESS = "https://base-mints-frame.vercel.app/api/magic-mint-test";

require('dotenv').config();

const PROVIDER_URL = process.env.PROVIDER_URL_MAINNET;
const NEYNAR_API_PRIVATE_KEY = process.env.NEYNAR_API_PRIVATE_KEY;
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY;
// const CASTER_FID = 10426; // Brian Doyle
const CASTER_FID = 12142; // *base: The user sending the frame, who needs to be followed
const TOKEN_ID = 0;
 
async function callIfFollowed(fid: number) {
  let follows = false;
  const API_URL = `https://api.neynar.com/v1/farcaster/user?fid=${CASTER_FID}&viewerFid=${fid}`;
  
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
    const followsJson = await response.json();
    follows = followsJson?.result?.user?.viewerContext?.following; // The viewer of this info is following the CASTER_FID
    
  } else {
    console.error(`Error fetching reactions from neynar`);
    console.error(response);
  }
  
  return follows;
}

const MINTED_RESPONSE = getFrameHtmlResponse({
  buttons: [
    { label: "Thanks for Minting!", action: "post_redirect" }
  ],
  image: colorUrl,
  post_url: "https://base-mints-frame.vercel.app/api/redirect"
});


// const MINTED_CONTENT = `<!DOCTYPE html><html><head>
//       <meta property="fc:frame" content="vNext" />
//       <meta property="fc:frame:image" content="${colorUrl}" />
//       <meta property="fc:frame:button:1" content="Thanks for Minting!" />
//       <meta property="fc:frame:button:1:action" content="post_redirect" />
//       <meta property="fc:frame:post_url" content="${'https://base-mints-frame.vercel.app/api/redirect'}" />
//     </head></html>`;

async function getResponse(req: NextRequest): Promise<NextResponse> {
  console.log("Magic Mint Test");
  
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
    chain: base,
    transport: http(PROVIDER_URL as string)
  });

  const publicClient = createPublicClient({
    chain: base,
    transport: http(PROVIDER_URL as string)
  });

  let minted = false;

  try {
    // Find out of the address still owns the NFT, and if so, what the token ID is
    minted = !!await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ERC1155ABI,
      functionName: 'balanceOf',
      args: [accountAddress, TOKEN_ID]
    });
    console.log(`MAGIC MINT TEST: Minted status: ${minted}`);
  } catch (err) {
    console.error("Failure getting minted status");
    console.error(err);
  }

  if (minted) {
    return new NextResponse(MINTED_RESPONSE);
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
      found = await callIfFollowed(fid);
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

      console.log(`Minting for ${accountAddress}`);
      const API_URL = "https://api.wallet.coinbase.com/rpc/v2/bot/mint";
      const options = {
        method: 'POST',
        url: API_URL,
        body: {
          userAddress: accountAddress,
          command: "magic-mint-frame-demo-test"
        }
      };

      const response = await fetch(options.url, { method: options.method, body: JSON.stringify(options.body) });
          
      if (!response.ok) {
        console.error("Failure with magic minting");
        console.error(response);

        return new NextResponse(`<!DOCTYPE html><html><head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${bwUrl}" />
          <meta property="fc:frame:button:1" content="Something went wrong..." />
        </head></html>`);
      }

      return new NextResponse(MINTED_RESPONSE);
    }
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = 'force-dynamic';
