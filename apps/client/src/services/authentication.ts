import fetch from 'node-fetch';

export async function loginWithGoogle(
  idToken: string
): Promise<{
  email: string;
  id: string;
  name: string;
  picture: string;
} | null> {
  const url = `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${idToken}`;
  const result = await fetch(url);
  const response = await result.json();
  // Token khong hop le
  if (typeof response.email == 'undefined') return null;

  const { email, sub: id, name, picture } = response;

  return { email, id, name, picture };
}
