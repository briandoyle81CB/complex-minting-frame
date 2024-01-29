import { NextRequest, NextResponse } from 'next/server';
import { EtherscanResponse } from '../../../types';

import LandSeaSkyNFT from '../../constants/LandSeaSkyNFT.json';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY;
const PROVIDER_URL = process.env.PROVIDER_URL;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const queryParams = url.searchParams;

  const { minted, address } = Object.fromEntries(queryParams.entries());
  console.log({ minted, address });

  if (!minted || !address) {
    const img = await fetch('https://land-sea-and-sky.vercel.app/lss-bw.png').then((res) => res.blob());
    return new NextResponse(img, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'max-age=10',
      }
    });
  } else {
    // Find out of the address still owns the NFT, and if so, what the token ID is
    const API_URL = `https://api-sepolia.basescan.org/api?module=account&action=tokennfttx&contractaddress=${LandSeaSkyNFT.address}&address=${address}&sort=asc&apikey=${BASESCAN_API_KEY}`;
    const response = await fetch(API_URL);
    const json: EtherscanResponse = (await response.json()) as EtherscanResponse;
    
    const result = json.result;

    // Create a list of the token IDs where to matches the address
    const tokenIds = result.filter((tx) => tx.to === address.toLocaleLowerCase()).map((tx) => tx.tokenID);
    
    // Create a list of the token IDs where from matches the address
    const tokenIdsFrom = result.filter((tx) => tx.from === address.toLocaleLowerCase()).map((tx) => tx.tokenID);

    // Remove any token IDS that are in tokenIdsFrom from tokenIds
    const tokenIdsTo = tokenIds.filter((tokenId) => !tokenIdsFrom.includes(tokenId));

    if(tokenIdsTo.length === 0) {
      const img = await fetch('https://land-sea-and-sky.vercel.app/gave-me-away.png').then((res) => res.blob());
      return new NextResponse(img, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'max-age=10',
        }
      });
    } else {
      // Get the actual NFT image from the contract
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(PROVIDER_URL as string)
      });
      
      let tokenMetadata = '';
      try {
        tokenMetadata = await publicClient.readContract({
          address: LandSeaSkyNFT.address as `0x${string}`,
          abi: LandSeaSkyNFT.abi,
          functionName: 'tokenURI',
          args: [tokenIdsTo[0]]
        }) as string;
      } catch (err) {
        console.error(err);
      }

      console.log({ tokenMetadata });

      // Decode the base64 encoded JSON
      const tokenMetadataJson = JSON.parse(atob(tokenMetadata.split(',')[1]));
      
      // Then decode the base64 encoded svg image
      const svg = atob(tokenMetadataJson.image.split(',')[1]);
      
      // Create a blob from the svg
      const img = new Blob([svg], { type: 'image/svg+xml' });

      // Return the blob
      return new NextResponse(img, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'max-age=10',
        }
      });
    }
  }
}
