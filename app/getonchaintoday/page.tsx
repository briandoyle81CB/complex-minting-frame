import { getFrameMetadata } from '@coinbase/onchainkit';
import type { Metadata } from 'next';

const imageUrl = 'https://base-mints-frame.vercel.app/get-onchain-today.png';

const frameMetadata = getFrameMetadata({
  buttons: [{ label: 'Mint for followers of @Base' }],
  image: imageUrl,
  post_url: `https://base-mints-frame.vercel.app/api/get-onchain-today`,
});

export const metadata: Metadata = {
  title: 'Get Onchain Today!',
  description: 'Get Onchain Today!',
  openGraph: {
    title: 'Get Onchain Today!',
    description: 'Get Onchain Today!',
    images: [imageUrl],
  },
  other: {
    ...frameMetadata,
  },
};

export default function Test() {
  return (
    <>
      <h1>Get Onchain Today!</h1>
      <img src={imageUrl} alt="Get Onchain Today!"/>
    </>
  );
}
