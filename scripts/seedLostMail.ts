import { db } from "../server/db";
import {
  lostmailIncidents,
  lostmailAuditTrail,
  lostmailAnnouncements,
  type InsertLostmailIncident,
  type InsertLostmailAnnouncement,
} from "../shared/schema";

async function seedLostMail() {
  console.log("Creating LostMail seed data...");

  // Seed LostMail incidents
  const incidentsData: InsertLostmailIncident[] = [
    {
      reporterName: "Sarah Johnson",
      reporterEmail: "sarah.johnson@example.com",
      reporterPhone: "+1-555-0101",
      incidentType: "lost",
      carrier: "USPS",
      trackingNumber: "9400111899223197428490",
      expectedDeliveryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      noticedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      description: "Package was expected 5 days ago but never arrived. Tracking shows it was out for delivery but never completed.",
      photos: null,
      severity: "high",
      status: "under_review",
      consent: true,
      assignedTo: null,
    },
    {
      reporterName: "Michael Chen",
      reporterEmail: "michael.chen@example.com",
      reporterPhone: "+1-555-0102",
      incidentType: "damaged",
      carrier: "FedEx",
      trackingNumber: "1234567890123",
      expectedDeliveryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      noticedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      description: "Package arrived but was severely damaged. Contents appear to have been crushed. Photos attached.",
      photos: JSON.stringify(["photo1.jpg", "photo2.jpg"]),
      severity: "medium",
      status: "in_progress",
      consent: true,
      assignedTo: "Admin User",
    },
    {
      reporterName: "Emily Rodriguez",
      reporterEmail: "emily.rodriguez@example.com",
      reporterPhone: null,
      incidentType: "tampered",
      carrier: "UPS",
      trackingNumber: "1Z999AA10123456784",
      expectedDeliveryDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      noticedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      description: "Package appeared to have been opened and resealed. Tape was cut and replaced. Contents were missing.",
      photos: JSON.stringify(["tampered1.jpg"]),
      severity: "high",
      status: "submitted",
      consent: true,
      assignedTo: null,
    },
    {
      reporterName: "David Kim",
      reporterEmail: "david.kim@example.com",
      reporterPhone: "+1-555-0104",
      incidentType: "delayed",
      carrier: "USPS",
      trackingNumber: "9400111899223197428491",
      expectedDeliveryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      noticedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      description: "Package has been delayed for over a week. Tracking shows it's been stuck at a distribution center.",
      photos: null,
      severity: "low",
      status: "resolved",
      consent: true,
      assignedTo: "Admin User",
    },
    {
      reporterName: "Jessica Martinez",
      reporterEmail: "jessica.martinez@example.com",
      reporterPhone: "+1-555-0105",
      incidentType: "lost",
      carrier: "Amazon",
      trackingNumber: "TBA1234567890123",
      expectedDeliveryDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      noticedDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
      description: "Package was marked as delivered but I never received it. Checked with neighbors and building management.",
      photos: null,
      severity: "high",
      status: "closed",
      consent: true,
      assignedTo: "Admin User",
    },
  ];

  const createdIncidents: any[] = [];

  for (const incidentData of incidentsData) {
    try {
      const [incident] = await db
        .insert(lostmailIncidents)
        .values(incidentData)
        .returning();
      createdIncidents.push(incident);
      console.log(`Created incident: ${incidentData.incidentType} - ${incidentData.trackingNumber}`);
    } catch (error) {
      console.log(`Error creating incident:`, error);
    }
  }

  // Create audit trail entries for some incidents
  if (createdIncidents.length > 0) {
    const auditTrailData = [
      {
        incidentId: createdIncidents[1].id, // Damaged package
        adminName: "Admin User",
        action: "status_change",
        note: "Changed status to in_progress. Contacting carrier for investigation.",
      },
      {
        incidentId: createdIncidents[1].id,
        adminName: "Admin User",
        action: "assigned",
        note: "Assigned to Admin User for follow-up.",
      },
      {
        incidentId: createdIncidents[3].id, // Delayed package
        adminName: "Admin User",
        action: "status_change",
        note: "Package located and rerouted. Expected delivery updated.",
      },
      {
        incidentId: createdIncidents[3].id,
        adminName: "Admin User",
        action: "note_added",
        note: "Resolved - Package delivered successfully.",
      },
    ];

    for (const auditData of auditTrailData) {
      try {
        await db.insert(lostmailAuditTrail).values(auditData);
        console.log(`Created audit trail entry for incident ${auditData.incidentId}`);
      } catch (error) {
        console.log(`Error creating audit trail entry:`, error);
      }
    }
  }

  // Seed LostMail announcements
  const announcementsData: InsertLostmailAnnouncement[] = [
    {
      title: "Report Mail Incidents",
      content: "If you experience lost, damaged, tampered, or delayed mail, please report it using this system. We take all incidents seriously and will investigate promptly.",
      type: "info",
      isActive: true,
      expiresAt: null,
    },
    {
      title: "Privacy and Consent",
      content: "By reporting an incident, you consent to having your information shared with carriers and authorities as needed for investigation. Your privacy is important to us.",
      type: "info",
      isActive: true,
      expiresAt: null,
    },
    {
      title: "System Maintenance",
      content: "The incident reporting system will be under maintenance on Sunday, March 15th from 2-4 AM EST. Reports submitted during this time will be queued.",
      type: "maintenance",
      isActive: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  ];

  for (const announcementData of announcementsData) {
    try {
      await db.insert(lostmailAnnouncements).values(announcementData);
      console.log(`Created LostMail announcement: ${announcementData.title}`);
    } catch (error) {
      console.log(`Error creating announcement "${announcementData.title}":`, error);
    }
  }

  console.log("\n✅ LostMail seed data created successfully!");
  console.log("\nSummary:");
  console.log(`- ${incidentsData.length} incidents created`);
  console.log(`  - ${incidentsData.filter(i => i.incidentType === 'lost').length} lost`);
  console.log(`  - ${incidentsData.filter(i => i.incidentType === 'damaged').length} damaged`);
  console.log(`  - ${incidentsData.filter(i => i.incidentType === 'tampered').length} tampered`);
  console.log(`  - ${incidentsData.filter(i => i.incidentType === 'delayed').length} delayed`);
  console.log(`- ${auditTrailData.length} audit trail entries created`);
  console.log(`- ${announcementsData.length} announcements created`);

  process.exit(0);
}

seedLostMail().catch((error) => {
  console.error("Error seeding LostMail data:", error);
  process.exit(1);
});


