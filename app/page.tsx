import { getFrameMetadata } from '@coinbase/onchainkit';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const imageUrl = `https://land-sea-and-sky.vercel.app/lss-bw.png?date=${Date.now()}`;
  return {
    title: 'Land, Sea, and Sky',
    description: 'A complex, fully onchain NFT, minted exclusively from a Frame!',
    openGraph: {
      title: 'Land, Sea, and Sky',
      description: 'A complex, fully onchain NFT, minted exclusively from a Frame!',
      images: [imageUrl],
    },
    other: {
      buttons: ['Mint (Not working)'],
      image: imageUrl,
      post_url: 'https://land-sea-and-sky.vercel.app/api/frame',
    },
  };
};

export default function Page() {
  return (
    <>
      <h1>Land, Sea, and Sky</h1>
    </>
  );
}
