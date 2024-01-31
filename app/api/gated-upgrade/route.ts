import { FrameRequest, getFrameAccountAddress, getFrameMessage } from '@coinbase/onchainkit';
import { NextRequest, NextResponse } from 'next/server';
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains';
import { createPublicClient, createWalletClient, http } from 'viem';
import { Reaction, EtherscanResponse } from '../../types';

import LandSeaSkyNFT from '../constants/base/LandSeaSkyNFT.json';
const TARGET_URL = "https://base-mints-frame.vercel.app/api/gated-upgrade";

require('dotenv').config();

const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
const PROVIDER_URL = process.env.PROVIDER_URL_MAINNET;
const NEYNAR_API_PRIVATE_KEY = process.env.NEYNAR_API_PRIVATE_KEY;
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY;

/**
 * @dev Optional: Check if the Farcaster user has recast the Frame
 * 
 * We'll only check the last 100 recasts for the user
 */
async function checkForRecast(fid: number ): Promise<boolean> {
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
          if (frame.post_url === TARGET_URL) {
            found = true;
            break;
          }
        }
      }
      if (found) {
        console.log(`Found recast for farcaster user ${fid}`);
        break;
      }
    }
  }
  console.log(`Did we find recast for farcaster user ${fid}: ${found}`)
  return found;
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
    chain: base,
    transport: http(PROVIDER_URL as string)
  });

  const publicClient = createPublicClient({
    chain: base,
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
    console.error("Failure getting minted status");
    console.error(err);
  }

  const imgUrl = `https://land-sea-and-sky.vercel.app/api/images/nft?address=${accountAddress}&minted=${minted}`;

  if (minted) {
    console.log(`Address ${accountAddress} has minted`);
    let upgraded = false;
    let tokenId = "";
    try {
      // TODO: This is also done in the image route, so we should probably refactor this
      // Find out of the address still owns the NFT, and if so, what the token ID is
      const API_URL = `https://api.basescan.org/api?module=account&action=tokennfttx&contractaddress=${LandSeaSkyNFT.address}&address=${accountAddress}&sort=asc&apikey=${BASESCAN_API_KEY}`;
      const response = await fetch(API_URL);
      const json: EtherscanResponse = (await response.json()) as EtherscanResponse;
      
      const result = json.result;

      // Create a list of the token IDs where to matches the address
      const tokenIds = result.filter((tx) => tx.to === accountAddress?.toLocaleLowerCase()).map((tx) => tx.tokenID);
      
      // Create a list of the token IDs where from matches the address
      const tokenIdsFrom = result.filter((tx) => tx.from === accountAddress?.toLocaleLowerCase()).map((tx) => tx.tokenID);

      // Remove any token IDS that are in tokenIdsFrom from tokenIds
      const tokenIdsTo = tokenIds.filter((tokenId) => !tokenIdsFrom.includes(tokenId));
      tokenId = tokenIdsTo[0]; // Note:  This doesn't handle the edge case where an address is gifted an nft first, then mints one

      upgraded = !!await publicClient.readContract({
        address: LandSeaSkyNFT.address as `0x${string}`,
        abi: LandSeaSkyNFT.abi,
        functionName: 'upgraded',
        args: [tokenId] 
      });
    } catch (err) {
      console.error("Failure getting upgraded status");
      console.error(err);
    }

    if (upgraded) {
      console.log(`Address ${accountAddress} has upgraded`);
      return new NextResponse(`<!DOCTYPE html><html><head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${imgUrl}" />
      <meta property="fc:frame:button:1" content="You've already upgraded, enjoy!" />
    </head></html>`);
    } else {
      console.log(`Address ${accountAddress} has not upgraded`);
      // Check for a recast
      const recast = await checkForRecast(message?.fid as number);
      if (recast) {
        console.log(`Recast found for ${accountAddress}`);
        // Try to upgrade the NFT
        try {
          console.log(`Upgrading for ${accountAddress}`);
          const { request } = await publicClient.simulateContract({
            account: nftOwnerAccount,
            address: LandSeaSkyNFT.address as `0x${string}`,
            abi: LandSeaSkyNFT.abi,
            functionName: 'upgradeToken',
            args: [tokenId]
          });
          await nftOwnerClient.writeContract(request);
        } catch (err) {
          console.error("Failure upgrading");
          console.error(err);
        }
        return new NextResponse(`<!DOCTYPE html><html><head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${imgUrl}" />
        <meta property="fc:frame:button:1" content="Thanks for upgrading, enjoy your whale!" />
      </head></html>`);
      } else {
        console.log(`No recast found for ${accountAddress}`);
        return new NextResponse(`<!DOCTYPE html><html><head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${imgUrl}" />
        <meta property="fc:frame:button:1" content="Recast, wait a moment, and click again!" />
        <meta property="fc:frame:post_url" content="${TARGET_URL}" />
      </head></html>`);
      }
    }
  } else {
    console.log(`Address ${accountAddress} has not minted`);
    // Try to mint and airdrop the NFT
    try {
      console.log(`Minting for ${accountAddress}`);
      const { request } = await publicClient.simulateContract({
        account: nftOwnerAccount,
        address: LandSeaSkyNFT.address as `0x${string}`,
        abi: LandSeaSkyNFT.abi,
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
      <meta property="fc:frame:image" content="${imgUrl}" />
      <meta property="fc:frame:button:1" content="Thanks for minting, recast and click to upgrade!" />
      <meta property="fc:frame:post_url" content="${TARGET_URL}" />
    </head></html>`);
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = 'force-dynamic';
