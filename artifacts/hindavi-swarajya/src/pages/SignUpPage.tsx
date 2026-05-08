import { SignUp } from "@clerk/react";
import { Link } from "wouter";
import { Logo } from "@/components/Logo";
import { shadcn } from "@clerk/themes";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const appearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#FF6F00",
    colorForeground: "#111827",
    colorMutedForeground: "#6B7280",
    colorDanger: "#DC2626",
    colorBackground: "#FFFFFF",
    colorInput: "#F9FAFB",
    colorInputForeground: "#111827",
    colorNeutral: "#E5E7EB",
    fontFamily: "inherit",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-gray-100",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-gray-900 font-bold font-serif",
    headerSubtitle: "text-gray-500",
    socialButtonsBlockButtonText: "text-gray-700 font-medium",
    formFieldLabel: "text-gray-700 font-medium",
    footerActionLink: "text-[#FF6F00] font-semibold hover:text-[#E65100]",
    footerActionText: "text-gray-500",
    dividerText: "text-gray-400",
    identityPreviewEditButton: "text-[#FF6F00]",
    formFieldSuccessText: "text-green-600",
    alertText: "text-gray-700",
    logoBox: "flex justify-center",
    logoImage: "w-12 h-12",
    socialButtonsBlockButton: "border border-gray-200 bg-white hover:bg-gray-50 text-gray-700",
    formButtonPrimary: "bg-[#FF6F00] hover:bg-[#E65100] text-white font-semibold",
    formFieldInput: "bg-gray-50 border-gray-200 text-gray-900 rounded-xl focus:border-[#FF6F00] focus:ring-[#FF6F00]",
    footerAction: "bg-gray-50 border-t border-gray-100",
    dividerLine: "bg-gray-200",
    alert: "border border-red-100 bg-red-50 rounded-xl",
    otpCodeFieldInput: "border-gray-200 bg-gray-50 text-gray-900",
    formFieldRow: "gap-3",
    main: "p-6",
  },
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50/30 flex flex-col">
      {/* Minimal nav */}
      <div className="p-4 flex items-center gap-2.5">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <Logo className="h-9 w-auto" />
          </div>
        </Link>
      </div>

      {/* Centered sign-up form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        <div className="text-center mb-6">
          <p className="text-sm text-[#FF6F00] font-medium font-serif">
            "सेवा परमो धर्म:"
          </p>
          <p className="text-xs text-gray-400 mt-1">Join thousands of sevaks across India</p>
        </div>
        <SignUp
          routing="path"
          path={`${basePath}/sign-up`}
          signInUrl={`${basePath}/sign-in`}
          appearance={appearance}
        />
      </div>
    </div>
  );
}
