import { Shield, Heart, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left side - Welcome content */}
            <div className="space-y-6 lg:space-y-8 max-w-xl">
              <div className="space-y-3 lg:space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                  world's first psyop-free
                  <span className="block text-primary mt-1 lg:mt-2">TI economy</span>
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed">
                  A secure platform designed specifically for survivors, offering essential 
                  services and support with dignity, privacy, and respect.
                </p>
              </div>

              <div className="grid gap-3 lg:gap-4">
                <div className="flex items-start gap-3 lg:gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">Invite-Only Access</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Your safety is our priority. Access is granted only through invite codes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 lg:gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">Private & Secure</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Your information is protected with the highest security standards.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 lg:gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">Support Services</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Access essential services including support matching, housing, and resources.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Login card */}
            <div className="flex justify-center lg:justify-end">
              <Card className="w-full max-w-md shadow-2xl">
                <CardContent className="p-6 sm:p-8 lg:p-10">
                  <div className="space-y-5 lg:space-y-6">
                    <div className="text-center space-y-2">
                      <h2 className="text-xl sm:text-2xl font-semibold">Access Platform</h2>
                      <p className="text-sm text-muted-foreground">
                        Sign in to access your secure account
                      </p>
                    </div>

                    <Button
                      onClick={() => window.location.href = '/api/login'}
                      className="w-full text-base font-semibold"
                      data-testid="button-login"
                    >
                      Sign In Securely
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2 lg:pt-4">
                      <Lock className="w-3 h-3" />
                      <span>Secure & Private</span>
                    </div>

                    <div className="pt-3 lg:pt-4 border-t">
                      <p className="text-xs text-center text-muted-foreground leading-relaxed">
                        Need an invite code?{" "}
                        <a 
                          href="https://signal.group/#CjQKILHj7074l2Kl-oYy0qGSFdydXbtu0Pf66Z_88K9IlSCtEhDDdqV_BFAW2qm2EiTGEaNs"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                          data-testid="link-signal-group"
                        >
                          Contact our support coordinator for secure access
                        </a>.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
