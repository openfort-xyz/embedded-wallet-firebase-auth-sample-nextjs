import { AuthPlayerResponse, Provider, ShieldAuthentication, TokenType, ShieldAuthType, RecoveryMethod } from '@openfort/openfort-js';
import openfort from '../utils/openfortConfig';
import { ThirdPartyOAuthProvider } from '@openfort/openfort-js';
import { baseSepolia } from 'viem/chains';

const chainId = baseSepolia.id

class OpenfortService {
  async authenticateWithThirdPartyProvider(identityToken: string): Promise<AuthPlayerResponse> {
    try {
      return await openfort.auth.authenticateWithThirdPartyProvider({
        provider: ThirdPartyOAuthProvider.FIREBASE,
        token: identityToken,
        tokenType: TokenType.ID_TOKEN
      });
    } catch (error) {
      console.error('Error authenticating with Openfort:', error);
      throw error;
    }
  }
  async getEvmProvider(): Promise<Provider> {
    return openfort.embeddedWallet.getEthereumProvider({ policy: process.env.NEXT_PUBLIC_POLICY_ID });
  }

  async getEmbeddedState() {
    const state = await openfort.embeddedWallet.getEmbeddedState();
    return state;
  }

  async getEncryptionSession(): Promise<string> {
    const resp = await fetch(`/api/protected-create-encryption-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!resp.ok) {
      throw new Error("Failed to create encryption session");
    }

    const respJSON = await resp.json();
    return respJSON.session;
  }

  async setAutomaticRecoveryMethod(identityToken: string) {
    try {
      const shieldAuth: ShieldAuthentication = {
        auth: ShieldAuthType.OPENFORT,
        token: identityToken,
        authProvider: ThirdPartyOAuthProvider.FIREBASE,
        tokenType: TokenType.ID_TOKEN,
        encryptionSession: await this.getEncryptionSession(),
      };
      await openfort.embeddedWallet.configure({ chainId, shieldAuthentication: shieldAuth });
    } catch (error) {
      console.error('Error authenticating with Openfort:', error);
      throw error;
    }
  }

  async setPasswordRecoveryMethod(identityToken: string, pin: string) {
    try {
      const shieldAuth: ShieldAuthentication = {
        auth: ShieldAuthType.OPENFORT,
        token: identityToken,
        authProvider: ThirdPartyOAuthProvider.FIREBASE,
        tokenType: TokenType.ID_TOKEN,
        encryptionSession: await this.getEncryptionSession(),
      };
      await openfort.embeddedWallet.configure({ chainId, shieldAuthentication: shieldAuth, recoveryParams: { password: pin, recoveryMethod: RecoveryMethod.PASSWORD } });
    } catch (error) {
      console.error('Error authenticating with Openfort:', error);
      throw error;
    }
  }
  async logout() {
    try {
      await openfort.auth.logout();
    } catch (error) {
      console.error('Error logging out with Openfort:', error);
      throw error;
    }
  }
}



// Create a singleton instance of the OpenfortService
const openfortService = new OpenfortService();

export default openfortService;
