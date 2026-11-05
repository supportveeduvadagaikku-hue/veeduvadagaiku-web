import React from 'react';
import { SEOHead } from '../../components/common/SEOHead';
import { DeepavaliPlansShowcase } from '../../components/plans/DeepavaliPlansShowcase';
import { ShieldCheck } from 'lucide-react';
import { RazorpayCheckoutButton } from '../../components/payment/RazorpayCheckoutButton';

export const ListingPlansPage: React.FC = () => {
  return (
    <div className="space-y-8 pb-12 -mx-4 sm:-mx-6 lg:-mx-8">
      <SEOHead title="Listing Plans & Deepavali Pricing | Veedu Vadagaikku Chennai" />

      {/* Render the full Deepavali model showcase with same colors & structure */}
      <DeepavaliPlansShowcase isOwnerView={true} />

      {/* Payment Security & Sandbox Verification Strip */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 bg-white rounded-3xl border border-[#e8d5cb] shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#fff5e6] text-[#f59e0b] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Razorpay Standard Checkout &amp; Verification</h3>
              <p className="text-xs text-gray-500">
                Safe Indian Payments: All transactions are processed via Razorpay (UPI, GPay, PhonePe, Cards, Net Banking) with HMAC-SHA256 signature verification.
              </p>
            </div>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-medium">
              Payment Gateway Sandbox Testing: Verify Razorpay Checkout modal
            </span>
            <div className="w-full sm:w-auto">
              <RazorpayCheckoutButton
                amount={100}
                description="Razorpay Checkout Test"
                className="px-5 py-2.5 bg-gradient-to-r from-[#7D4D2B] via-[#9E6941] to-[#7D4D2B] hover:brightness-110 text-white font-bold text-xs rounded-full shadow-sm active:scale-95 transition border border-[#D4A373]/40"
              >
                Test Razorpay Modal (₹1)
              </RazorpayCheckoutButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
