import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { apiRequest } from "./queryClient";

export async function registerPasskey() {
  try {
    const optionsResponse = await apiRequest("POST", "/api/passkey/register/start");
    const options = await optionsResponse.json();

    const registrationResponse = await startRegistration(options);

    const verificationResponse = await apiRequest("POST", "/api/passkey/register/verify", {
      response: registrationResponse,
    });
    const verification = await verificationResponse.json();

    if (verification.verified) {
      return { success: true };
    } else {
      throw new Error("Passkey registration failed");
    }
  } catch (error: any) {
    console.error("Passkey registration error:", error);
    throw error;
  }
}

export async function authenticateWithPasskey(username: string) {
  try {
    const optionsResponse = await apiRequest("POST", "/api/passkey/login/start", {
      username,
    });
    const options = await optionsResponse.json();

    const authenticationResponse = await startAuthentication(options);

    const verificationResponse = await apiRequest("POST", "/api/passkey/login/verify", {
      response: authenticationResponse,
    });
    const verification = await verificationResponse.json();

    if (verification.verified) {
      return { success: true, user: verification.user };
    } else {
      throw new Error("Passkey authentication failed");
    }
  } catch (error: any) {
    console.error("Passkey authentication error:", error);
    throw error;
  }
}

export function generateStrongPassword(length: number = 16): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  
  return password;
}
