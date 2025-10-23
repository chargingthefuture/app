import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Ticket, DollarSign, Package } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  activeInvites: number;
  monthlyRevenue: string;
  totalProducts: number;
}

export default function AdminDashboard() {
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Active Invites",
      value: stats?.activeInvites || 0,
      icon: Ticket,
      color: "bg-chart-2/10 text-chart-2",
    },
    {
      title: "Monthly Revenue",
      value: `$${stats?.monthlyRevenue || 0}`,
      icon: DollarSign,
      color: "bg-chart-3/10 text-chart-3",
    },
    {
      title: "Products",
      value: stats?.totalProducts || 0,
      icon: Package,
      color: "bg-chart-4/10 text-chart-4",
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of platform activity and management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Activity log shows the latest administrative actions and user registrations.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Monitor subscription payments and identify overdue accounts.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
