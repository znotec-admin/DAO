import Head from 'next/head'
import Layout from "@/component/Layout/Layout"
import { ToastContainer } from 'react-toastify';
import WalletProvider from '@/component/WalletProvider/WalletProvider';
import '../styles/wallet-modal.scss';
import '../styles/folio-logo.scss';
import 'react-toastify/dist/ReactToastify.css';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>FolioDAO</title>
      </Head>
      <WalletProvider>
        <Layout>
          <Component {...pageProps} />
          <ToastContainer />
        </Layout>
      </WalletProvider>
    </>
  )
}
