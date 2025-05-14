import { useState, useCallback, useEffect, useRef } from 'react';
import openfortService from '../services/openfortService';
import { EmbeddedState, Provider } from '@openfort/openfort-js';

export const useOpenfort = () => {
  const [error, setError] = useState<Error | null>(null);
  const [embeddedState, setEmbeddedState] = useState<EmbeddedState>(EmbeddedState.NONE);
  const [isInitialized, setIsInitialized] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const providerRef = useRef<Provider | null>(null);

  // Poll embedded state with proper cleanup
  useEffect(() => {
    const pollEmbeddedState = () => {
      const state = openfortService.getEmbeddedState();
      setEmbeddedState(state);

      // Stop polling once ready
      if (state === EmbeddedState.READY && pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };

    // Initial check
    pollEmbeddedState();

    // Start polling only if not ready
    if (embeddedState !== EmbeddedState.READY && !pollingRef.current) {
      pollingRef.current = setInterval(pollEmbeddedState, 300);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  const authenticateWithOpenfort = useCallback(async (identityToken: string) => {
    try {
      setError(null);
      await openfortService.authenticateWithThirdPartyProvider(identityToken);
      setIsInitialized(true);
    } catch (error) {
      console.error('Error authenticating with Openfort:', error);
      setError(error instanceof Error ? error : new Error('An error occurred during Openfort authentication'));
      throw error;
    }
  }, []);

  const initializeEvmProvider = useCallback((): Provider | null => {
    try {
      if (!providerRef.current) {
        const provider = openfortService.getEvmProvider();
        if (!provider) {
          throw new Error('EVM provider is undefined');
        }
        providerRef.current = provider;

        // Add provider to window for Wagmi to detect
        if (typeof window !== 'undefined') {
          (window as any).ethereum = provider;
        }
      }
      return providerRef.current;
    } catch (error) {
      console.error('Error initializing EVM provider:', error);
      setError(error instanceof Error ? error : new Error('Failed to initialize EVM provider'));
      return null;
    }
  }, []);

  const getEvmProvider = useCallback((): Provider => {
    if (!providerRef.current) {
      const provider = initializeEvmProvider();
      if (!provider) {
        throw new Error('EVM provider not initialized');
      }
    }
    return providerRef.current!;
  }, [initializeEvmProvider]);

  const handleRecovery = useCallback(async (method: "password" | "automatic", identityToken: string, pin?: string) => {
    try {
      setError(null);
      if (method === "automatic") {
        await openfortService.setAutomaticRecoveryMethod(identityToken);
      } else if (method === "password") {
        if (!pin || pin.length < 4) {
          const error = new Error("Password recovery must be at least 4 characters");
          setError(error);
          throw error;
        }
        await openfortService.setPasswordRecoveryMethod(identityToken, pin);
      }
    } catch (error) {
      console.error('Error handling recovery with Openfort:', error);
      setError(error instanceof Error ? error : new Error('An error occurred during recovery handling'));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setError(null);
      await openfortService.logout();
      setIsInitialized(false);
      providerRef.current = null;
    } catch (error) {
      console.error('Error logging out with Openfort:', error);
      setError(error instanceof Error ? error : new Error('An error occurred during logout'));
      throw error;
    }
  }, []);

  return {
    authenticateWithOpenfort,
    embeddedState,
    getEvmProvider,
    initializeEvmProvider,
    handleRecovery,
    error,
    logout,
    isInitialized,
    isReady: embeddedState === EmbeddedState.READY,
  };
};