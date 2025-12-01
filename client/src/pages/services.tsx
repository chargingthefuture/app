import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { UserCheck, Building2, ArrowRight, MessageCircle, Wrench, Mail, Search, HeartPulse, Radio, Car, Briefcase} from "lucide-react";

const services = [
  {
    title: "Chat Groups",
    description: "Real time chats with TIs",
    icon: MessageCircle,
    href: "/apps/chatgroups",
    testId: "card-service-chatgroups",
  },
  {
    title: "Chyme",
    description: "Join private or public audio rooms for voice conversations. Secure, encrypted, and designed with privacy and trauma-informed care in mind.",
    icon: Radio,
    href: "/apps/chyme",
    testId: "card-service-chyme",
  },
  {
    title: "Directory",
    description: "Find talented individuals to colloborate with.",
    icon: Building2,
    href: "/apps/directory",
    testId: "card-service-directory",
  },
  {
    title: "GentlePulse",
    description: "Access guided meditations hosted on Wistia, track your mood, and find supportive resources. Designed with privacy, accessibility, and trauma-informed care in mind.",
    icon: HeartPulse,
    href: "/apps/gentlepulse",
    testId: "card-service-gentlepulse",
  },
  {
    title: "LightHouse",
    description: "rovides safe accommodations and support resources for human trafficking survivors, guiding them towards healing and empowerment.",
    icon: Building2,
    href: "/apps/lighthouse",
    testId: "card-service-lighthouse",
  },
  {
    title: "LostMail",
    description: "Report mail incidents (lost, damaged, tampered, delayed) and track your reports. Admin dashboard available for incident management.",
    icon: Mail,
    href: "/apps/lostmail",
    testId: "card-service-lostmail",
  },
  {
    title: "MechanicMatch",
    description: "Connect with trusted mechanics for vehicle repair, remote diagnosis, or expert advice. Mechanics can build their profile and help car owners.",
    icon: Wrench,
    href: "/apps/mechanicmatch",
    testId: "card-service-mechanicmatch",
  },
  {
    title: "CompareNotes",
    description: "Post research questions, receive sourced answers, and collaboratively surface the most relevant, accurate responses with voting and tagging.",
    icon: Search,
    href: "/apps/research",
    testId: "card-service-research",
  },
  {
    title: "SocketRelay",
    description: "Find what you need or help others get the goods and services they request.",
    icon: UserCheck,
    href: "/apps/socketrelay",
    testId: "card-service-socketrelay",
  },
  {
    title: "SupportMatch",
    description: "partner matching platform for human trafficking victims, featuring monthly partnership cycles, real-time messaging, and robust safety features.",
    icon: UserCheck,
    href: "/apps/supportmatch",
    testId: "card-service-supportmatch",
  },
  {
    title: "TrustTransport",
    description: "Safe ride-sharing service connecting riders with trusted drivers. Request rides or offer transportation support to fellow survivors.",
    icon: Car,
    href: "/apps/trusttransport",
    testId: "card-service-trusttransport",
  },
  {
    title: "Workforce Recruiter",
    description: "Find trauma-informed jobs, training, and relocation partners. Profiles emphasize safety, consent, and survivor-defined boundaries.",
    icon: Briefcase,
    href: "/apps/workforce-recruiter",
    testId: "card-service-workforce",
  },
];

export default function Services() {
  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold mb-2">
          Available Services
        </h1>
        <p className="text-muted-foreground">
          Explore our support services designed specifically for survivors
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.title} className="hover-elevate" data-testid={service.testId}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <service.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex items-center gap-2">
                <CardTitle>{service.title}</CardTitle>
                {service.title === "CompareNotes" && (
                  <Badge variant="outline" className="text-xs">
                    Beta
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {service.description}
              </p>
              <Link href={service.href}>
                <Button variant="outline" className="w-full" data-testid={`button-access-${service.title.toLowerCase().replace(' ', '-')}`}>
                  Access Service
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
