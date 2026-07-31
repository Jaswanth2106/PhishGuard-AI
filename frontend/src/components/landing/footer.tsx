import Link from "next/link";
import { Shield, Globe, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-border/50 bg-background pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white">
                <Shield className="w-4 h-4" />
              </div>

              <span className="text-xl font-bold">
                PhishGuard AI
              </span>
            </div>

            <p className="text-sm text-muted-foreground">
              Understand Every Email Before You Trust It.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">
              Product
            </h4>

            <ul className="space-y-2">
              <li>
                <Link href="/login">Login</Link>
              </li>

              <li>
                <Link href="/signup">Sign Up</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">
              Legal
            </h4>

            <ul className="space-y-2">
              <li>
                <Link href="/privacy-policy">
                  Privacy Policy
                </Link>
              </li>

              <li>
                <Link href="/terms-and-conditions">
                  Terms
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">
              Connect
            </h4>

            <div className="flex gap-4">

              <Globe className="w-5 h-5" />

              <Mail className="w-5 h-5" />

            </div>
          </div>

        </div>

        <div className="border-t pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} PhishGuard AI
        </div>

      </div>
    </footer>
  );
}