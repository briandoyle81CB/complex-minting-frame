import { getFrameMetadata } from '@coinbase/onchainkit';
import type { Metadata } from 'next';

const imageUrl = 'https://base-mints-frame.vercel.app/test-bw.png';

const frameMetadata = getFrameMetadata({
  buttons: [{ label: 'Recast & Click to Mint' }],
  image: imageUrl,
  post_url: `https://base-mints-frame.app/api/gated-mint`,
});

export const metadata: Metadata = {
  title: 'Test NFT',
  description: 'A TEST!',
  openGraph: {
    title: 'Test NFT',
    description: 'A TEST!!',
    images: [imageUrl],
  },
  other: {
    ...frameMetadata,
  },
};

export default function Test() {
  return (
    <>
      <h1>Test NFT</h1>
    </>
  );
}
