import Link from "next/link";
import { Shield, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer id="contact" className="relative z-10 border-t border-border/50 bg-background pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">

          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold">
                PhishGuard AI
              </span>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">Need Help?</h4>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                Understand suspicious emails before they become threats.
                <br /><br />
                PhishGuard AI combines Machine Learning and Google Gemini to analyze phishing emails, screenshots, and EML files in seconds.
              </p>
            </div>
          </div>

          <div className="space-y-6 md:pl-12">
            <h4 className="font-semibold text-lg">Contact Information</h4>

            <div className="space-y-4">
              <a 
                href="mailto:jaswanthnaidunainala@gmail.com" 
                className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors w-fit"
              >
                <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="font-medium">jaswanthnaidunainala@gmail.com</span>
              </a>

              <a 
                href="https://github.com/Jaswanth2106" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors w-fit"
              >
                <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                </div>
                <span className="font-medium">GitHub</span>
              </a>

              <a 
                href="https://www.linkedin.com/in/jaswanth-naidu-nainala-54a93332a" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors w-fit"
              >
                <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-linkedin"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                </div>
                <span className="font-medium">LinkedIn</span>
              </a>
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