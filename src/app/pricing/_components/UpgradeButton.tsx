import { Zap } from "lucide-react";
import Link from "next/link";

export const UpgradeButton = () => {
  const CHEKOUT_URL = process.env.LEMON_SQUEEZY_URL!;

  return (
    <Link
      href={CHEKOUT_URL}
      className="inline-flex items-center justify-center gap-2 px-8 py-4 text-white 
        bg-linear-to-r from-blue-500 to-blue-600 rounded-lg 
        hover:from-blue-600 hover:to-blue-700 transition-all"
    >
      <Zap className="w-5 h-5" />
      Upgrade to Pro
    </Link>
  );
};
