import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Phone, Mail, ExternalLink } from "lucide-react";
import { useExternalLink } from "@/hooks/useExternalLink";

export default function GentlePulseSupport() {
  const { openExternal, ExternalLinkDialog } = useExternalLink();

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 pb-24">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Support & Resources</h1>
        <p className="text-muted-foreground">
          Helpful resources and support information
        </p>
      </div>

      {/* Emergency Section */}
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900">
            <AlertCircle className="w-6 h-6" />
            In Crisis? Immediate Help
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-red-200">
            <p className="font-bold text-2xl text-red-600 mb-2">988</p>
            <p className="font-medium mb-1">National Suicide & Crisis Lifeline</p>
            <p className="text-sm text-muted-foreground">Available 24/7, free and confidential</p>
            <p className="text-sm text-muted-foreground mt-2">Call or text 988 from anywhere in the US</p>
          </div>
          <div className="space-y-2 text-sm">
            <p><strong>Crisis Text Line:</strong> Text HOME to 741741</p>
            <p><strong>National Domestic Violence Hotline:</strong> 1-800-799-7233</p>
            <p><strong>National Human Trafficking Hotline:</strong> 1-888-373-7888</p>
          </div>
        </CardContent>
      </Card>

      {/* General Support */}
      <Card>
        <CardHeader>
          <CardTitle>Support Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Mental Health Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <button onClick={() => openExternal("https://www.samhsa.gov/find-help/national-helpline")} className="text-primary hover:underline">SAMHSA National Helpline</button> - 1-800-662-4357</li>
              <li>• <button onClick={() => openExternal("https://www.mentalhealth.gov/")} className="text-primary hover:underline">MentalHealth.gov</button> - Information and resources</li>
              <li>• <button onClick={() => openExternal("https://www.nami.org/")} className="text-primary hover:underline">NAMI</button> - National Alliance on Mental Illness</li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-2">Trauma Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <button onClick={() => openExternal("https://www.rainn.org/")} className="text-primary hover:underline">RAINN</button> - Rape, Abuse & Incest National Network</li>
              <li>• <button onClick={() => openExternal("https://www.polarisproject.org/")} className="text-primary hover:underline">Polaris Project</button> - Human trafficking support</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* App Information */}
      <Card>
        <CardHeader>
          <CardTitle>About GentlePulse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            GentlePulse is designed to provide accessible, trauma-informed meditation resources.
            All content is provided as-is for informational purposes.
          </p>
          <div>
            <h3 className="font-medium mb-2">Privacy</h3>
            <p className="text-sm text-muted-foreground">
              We respect your privacy. All data collected is anonymous and aggregated.
              We do not collect personal information, and your data is never sold or shared with third parties.
              Your use of this app is completely anonymous.
            </p>
          </div>
        </CardContent>
      </Card>

      <ExternalLinkDialog />
    </div>
  );
}
