import { getFrameMetadata } from '@coinbase/onchainkit';
import type { Metadata } from 'next';
import { getFrameAccountAddress } from '@coinbase/onchainkit';


const imageUrl = `https://land-sea-and-sky.vercel.app/api/images/nft`;


const frameMetadata = getFrameMetadata({
  buttons: ['Mint or View'],
  image: imageUrl,
  post_url: `https://land-sea-and-sky.vercel.app/api/frame`,
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
