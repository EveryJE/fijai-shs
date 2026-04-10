"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CheckCircle2Icon, Share2Icon, SparklesIcon, HeartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface DonationSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reference: string;
  amount: number;
  donorName?: string;
}

/**
 * Premium Success Modal for Donations
 * Features smooth animations, confetti-like impact, and institutional branding.
 */
export function DonationSuccessDialog({
  isOpen,
  onClose,
  reference,
  amount,
  donorName
}: DonationSuccessDialogProps) {
  const handleShare = async () => {
    const url = window.location.href;
    const title = "Support Fijai SHS Alumni Fund";
    const text = `I just contributed to the Fijai SHS Alumni Fund! Join me in making an institutional impact.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard! Spread the impact.");
      }
    } catch (error) {
      if ((error as any).name !== "AbortError") {
        console.error("Error sharing:", error);
        toast.error("Could not share. Please copy the URL manually.");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none bg-transparent shadow-none">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded overflow-hidden"
            >
              {/* Top Banner with Gradient */}
              <div className="bg-gradient-to-br from-[#730303] to-[#9c0404] px-6 py-4 text-center relative overflow-hidden">
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative z-10"
                >
                
                  <h2 className="text-xl font-semibold text-white ">Contribution Sealed</h2>
                  <p className="text-white/80 text-sm">Thank you for your institutional impact</p>
                </motion.div>
                
                {/* Background Sparkles Animation */}
                <div className="absolute inset-0 opacity-10">
                    <SparklesIcon className="absolute top-4 left-4 w-12 h-12 animate-pulse" />
                    <HeartIcon className="absolute bottom-4 right-4 w-16 h-16 animate-bounce" />
                </div>
              </div>

              {/* Transaction Details */}
              <div className="p-8 space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Impact Reference</span>
                    <span className="font-mono text-sm font-medium text-[#730303]">{reference.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Amount Established</span>
                    <span className="text-sm text-[#730303]">GHS {amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Donor Designation</span>
                    <span className="text-sm ">{donorName || "Anonymous Alumnus"}</span>
                  </div>
                </div>

                <div className="bg-emerald-50 rounded px-4 py-4 border border-emerald-100 italic text-center">
                    <p className="text-sm text-emerald-800 font-medium">
                        "Great things involve many people, and your impact has been recognized as a cornerstone of this campaign."
                        <br />
                        
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                        onClick={onClose}
                        variant="outline" 
                        className=""
                    >
                        Close Registry
                    </Button>
                    <Button 
                        className=""
                        onClick={handleShare}
                    >
                        <Share2Icon className="w-3 h-3 mr-2" />
                        Spread the Impact
                    </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
