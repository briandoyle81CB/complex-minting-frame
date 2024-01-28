import { getFrameMetadata } from '@coinbase/onchainkit';
import type { Metadata } from 'next';

const frameMetadata = getFrameMetadata({
  buttons: ['Next image'],
  image: 'https://zizzamia.xyz/park-1.png',
  post_url: 'https://zizzamia.xyz/api/frame',
});

export const metadata: Metadata = {
  title: 'Land, Sea, and Sky',
  description: 'A complex, fully onchain NFT, minted exclusively from a Frame!',
  openGraph: {
    title: 'Land, Sea, and Sky',
    description: 'A complex, fully onchain NFT, minted exclusively from a Frame!',
    images: ['https://zizzamia.xyz/park-1.png'],
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
