import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "@/utils/mongoose"; // your DB connection
import User from "@/models/User";
import bcrypt from "bcryptjs";

// Validate Google OAuth environment variables
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// Only add Google provider if credentials are configured
const providers = [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        await connectDB();
        const user = await User.findOne({ email: credentials.email });
      // Check if user exists and has a password (not OAuth-only user)
      if (!user || !user.password) {
        return null;
      }
      // Verify password
      if (!(await bcrypt.compare(credentials.password, user.password))) {
          return null;
        }
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      }
    })
];

// Add Google provider only if credentials are available
if (googleClientId && googleClientSecret) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  );
} else {
  console.warn("⚠️ Google OAuth credentials not configured. Google login will be disabled.");
  console.warn("   Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env.local file");
}

export const authOptions = {
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          await connectDB();
          // Check if user exists
          let dbUser = await User.findOne({ email: user.email });
          
          // Get role data from sessionStorage (set before OAuth)
          // Note: sessionStorage is client-side, so we need to pass it via a different method
          // We'll check if role was already set, or use a default
          
          if (!dbUser) {
            // Try to get role from a cookie or use default
            // For now, we'll set role in the callback URL or use a server-side approach
            // Since we can't access sessionStorage server-side, we'll set role after OAuth
            // by checking if user needs role setup and setting it in onboarding
            
            // Create new user with Google account - role will be set during onboarding
            dbUser = await User.create({
              name: user.name || profile?.name || "User",
              email: user.email,
              password: undefined, // No password for OAuth users (optional field)
              role: undefined, // Will be set during onboarding
              avatar: user.image || profile?.picture || "",
              phone: "",
              organization: "",
              college: "",
              bio: "",
            });
          } else {
            // Update avatar if user exists but doesn't have one
            if (!dbUser.avatar && user.image) {
              dbUser.avatar = user.image;
            }
            await dbUser.save();
          }
          
          // Update user object with database user info
          user.id = dbUser._id.toString();
          user.role = dbUser.role;
          return true;
        } catch (error) {
          console.error("Error in Google sign in:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.image = user.image;
      }
      
      // Always keep token flags in sync with DB (important after role/password setup via update())
      // Runs on sign-in and also on session update triggers.
      const userId = user?.id || token?.id;
      const email = user?.email || token?.email;
      
      if (userId || email) {
        try {
          await connectDB();
          // Prefer ID lookup for more reliable fetching
          const dbUser = userId 
            ? await User.findById(userId)
            : await User.findOne({ email });
          
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role;
            token.name = dbUser.name;
            token.email = dbUser.email;
            token.image = dbUser.avatar || token.image;
            token.needsPasswordSetup = !dbUser.password;
            // Check if role is set (not empty/undefined)
            token.needsRoleSetup = !dbUser.role || !['attendee', 'organizer'].includes(dbUser.role);
          }
        } catch (error) {
          console.error("Error fetching user in JWT:", error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.role = token.role;
        session.user.image = token.image;
        session.user.needsPasswordSetup = Boolean(token.needsPasswordSetup);
        session.user.needsRoleSetup = Boolean(token.needsRoleSetup);
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
   
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
