import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { UserCheck, Moon, Building2, ArrowRight, MessageCircle} from "lucide-react";

const services = [
  {
    title: "Chat Groups",
    description: "Real time chats with TIs",
    icon: MessageCircle,
    href: "/apps/chatgroups",
    testId: "card-service-chatgroups",
  },
  {
    title: "Directory",
    description: "Find talented individuals to colloborate with.",
    icon: Building2,
    href: "/apps/directory",
    testId: "card-service-directory",
  },
  {
    title: "LightHouse",
    description: "Safe housing connections for survivors. Find or offer secure, supportive living spaces in New York.",
    icon: Building2,
    href: "/apps/lighthouse",
    testId: "card-service-lighthouse",
  },
  {
    title: "Sleep Stories",
    description: "Calming audio content designed to help you relax and sleep peacefully. Meditation and bedtime stories.",
    icon: Moon,
    href: "/apps/sleepstories",
    testId: "card-service-sleepstories",
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
    description: "Connect with accountability partners who understand your journey. Find support through meaningful partnerships.",
    icon: UserCheck,
    href: "/apps/supportmatch",
    testId: "card-service-supportmatch",
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
              <CardTitle>{service.title}</CardTitle>
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
