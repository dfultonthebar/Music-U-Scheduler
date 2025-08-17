
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        console.log('NextAuth authorize called with:', credentials?.username);
        
        if (!credentials?.username || !credentials?.password) {
          console.log('Missing credentials');
          return null;
        }

        try {
          // Authenticate with backend API
          const formData = new FormData();
          formData.append('username', credentials.username);
          formData.append('password', credentials.password);

          const response = await fetch('http://localhost:8080/auth/login', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const authData = await response.json();
            console.log('Backend authentication successful for:', credentials.username);
            
            // Get user details from backend
            const userResponse = await fetch('http://localhost:8080/auth/me', {
              headers: {
                'Authorization': `Bearer ${authData.access_token}`,
              },
            });

            if (userResponse.ok) {
              const userData = await userResponse.json();
              console.log('User data retrieved:', userData.username);
              
              return {
                id: userData.id.toString(),
                email: userData.email,
                name: userData.full_name || userData.username,
                role: userData.role || 'admin',
                username: userData.username,
                backendToken: authData.access_token
              };
            }
          }

          console.log('Backend authentication failed');
          return null;
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.username = (user as any).username;
        token.backendToken = (user as any).backendToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role as string;
        (session.user as any).id = token.sub as string;
        (session.user as any).username = token.username as string;
        (session.user as any).backendToken = token.backendToken as string;
      }
      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      console.log('SignIn callback - user authenticated:', user?.name);
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Allow relative URLs and same-origin URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  debug: false, // Disable debug mode for production
};
