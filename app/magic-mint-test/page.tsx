/**
 * This page is not compliant with the latest patterns.
 * It needs to be updated.
 * Use follow-gated-mint/page.ts as a reference.
 */

import { getFrameMetadata } from '@coinbase/onchainkit';
import type { Metadata } from 'next';

const imageUrl = 'https://base-mints-frame.vercel.app/test-bw.png';

const frameMetadata = getFrameMetadata({
  buttons: [{ label: 'Follow Me & Click to Mint' }],
  image: imageUrl,
  post_url: `https://base-mints-frame.vercel.app/api/magic-mint-test`,
});

export const metadata: Metadata = {
  title: 'Magic Test NFT',
  description: 'A MAGIC TEST!',
  openGraph: {
    title: 'Magic Test NFT',
    description: 'A MAGIC TEST!!',
    images: [imageUrl],
  },
  other: {
    ...frameMetadata,
  },
};

export default function Test() {
  return (
    <>
      <h1>Test Magic Mint NFT</h1>
    </>
  );
}
