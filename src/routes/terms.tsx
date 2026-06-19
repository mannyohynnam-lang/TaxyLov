import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/terms")({
  component: TermsScreen,
});

function TermsScreen() {
  const router = useRouter();

  return (
    <div className="min-h-screen overflow-y-auto bg-white text-black font-sans">
      <div className="px-4 py-6 pb-32 max-w-2xl mx-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.history.back()}
          className="mb-4 text-black hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <h1 className="text-2xl font-bold mb-1">Terms of Use (EULA)</h1>
        <p className="text-sm text-gray-500 mb-6">Effective Date: March 12, 2026</p>

        <section className="space-y-6 text-sm leading-relaxed">
          <div>
            <h2 className="font-bold mb-1">1. Acceptance of Terms</h2>
            <p>By downloading or using the Taxy application, you agree to be bound by these Terms of Use and our Privacy Policy.</p>
          </div>

          <div>
            <h2 className="font-bold mb-1">2. Informational Purpose</h2>
            <p>Taxy helps self-employed users in Ireland log income and expenses and generate an estimated Form 11 overview.</p>
            <p className="mt-1 font-semibold">Important: All figures and reports in the app are estimates only and do not constitute professional tax, accounting, financial, or legal advice. Always confirm with a qualified accountant before filing with Revenue.</p>
          </div>

          <div>
            <h2 className="font-bold mb-1">3. Subscriptions (In-App Purchases)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Taxy offers Monthly and Yearly subscription plans, and may offer a free trial period.</li>
              <li>Payments are processed via your Apple ID Account at confirmation of purchase.</li>
              <li>Subscriptions automatically renew unless auto-renew is turned off at least 24 hours before the end of the current period.</li>
              <li>You can manage or cancel subscriptions in your App Store Account Settings.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-bold mb-1">4. Your Data and Responsibility</h2>
            <p>You are responsible for the accuracy of the information you enter and for the final figures you submit to Revenue. Taxy is a tool that assists with organizing your data but does not file taxes on your behalf.</p>
          </div>

          <div>
            <h2 className="font-bold mb-1">5. User Conduct</h2>
            <p>You agree not to use the app for any illegal activities or to attempt to reverse-engineer the software.</p>
          </div>

          <div>
            <h2 className="font-bold mb-1">6. Limitation of Liability</h2>
            <p>Taxy is not responsible for any tax penalties, financial losses, or other damages incurred based on the estimates or material provided within the app. Always verify your figures with a qualified accountant before filing.</p>
          </div>

          <div>
            <h2 className="font-bold mb-1">7. Contact Us</h2>
            <p>For questions about these Terms, please contact: <a href="mailto:help@iwealthy.app" className="underline">help@iwealthy.app</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}
