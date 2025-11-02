import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { FileText, Search, Plus } from "lucide-react";
import { AnnouncementBanner } from "@/components/announcement-banner";
import LostMailIncidentList from "./incident-list";

export default function LostMailDashboard() {
  const [email, setEmail] = useState("");
  const [showList, setShowList] = useState(false);

  const handleLookup = () => {
    if (email && email.includes("@")) {
      setShowList(true);
    } else {
      alert("Please enter a valid email address");
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-semibold mb-2">LostMail</h1>
      
      <AnnouncementBanner
        apiEndpoint="/api/lostmail/announcements"
        queryKey="/api/lostmail/announcements"
      />

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Report an Incident</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Report lost, damaged, tampered, or delayed mail.
            </p>
            <Link href="/apps/lostmail/report">
              <Button className="w-full" data-testid="button-new-report">
                <Plus className="w-4 h-4 mr-2" />
                Create New Report
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>View Your Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your email address to view your submitted incidents.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                data-testid="input-email-lookup"
              />
              <Button onClick={handleLookup} data-testid="button-lookup">
                <Search className="w-4 h-4 mr-2" />
                Lookup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {showList && email && (
        <LostMailIncidentList email={email} />
      )}
    </div>
  );
}
