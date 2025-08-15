
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
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        // Check mock database
        const user = mockUsers.find(u => u.username === credentials.username)
        if (user && await bcrypt.compare(credentials.password, user.password)) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }

        return null
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role as string
        (session.user as any).id = token.sub as string
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET
}
