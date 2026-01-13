// LinkedIn OAuth & Profile Data Extraction

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization"
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
const LINKEDIN_API_URL = "https://api.linkedin.com/v2"

export function getLinkedInAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: redirectUri,
    state,
    scope: "openid profile email"
  })
  
  return `${LINKEDIN_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForToken(
  code: string, 
  redirectUri: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const response = await fetch(LINKEDIN_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  })
  
  if (!response.ok) {
    throw new Error("Failed to exchange code for token")
  }
  
  const data = await response.json()
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  }
}

export async function getLinkedInProfile(accessToken: string): Promise<{
  firstName: string
  lastName: string
  email: string
  profileUrl: string
  profilePictureUrl?: string
}> {
  // Get basic profile with OpenID Connect userinfo endpoint
  const userInfoResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  
  if (!userInfoResponse.ok) {
    throw new Error("Failed to fetch LinkedIn profile")
  }
  
  const userInfo = await userInfoResponse.json()
  
  return {
    firstName: userInfo.given_name || "",
    lastName: userInfo.family_name || "",
    email: userInfo.email || "",
    profileUrl: `https://www.linkedin.com/in/${userInfo.sub}`,
    profilePictureUrl: userInfo.picture,
  }
}

