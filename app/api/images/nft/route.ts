import { NextRequest, NextResponse } from 'next/server';
import { EtherscanResponse } from '../../../types';

import LandSeaSkyNFT from '../../constants/base/LandSeaSkyNFT.json';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

import sharp from 'sharp';

const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY;
const PROVIDER_URL = process.env.PROVIDER_URL_MAINNET;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const queryParams = url.searchParams;

  const { minted, address } = Object.fromEntries(queryParams.entries());



  async function convertSvgStringToPng(svgString: string): Promise<Buffer> {
    try {
      // Convert the SVG string to a Buffer
      const svgBuffer = Buffer.from(svgString);

      // Use Sharp to convert the SVG buffer to a PNG buffer
      const pngBuffer = await sharp(svgBuffer)
        .png() // Convert to PNG
        .toBuffer(); // Output as a Buffer

      return pngBuffer;
    } catch (error) {
      console.error('Error converting SVG to PNG:', error);
      throw error; // Or handle the error as needed
    }
  }
  
  async function frameSvgStringToPngBlob(originalSvgString: string): Promise<Buffer> {
    // Original SVG framing code
    const originalSize: number = 1024;
    const newWidth: number = originalSize * 1.91;
    const centerX: number = newWidth / 2;
    const clipStartX: number = centerX - 512;

    const framedSvgString: string = `
      <svg width="${newWidth}" height="${originalSize}" viewBox="0 0 ${newWidth} ${originalSize}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="clip">
            <rect x="${clipStartX}" width="1024" height="${originalSize}" />
          </clipPath>
        </defs>
        <g clip-path="url(#clip)">
          ${originalSvgString}
        </g>
      </svg>
    `;

    return await convertSvgStringToPng(framedSvgString);
  }



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
    const API_URL = `https://api.basescan.org/api?module=account&action=tokennfttx&contractaddress=${LandSeaSkyNFT.address}&address=${address}&sort=asc&apikey=${BASESCAN_API_KEY}`;
    const response = await fetch(API_URL);
    const json: EtherscanResponse = (await response.json()) as EtherscanResponse;
    
    const result = json.result;

    // Create a list of the token IDs where to matches the address
    const tokenIds = result.filter((tx) => tx.to === address.toLocaleLowerCase()).map((tx) => tx.tokenID);
    
    // Create a list of the token IDs where from matches the address
    const tokenIdsFrom = result.filter((tx) => tx.from === address.toLocaleLowerCase()).map((tx) => tx.tokenID);

    // Remove any token IDS that are in tokenIdsFrom from tokenIds
    const tokenIdsTo = tokenIds.filter((tokenId) => !tokenIdsFrom.includes(tokenId));

    if (tokenIdsTo.length === 0) {
      const img = await fetch('https://base-mints-frame.vercel.app/gave-me-away.png').then((res) => res.blob());
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
        chain: base,
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

      // Decode the base64 encoded JSON
      const tokenMetadataJson = JSON.parse(atob(tokenMetadata.split(',')[1]));
      
      // Then decode the base64 encoded svg image
      const svg = atob(tokenMetadataJson.image.split(',')[1]);
      
      // Turn the svg to a png
      const pngBuffer = await frameSvgStringToPngBlob(svg);
      console.log('pngBuffer.length:', pngBuffer.length);
      
      return new Response(pngBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'max-age=10',
        }
      });
    }
  }
}
