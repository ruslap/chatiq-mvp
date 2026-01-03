import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      organizationId?: string;
    } & DefaultSession['user'];
  }

  interface User {
    organizationId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    organizationId?: string;
  }
}
