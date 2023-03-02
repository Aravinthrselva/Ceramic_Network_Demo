import Head from 'next/head';
import {useState, useEffect, useRef} from 'react';
import styles from '@/styles/Home.module.css';
import Web3Modal from 'web3modal'
import { Web3Provider} from '@ethersproject/providers'
// Before we initialize Web3Modal, we will setup a React Hook provided to us by the Self.ID SDK. 
// Self.ID provides a hook called useViewerConnection which gives us an easy way to connect and disconnect to the Ceramic Network.

import { useViewerConnection } from "@self.id/react";

//The last thing we need to be able to connect to the Ceramic Network is something called an EthereumAuthProvider.
import { EthereumAuthProvider } from '@self.id/web';

// We are going to use another hook provided to us by Self.ID called useViewerRecord which allows storing and retrieving profile information on Ceramic Network
import { useViewerRecord } from '@self.id/react';

export default function Home() {

  const [connection, connect, disconnect] = useViewerConnection();

  const web3ModalRef = useRef();

  const getProvider = async() => {
    const provider = await web3ModalRef.current.connect();
    const wrappedProvider = new Web3Provider(provider);
    return wrappedProvider;
  }

  //connectToSelfID takes this Ethereum Auth Provider, and calls the connect function that we got from the useViewerConnection hook which takes care of everything else for us.
  const connectSelfID = async() => {
    const ethereumAuthProvider = await getEthereumAuthProvider();
    connect(ethereumAuthProvider);
  }


  //getEthereumAuthProvider creates an instance of the EthereumAuthProvider.

  const getEthereumAuthProvider  = async() => {
      const _wrappedProvider = await getProvider();
      const signer =   _wrappedProvider.getSigner();
      const address = await signer.getAddress();

      return new EthereumAuthProvider(_wrappedProvider.provider, address);
  // You may be wondering why we are passing it wrappedProvider.provider instead of wrappedProvider directly
  //It's because ethers abstracts away the low level provider calls with helper functions so it's easier for developers to use, 
  //but since not everyone uses ethers.js, Self.ID maintains a generic interface to actual provider specification, instead of the ethers wrapped version. 
  //We can access the actual provider instance through the provider property on wrappedProvider
  }
  useEffect(() => {
  
    // We are checking that if the user has not yet been connected to Ceramic, we are going to initialize the web3Modal
    if(connection.status !== 'connected') {
      web3ModalRef.current = new Web3Modal ({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      })
    }
  }, [connection.status]);




  return (
    <div>
      <Head>
        <title>Ceramic Test</title>
        <meta name="description" content="Storing data to ceremic testnet" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div className={styles.navbar}>
          <span className={styles.title}> Ceramic Demo</span>
          {connection.status === "connected" ? (
            <span className={styles.subtitle}> Connected </span>
           ) : (
            <button className={styles.button} onClick={connectSelfID} disabled={connection.status === "connecting"}>
              Connect
            </button>
           )}
        </div>
        <div className={styles.content}>
            <div className={styles.connection}>
              {connection.status === "connected" ? (
                <div>
                  <span className={styles.subtitle}>
                    your 3ID is {connection.selfID.id}
                  </span>
                  <RecordSetter/>
                </div>
              ) : (
                <span className={styles.subtitle}>
                Connect with your wallet to access your 3ID
                </span>
              )}
            </div>
        </div>
      </div>
      <footer className={styles.footer}> Made with 💛 by AvantGard</footer>
    </div>
  );
}


//We will consider the use case of building a decentralized profile on Ceramic.
//Thankfully, it is such a common use case that Self.ID comes with built in suport for creating and editing your profile. For the purposes of this tutorial, 
//we will only set a Name to your 3ID and update it, 
//but you can extend it to include all sorts of other properties like an avatar image, your social media links, a description, your age, gender, etc
//For readability, we will divide this into a second React component. 
function RecordSetter() {
  const record = useViewerRecord("basicProfile");
  const [name, setName] = useState("");

  const updateRecordName = async(name) => {
    await record.merge({
      name:name,
    });
  };

// This code basically renders a message Hi ${name} if you have set a name on your Ceramic profile record, 
// otherwise it tells you that you do not have a profile set up yet and you can create one. 
// You can create or update the profile by inputting text in the textbox and clicking the update button

  return (
    <div className={styles.content}>
      <div className={styles.mt2}>
        {record.content ? (
          <div className={styles.flexCol}>
            <span className={styles.subtitle}>Hola {record.content.name} </span>

            <span>
              The above name was loaded from ceramic network. Try Updating it below
            </span>
          </div>          
        ) : (
          <span>
          You do not have a profile record attached to your 3ID. Create a basic
          profile by setting a name below.
         </span>
        )
        }
      </div>

      <input
      className={styles.mt2}
      type="text"
      placeholder="name"
      value={name}
      onChange={(e) => setName(e.target.value)}
      />

      <button onClick={() => updateRecordName(name)}> Update </button>
    </div>
  )
}