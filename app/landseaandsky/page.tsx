/**
 * This page is not compliant with the latest patterns.
 * It needs to be updated.
 * Use follow-gated-mint/page.ts as a reference.
 */

import { getFrameMetadata } from '@coinbase/onchainkit';
import type { Metadata } from 'next';

const imageUrl = `https://base-mints-frame.vercel.app/api/images/nft`;

const frameMetadata = getFrameMetadata({
  buttons: [{ label: 'Click to Mint, Upgrade, or View NFT' }],
  image: imageUrl,
  post_url: `https://base-mints-frame.vercel.app/api/gated-upgrade`,
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
      <div>
        Learn how to make this NFT at{' '}
        <a href="https://docs.base.org/building-with-base/guides/complex-onchain-nfts">
          Base Guides
        </a>
      </div>
    </>
  );
}
