import { getFrameMetadata } from '@coinbase/onchainkit';
import type { Metadata } from 'next';

const frameMetadata = getFrameMetadata({
  buttons: ['Mint (Not working)'],
  image: 'https://land-sea-and-sky.vercel.app/lss-bw.png',
  post_url: 'https://land-sea-and-sky.vercel.app/api/frame',
});

export const metadata: Metadata = {
  title: 'Land, Sea, and Sky',
  description: 'A complex, fully onchain NFT, minted exclusively from a Frame!',
  openGraph: {
    title: 'Land, Sea, and Sky',
    description: 'A complex, fully onchain NFT, minted exclusively from a Frame!',
    images: ['https://land-sea-and-sky.vercel.app/lss-bw.png'],
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
