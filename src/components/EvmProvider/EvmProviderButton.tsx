import React, { FormEvent, useEffect } from "react";
import { BaseError, parseAbi } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

const Provider1193ActionButton: React.FC<{
  handleSetMessage: (message: string) => void;
}> = ({ handleSetMessage }) => {
  const { data: hash, error, isPending, writeContract } = useWriteContract()


  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const tokenId = formData.get('tokenId') as string
    writeContract({
      address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
      abi: parseAbi(['function mint(uint256 tokenId)']),
      functionName: 'mint',
      args: [BigInt(tokenId)],
    })
  }

  const { data,isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  useEffect(() => {
    if (data) {
      handleSetMessage(`Transaction confirmed: ${data.transactionHash}`)
    }
  }, [data])

  return (
    <div>
      <form onSubmit={submit} className='flex-col flex space-y-2'>
        <input className="p-2 border border-gray-200" name="tokenId" placeholder="Token ID" required />
        <button 
          disabled={isPending} 
          type="submit" 
          className={`w-full px-4 py-1 bg-white text-black font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:bg-gray-400 disabled:cursor-not-allowed`}>
          {isPending ? 'Confirming...' : 'Mint'}
        </button>
      </form>
      {isConfirming && 'Waiting for confirmation...'}
      {isConfirmed && 'Transaction confirmed.'}
      {error && (
        <div>Error: {(error as BaseError).shortMessage || error.message}</div>
      )}
    </div>
  );
};

export default Provider1193ActionButton;
