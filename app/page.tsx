/**
 * This page is not compliant with the latest patterns.
 * It needs to be updated.
 * Use follow-gated-mint/page.ts as a reference.
 */

import { getFrameMetadata } from '@coinbase/onchainkit';
import type { Metadata } from 'next';
import { getFrameAccountAddress } from '@coinbase/onchainkit';

// const imageUrl = `https://land-sea-and-sky.vercel.app/api/images/nft`;
const imageUrl = 'https://land-sea-and-sky.vercel.app/test-bw.png';

const frameMetadata = getFrameMetadata({
  buttons: [{ label: 'Recast & Click to Mint' }],
  image: imageUrl,
  post_url: `https://land-sea-and-sky.vercel.app/api/gated-mint`,
});

export const metadata: Metadata = {
  title: 'Land, Sea, and Sky',
  description: 'A complex, fully onchain NFT, minted exclusively from a Frame!',
  openGraph: {
    title: 'Land, Sea, and Sky',
    description: 'A complex, fully onchain NFT, minted exclusively from a Frame!',
    images: [imageUrl],
  },
  other: {
    ...frameMetadata,
  },
};

export default function Page() {
  return (
    <>
      <h1>Land, Sea, and Sky</h1>
    </>
  );
}
