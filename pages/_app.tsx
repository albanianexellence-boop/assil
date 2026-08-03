import { CssBaseline, GeistProvider } from '@geist-ui/core';
import type { AppProps } from 'next/app';
import NextHead from 'next/head';
import { Analytics } from '@vercel/analytics/react';
// @ts-ignore
import '../styles/globals.css';

// Imports
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { z } from 'zod';
import { useIsMounted } from '../hooks';
import { Layout } from '../components/Layout';
import { GlobalSearchProvider } from '../context/GlobalSearchContext';

import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { SolanaWalletConnectors } from '@dynamic-labs/solana';
import { BitcoinWalletConnectors } from '@dynamic-labs/bitcoin';

const dynamicEnvironmentId = z
  .string()
  .optional()
  .parse(process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID) || '';

const queryClient = new QueryClient();

const App = ({ Component, pageProps }: AppProps) => {
  const isMounted = useIsMounted();
  if (!dynamicEnvironmentId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0b0e11', color: '#e6edf3', fontFamily: 'sans-serif', padding: '20px', textAlign: 'center' }}>
        <h2 style={{ color: '#f04d4d', marginBottom: '16px' }}>Missing Configuration Setup</h2>
        <p style={{ maxWidth: '600px', lineHeight: '1.6', color: '#8b949e' }}>
          The <b>NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID</b> environment variable is missing in your Vercel deployment.
          <br /><br />
          To fix this, go to your Vercel Dashboard &rarr; Settings &rarr; Environment Variables, add your Dynamic environment ID, and trigger a redeployment.
        </p>
      </div>
    );
  }

  // Dynamic injects a <style> tag whose quotes are HTML-escaped on the server
  // (&quot;) but raw on the client ("), which causes a hydration mismatch.
  // Only mount Dynamic after the client is ready.
  if (!isMounted) {
    return (
      <QueryClientProvider client={queryClient}>
        <NextHead>
          <title>NexSwap | Decentralized Exchange</title>
          <meta
            name="description"
            content="Trade crypto with low fees and deep liquidity on NexSwap DEX"
          />
          <link rel="icon" href="/favicon.ico" />
        </NextHead>
        <GeistProvider>
          <CssBaseline />
        </GeistProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalSearchProvider>
        <DynamicContextProvider
          settings={{
            environmentId: dynamicEnvironmentId,
            walletConnectors: [
              EthereumWalletConnectors,
              SolanaWalletConnectors,
              BitcoinWalletConnectors,
            ],
          }}
        >
          <NextHead>
            <title>NexSwap | Decentralized Exchange</title>
            <meta
              name="description"
              content="Trade crypto with low fees and deep liquidity on NexSwap DEX"
            />
            <link rel="icon" href="/favicon.ico" />
          </NextHead>
          <GeistProvider>
            <CssBaseline />
            <Layout>
              <Component {...pageProps} />
            </Layout>
            <Analytics />
          </GeistProvider>
        </DynamicContextProvider>
      </GlobalSearchProvider>
    </QueryClientProvider>
  );
};

export default App;
