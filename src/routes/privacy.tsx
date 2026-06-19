import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacy")({
  component: PrivacyScreen,
});

function PrivacyScreen() {
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

        <h1 className="text-2xl font-bold mb-1">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-6">Effective Date: March 12, 2026</p>

        <section className="space-y-6 text-sm leading-relaxed">
          <div>
            <h2 className="font-bold mb-1">1. Data We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-semibold">Account Data:</span> Email address and profile information provided during registration.</li>
              <li><span className="font-semibold">Business Data:</span> Business type, industry/area, and any transactions, categories, amounts, dates, and notes you log in the app to estimate your taxes.</li>
              <li><span className="font-semibold">Usage Data:</span> App interactions, feature usage, and device type, used to improve the product.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-bold mb-1">2. How We Use Data</h2>
            <p>We use your data to calculate estimated figures for your Form 11 report, personalize categories and suggestions, process subscriptions, and improve app functionality. We do not sell your personal or financial data to third parties.</p>
          </div>

          <div>
            <h2 className="font-bold mb-1">3. Third-Party Services</h2>
            <p>We use Supabase for secure database and authentication, and Apple for payment processing of in-app subscriptions. These services have their own privacy policies.</p>
          </div>

          <div>
            <h2 className="font-bold mb-1">4. Data Retention and Deletion</h2>
            <p>You can delete all of your transactions and adjustments at any time from the Settings screen, or request full account deletion by contacting our support.</p>
          </div>

          <div>
            <h2 className="font-bold mb-1">5. Security</h2>
            <p>We implement industry-standard security measures to protect your information. However, no method of transmission over the internet is 100% secure.</p>
          </div>

          <div>
            <h2 className="font-bold mb-1">6. Contact Us</h2>
            <p>For any privacy-related questions, please contact: <a href="mailto:help@iwealthy.app" className="underline">help@iwealthy.app</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}
