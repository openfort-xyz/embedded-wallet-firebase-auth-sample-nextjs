import React, { useEffect, useRef, useState } from "react";
import { NextPage } from "next";
import LoginSignupForm from "../components/Authentication/LoginSignupForm";
import { useOpenfort } from "../hooks/useOpenfort";
import { EmbeddedState } from "@openfort/openfort-js";
import AccountRecovery from "../components/Authentication/AccountRecovery";
import Spinner from "../components/Shared/Spinner";
import LogoutButton from "../components/Shared/LogoutButton";
import SignMessageButton from "../components/Signatures/SignMessageButton";
import SignTypedDataButton from "../components/Signatures/SignTypedDataButton";
import EvmProviderButton from "../components/EvmProvider/EvmProviderButton";

import { useAuth } from "../contexts/AuthContext";
import { useAccount, useChainId, useConnect, useDisconnect, useEnsName } from "wagmi";

const HomePage: NextPage = () => {
  const { user } = useAuth();
  const { embeddedState, initializeEvmProvider, isReady } = useOpenfort();
  const [message, setMessage] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { connectors, connect } = useConnect();
  const { status, isConnected } = useAccount();
  const chainId = useChainId();
  
  const providerInitializedRef = useRef(false);

  const handleSetMessage = (message: string) => {
    const newMessage = `${message} \n\n`;
    setMessage((prev) => prev + newMessage);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [message]);

  // Initialize EVM provider once when ready
  useEffect(() => {
    if (isReady && !providerInitializedRef.current) {
      console.log("Initializing EVM provider...");
      const provider = initializeEvmProvider();
      if (provider) {
        providerInitializedRef.current = true;
        handleSetMessage("EVM Provider initialized successfully");
      }
    }
  }, [isReady, initializeEvmProvider]);

  // Handle Openfort connection with proper guards
  useEffect(() => {
    const connectToOpenfort = async () => {
      // Check all conditions that should prevent connection
      if (
        !isReady || // Openfort not ready
        !providerInitializedRef.current || // Provider not initialized
        isConnected || // Already connected
        status === "connecting" || // Currently connecting
        !connectors.length // No connectors available
      ) {
        return;
      }

      const openfortConnector = connectors.find((c) => c.name === "Openfort");
      if (!openfortConnector) {
        console.warn("Openfort connector not found");
        return;
      }

      try {
        console.log("Attempting to connect to Openfort...");
        await connect({ connector: openfortConnector, chainId });
        handleSetMessage("Connected to Openfort successfully");
      } catch (error) {
        console.error("Failed to connect:", error);
        handleSetMessage(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    connectToOpenfort();
  }, [isReady, isConnected, status, connectors, chainId, connect]);


  if (!user) return <LoginSignupForm />;

  if (embeddedState === EmbeddedState.EMBEDDED_SIGNER_NOT_CONFIGURED) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col px-4 sm:px-6">
        <p className="text-gray-400 mb-2">Welcome, {user.email}!</p>
        <div className="absolute top-2 right-2">
          <LogoutButton />
        </div>
        <div className="mt-8">
          <AccountRecovery />
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center">
          <Spinner />
          <p className="mt-4 text-gray-600">Initializing wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 sm:px-6 space-y-8">
      <p className="text-gray-400 mb-2">Welcome, {user.email}!</p>
      <Account />
      <div>
        <span className="font-medium text-black">Console: </span>
        <div className="py-4 block h-full">
          <textarea
            ref={textareaRef}
            className="no-scrollbar h-36 w-full rounded-lg border-0 bg-gray-100 p-4 font-mono text-xs text-black"
            value={message}
            readOnly
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="bg-white p-4 rounded-md shadow-2xl space-y-4">
          <h2 className="flex justify-left font-medium text-xl pb-4">
           Write Contract
          </h2>
          <div>
            <EvmProviderButton handleSetMessage={handleSetMessage}/>
          </div>
        </div>
        <div className="bg-white p-4 rounded-md shadow-2xl space-y-4">
          <h2 className="flex justify-left font-medium text-xl pb-4">
            Signatures
          </h2>
          <div>
            <SignMessageButton handleSetMessage={handleSetMessage}/>
          </div>

          <div>
            <span className="font-medium text-black">Typed message: </span>
            <br/>
            <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://github.com/openfort-xyz/sample-browser-nextjs-embedded-signer/blob/main/src/components/Signatures/SignTypedDataButton.tsx#L25"
                className="text-blue-600 hover:underline"
            >
              {"View typed message."}
            </a>
            <SignTypedDataButton handleSetMessage={handleSetMessage}/>
          </div>
        </div>
      </div>
    </div>
  );
};

function Account() {
  const account = useAccount();
  const { data: ensName } = useEnsName({
    address: account.address,
  });
  const { disconnect } = useDisconnect();

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-medium mb-2">Account Details</h3>
      <div className="space-y-1 text-sm">
        <p>
          <span className="font-medium">Address:</span> {account.address} {ensName && `(${ensName})`}
        </p>
        <p>
          <span className="font-medium">Chain ID:</span> {account.chainId}
        </p>
        <p>
          <span className="font-medium">Status:</span> <span className={`font-medium ${account.status === 'connected' ? 'text-green-600' : 'text-gray-600'}`}>{account.status}</span>
        </p>
        <p>
          <span className="font-medium">Connector:</span> {account.connector?.name || 'None'}
        </p>
      </div>
      {account.connector?.name && account.connector?.name !== "Openfort" && (
        <button 
          type='button' 
          onClick={() => disconnect()}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Disconnect
        </button>
      )}
    </div>
  );
}

export default HomePage;