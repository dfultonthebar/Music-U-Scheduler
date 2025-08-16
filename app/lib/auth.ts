
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

// Mock user database - replace with actual database in production
const mockUsers = [
  {
    id: "1",
    username: "admin",
    email: "admin@musicu.com",
    password: "$2a$12$RIgUENTyEG/z4o2cyseTsODvXEMBejoDV1QcLLW4JoR5ltmJJS/T6", // MusicU2025
    name: "Music U Admin",
    role: "admin"
  },
  {
    id: "2", 
    username: "john",
    email: "john@doe.com",
    password: "$2a$12$cKoi44U7czdivPX51.oBDuUF01WywyRxne1q3X6A7kH/ZNzcQd84O", // johndoe123 
    name: "John Doe",
    role: "admin"
  }
]

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('NextAuth authorize called with:', credentials?.username);
        
        if (!credentials?.username || !credentials?.password) {
          console.log('Missing credentials');
          return null
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
                role: userData.is_teacher ? 'instructor' : 'admin',
                username: userData.username,
                backendToken: authData.access_token
              }
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
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.username = (user as any).username
        token.backendToken = (user as any).backendToken
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role as string
        (session.user as any).id = token.sub as string
        (session.user as any).username = token.username as string
        (session.user as any).backendToken = token.backendToken as string
      }
      return session
    },
    async signIn({ user }) {
      console.log('SignIn callback - user authenticated:', user?.name);
      return true
    },
    async redirect({ url, baseUrl }) {
      // Allow relative URLs and same-origin URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allow same origin URLs
      else if (new URL(url).origin === baseUrl) return url
      // Otherwise redirect to admin page for admin users
      return `${baseUrl}/admin`
    }
  },
  secret: process.env.NEXTAUTH_SECRET
}
