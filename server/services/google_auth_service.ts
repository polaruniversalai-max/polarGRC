import { OAuth2Client } from "google-auth-library";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

export function getGoogleAuthClient(callbackUrl: string) {
  return new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, callbackUrl);
}

export function getGoogleAuthUrl(client: OAuth2Client): string {
  return client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "openid",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    prompt: "consent",
  });
}

export async function verifyGoogleToken(client: OAuth2Client, code: string) {
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token!,
    audience: GOOGLE_CLIENT_ID,
  });
  
  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error("Invalid Google token");
  }
  
  return {
    id: payload.sub,
    email: payload.email,
    firstName: payload.given_name || "",
    lastName: payload.family_name || "",
    profileImageUrl: payload.picture || "",
  };
}

export const GoogleAuthService = {
  getGoogleAuthClient,
  getGoogleAuthUrl,
  verifyGoogleToken,
};
