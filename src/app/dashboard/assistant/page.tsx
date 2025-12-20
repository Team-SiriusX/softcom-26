/**
 * Voice Assistant Dashboard Page
 *
 * Full-page voice-enabled RAG assistant for the financial dashboard.
 */

"use client";

import { VoiceAssistant } from "@/components/assistant";
import { useSelectedBusiness } from "@/components/providers/business-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AssistantPage() {
  const { selectedBusinessId } = useSelectedBusiness();

  if (!selectedBusinessId) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Business Selected</AlertTitle>
          <AlertDescription>
            Please select a business from the header or{" "}
            <Link href="/business" className="font-medium underline">
              create a new one
            </Link>
            .
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      <VoiceAssistant className="h-full w-full rounded-none border-0" />
    </div>
  );
}
