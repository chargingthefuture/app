import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Terms() {
  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">Terms and Conditions</CardTitle>
          <p className="text-sm text-muted-foreground">Last updated: November 24, 2025</p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
            <div className="space-y-6 text-sm sm:text-base">
              <p className="text-muted-foreground">
                By registering for, accessing, or using this platform (the "Service"), you agree to these Terms and Conditions ("Terms"). If you do not agree, do not use the Service.
              </p>

              <section>
                <h2 className="text-xl font-semibold mb-3">1. Definitions</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>"Service"</strong> means the invite-only platform and any associated features, mini-applications, modules (including SupportMatch and LightHouse), content, and communications.</li>
                  <li><strong>"User," "you," or "your"</strong> means any individual who registers for or uses the Service.</li>
                  <li><strong>"Provider" or "we"</strong> means the platform operator, a sole proprietor running the Service.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Eligibility and Invitation</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>The Service is invite-only and available only to individuals who receive an invitation and complete registration.</li>
                  <li>You represent and warrant that you are legally competent to enter into these Terms and that registration and use comply with applicable laws.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. Scope of Service and No Professional Advice</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>The Service provides support-service management tools, matchmaking for accountability partners (SupportMatch), housing matching (LightHouse), payment tracking, and a flexible product catalog for support services.</li>
                  <li>The Service is a technology platform facilitating connections and administrative functions only. We do not provide medical, legal, mental health, suicide prevention, or other professional services.</li>
                  <li>All content and interactions on the Service (including profiles, listings, messages, matches, recommendations, and third-party materials) are provided by Users or third parties and do not constitute professional advice, diagnosis, or treatment.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Emergency Situations; No Crisis Intervention</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>The Service is not intended for emergency or crisis use. If you or someone else is in immediate danger, call your local emergency number right away.</li>
                  <li>We do not monitor communications for emergencies and are not a crisis hotline. We expressly disclaim any obligation to provide crisis intervention, suicide prevention, or other emergency services.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. User Conduct; Safety and Privacy Responsibilities</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>You are solely responsible for your interactions with other Users and for verifying credentials, suitability, and safety of any services or persons found through the Service.</li>
                  <li>Do not rely on the Service for safety-critical decisions. Use caution when meeting anyone in person; follow independent safety practices (meet in public spaces, tell a trusted person your plans, verify identities).</li>
                  <li>You must not impersonate others, submit false or misleading information, or use the Service for unlawful activities.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Account, Invitations, and Access</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>You are responsible for maintaining the confidentiality and security of your account credentials and for all activities on your account.</li>
                  <li>We may suspend or terminate accounts for violations of these Terms, illegal activity, or behavior that threatens other Users.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Payments, Fees, and Refunds</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Subscription fees or payments for services available through the Service are described at purchase. All payments are non-refundable except where required by law or as explicitly stated.</li>
                  <li>We act as a technology facilitator for payments; individual service providers remain responsible for delivering any purchased support services.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Disclaimers and No Warranties</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.</li>
                  <li>WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE FROM HARMFUL COMPONENTS.</li>
                  <li>WE DO NOT GUARANTEE THE ACCURACY, RELIABILITY, OR SAFETY OF USER-PROVIDED CONTENT, MATCHES, OR HOUSING LISTINGS.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
                <p className="mb-2">TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE, OUR AFFILIATES, OFFICERS, EMPLOYEES, AGENTS, AND CONTRACTORS WILL NOT BE LIABLE FOR:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, EXEMPLARY, OR PUNITIVE DAMAGES;</li>
                  <li>LOSS OF PROFITS, REVENUE, GOODWILL, DATA, OR USE;</li>
                  <li>DAMAGES ARISING FROM THIRD-PARTY ACTIONS, USER-CONDUCT, OR USE OF THE SERVICE;</li>
                  <li>INJURY, HARM, OR DEATH ARISING OUT OF YOUR USE OF THE SERVICE OR RELIANCE ON INFORMATION FROM THE SERVICE.</li>
                </ul>
                <p className="mt-4">
                  OUR AGGREGATE LIABILITY FOR CLAIMS ARISING OUT OF THESE TERMS OR THE SERVICE IS LIMITED TO THE TOTAL AMOUNT OF FEES YOU PAID TO US IN THE SIX (6) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR, IF NO FEES WERE PAID, ONE HUNDRED DOLLARS (US $100), WHICHEVER IS LESS.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">10. Indemnification</h2>
                <p>You agree to indemnify, defend, and hold harmless us and our affiliates, officers, employees, agents, and contractors from and against any claims, liabilities, losses, damages, costs, and expenses (including reasonable attorneys' fees) arising from:</p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                  <li>Your breach of these Terms;</li>
                  <li>Your use of the Service or interactions with other Users;</li>
                  <li>Your violation of any law or third-party right.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">11. Third-Party Content and Links</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>The Service may contain links to third-party websites, services, or resources. We do not control and are not responsible for third-party content, practices, or availability.</li>
                  <li>Third-party providers or organizations that advertise or offer services through the Service are independent; we do not endorse or guarantee their services.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">12. Privacy</h2>
                <p>Our Privacy Policy explains how we collect, use, and disclose information. By using the Service you consent to those practices. (Do not include additional privacy representations here.)</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">13. Intellectual Property</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>We own or license all intellectual property rights in the Service (software, design, trademarks, logos, and content provided by us).</li>
                  <li>You may not copy, modify, distribute, reverse-engineer, or create derivative works from the Service except as expressly permitted in writing.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">14. Modifications to Service and Terms</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>We may modify or discontinue the Service (or any feature) at any time, with or without notice.</li>
                  <li>We may update these Terms; continued use after the effective date constitutes acceptance of the updated Terms. Material changes will be notified to Users when feasible.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">15. Governing Law and Dispute Resolution</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>These Terms are governed by the laws of the jurisdiction in which the Provider operates, without regard to conflict-of-law rules.</li>
                  <li>Any dispute arising out of or relating to these Terms or the Service will be resolved in the courts of that jurisdiction. You and we consent to exclusive personal jurisdiction and venue in those courts.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">16. Severability and Waiver</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>If any provision of these Terms is held invalid or unenforceable, the remaining provisions remain in full force.</li>
                  <li>Our failure to enforce any right or provision is not a waiver of that right.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">17. Entire Agreement</h2>
                <p>These Terms, together with any referenced policies (Privacy Policy, Acceptable Use Policy), constitute the entire agreement between you and us regarding the Service.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">18. Contact</h2>
                <p>For questions about these Terms, contact the account administrator or the contact provided during sign-up.</p>
              </section>

              <section className="pt-4 border-t">
                <p className="font-semibold">
                  By using the Service you acknowledge that you have read, understood, and agree to be bound by these Terms.
                </p>
              </section>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}









