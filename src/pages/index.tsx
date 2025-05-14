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
  const { embeddedState, getEvmProvider } = useOpenfort();
  console.log("embeddedState", embeddedState);
  const [message, setMessage] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {connectors, connect } = useConnect();
  const { status, isConnected } = useAccount();
  console.log("status", status);
  console.log("isConnected", isConnected);
  const chainId = useChainId();

  const handleSetMessage = (message: string) => {
    const newMessage = `${message} \n\n`;
    setMessage((prev) =>  prev + newMessage);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = 0;
      textareaRef.current.focus();
    }
  }, [message]);

  useEffect(() => {
    getEvmProvider()
  }, []);

  useEffect(() => {
    console.log("embeddedState", embeddedState);
    if(embeddedState === EmbeddedState.READY && !isConnected && status !== "connecting") {
      const connector = connectors.find((connector) => connector.name === "Openfort")
      console.log("connector", connector)
      if(!connector) return
      connect({connector: connector!, chainId});
    }
  }, [connectors, status]);

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

  if (embeddedState !== EmbeddedState.READY) {
    return (
      <div className="absolute top-1/2 left-1/2 flex items-center">
        <Spinner />
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
  const account = useAccount()
  const { data: ensName } = useEnsName({
    address: account.address,
  })
  const {disconnect,data} = useDisconnect()

  return (
    <div>
      <div>
        account: {account.address} {ensName}
        <br />
        chainId: {account.chainId}
        <br />
        status: {account.status}
      </div>
      {account.connector?.name && account.connector?.name !== "Openfort" && (
      <button type='button' onClick={() => disconnect()}>Disconnect</button>
      )}
    </div>
  )
}

export default HomePage;