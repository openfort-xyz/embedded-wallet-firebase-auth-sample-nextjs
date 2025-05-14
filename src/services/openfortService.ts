import { AuthPlayerResponse, Provider, ShieldAuthentication, TokenType, ShieldAuthType } from '@openfort/openfort-js';
import openfort from '../utils/openfortConfig';
import { ThirdPartyOAuthProvider } from '@openfort/openfort-js';
import { polygonAmoy } from 'viem/chains';

const chainId = polygonAmoy.id

class OpenfortService {
  async authenticateWithThirdPartyProvider(identityToken: string): Promise<AuthPlayerResponse> {
    try {
      return await openfort.authenticateWithThirdPartyProvider({
        provider: ThirdPartyOAuthProvider.FIREBASE,
        token: identityToken,
        tokenType: TokenType.ID_TOKEN
      });
    } catch (error) {
      console.error('Error authenticating with Openfort:', error);
      throw error;
    }
  }
  getEvmProvider(): Provider {
    return openfort.getEthereumProvider({ policy: process.env.NEXT_PUBLIC_POLICY_ID });
  }

  getEmbeddedState() {
    const state = openfort.getEmbeddedState();
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
      await openfort.configureEmbeddedSigner(chainId, shieldAuth);
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
      await openfort.configureEmbeddedSigner(chainId, shieldAuth, pin);
    } catch (error) {
      console.error('Error authenticating with Openfort:', error);
      throw error;
    }
  }
  async logout() {
    try {
      await openfort.logout();
    } catch (error) {
      console.error('Error logging out with Openfort:', error);
      throw error;
    }
  }
}



// Create a singleton instance of the OpenfortService
const openfortService = new OpenfortService();

export default openfortService;
