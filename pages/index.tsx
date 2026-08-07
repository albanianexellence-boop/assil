import { GetServerSideProps } from 'next';

// Redirect / to /tokens (the DEXScreener-style page)
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/tokens',
      permanent: false,
    },
  };
};

export default function Home() {
  return null;
}
