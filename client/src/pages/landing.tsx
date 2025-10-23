import { Shield, Heart, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Welcome content */}
            <div className="space-y-8 max-w-xl">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
                  Welcome to Your
                  <span className="block text-primary mt-2">Safe Space</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  A secure platform designed specifically for survivors, offering essential 
                  services and support with dignity, privacy, and respect.
                </p>
              </div>

              <div className="grid gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Invite-Only Access</h3>
                    <p className="text-sm text-muted-foreground">
                      Your safety is our priority. Access is granted only through secure invite codes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Private & Secure</h3>
                    <p className="text-sm text-muted-foreground">
                      Your information is encrypted and protected with the highest security standards.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Support Services</h3>
                    <p className="text-sm text-muted-foreground">
                      Access essential services including support matching, telehealth, and resources.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Login card */}
            <div className="flex justify-center lg:justify-end">
              <Card className="w-full max-w-md shadow-2xl">
                <CardContent className="p-8 md:p-10">
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-semibold">Access Platform</h2>
                      <p className="text-sm text-muted-foreground">
                        Sign in to access your secure account
                      </p>
                    </div>

                    <Button
                      onClick={() => window.location.href = '/api/login'}
                      className="w-full h-12 text-base font-semibold"
                      data-testid="button-login"
                    >
                      Sign In Securely
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4">
                      <Lock className="w-3 h-3" />
                      <span>Secure & Private</span>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-xs text-center text-muted-foreground leading-relaxed">
                        Need an invite code? Contact your support coordinator for secure access.
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
