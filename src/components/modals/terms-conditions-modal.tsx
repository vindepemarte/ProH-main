"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

interface TermsConditionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showAcceptButton?: boolean;
  onAccept?: () => void;
}

export default function TermsConditionsModal({ 
  open, 
  onOpenChange, 
  showAcceptButton = false, 
  onAccept 
}: TermsConditionsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col bg-background/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Terms and Conditions
          </DialogTitle>
          <DialogDescription>
            Please read our terms and conditions carefully.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-1" style={{ maxHeight: 'calc(80vh - 140px)' }}>
          <div className="space-y-6 text-sm pb-4">
            {/* Placeholder Terms and Conditions Content */}
            <section>
              <h3 className="text-lg font-semibold mb-3">1. Acceptance of Terms</h3>
              <p className="mb-3">
                By accessing and using ProHappyAssignments ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">2. Service Description</h3>
              <p className="mb-3">
                ProHappyAssignments is a platform that connects students with educational service providers for academic assistance. We provide a marketplace where students can submit homework requests and qualified workers can provide educational support.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">3. User Responsibilities</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Users must provide accurate and complete information when registering</li>
                <li>Users are responsible for maintaining the confidentiality of their account credentials</li>
                <li>Users must not engage in any fraudulent or illegal activities</li>
                <li>Academic integrity guidelines must be followed at all times</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">4. Payment Terms</h3>
              <p className="mb-3">
                Payment for services must be made in accordance with the pricing structure displayed on the platform. All prices are in GBP and include applicable taxes. Refunds may be processed under specific circumstances as outlined in our refund policy.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">5. Intellectual Property</h3>
              <p className="mb-3">
                All content provided through the Service, including but not limited to text, graphics, logos, and software, is the property of ProHappyAssignments or its content suppliers and is protected by copyright and other intellectual property laws.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">6. Privacy Policy</h3>
              <p className="mb-3">
                We are committed to protecting your privacy. Our Privacy Policy explains how we collect, use, and protect your information when you use our Service. By using the Service, you consent to our Privacy Policy.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">7. Limitation of Liability</h3>
              <p className="mb-3">
                ProHappyAssignments shall not be liable for any direct, indirect, incidental, special, or consequential damages arising out of or in any way connected with the use of the Service or with the delay or inability to use the Service.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">8. Termination</h3>
              <p className="mb-3">
                We reserve the right to terminate or suspend your account and access to the Service at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users of the Service.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">9. Changes to Terms</h3>
              <p className="mb-3">
                We reserve the right to modify these Terms at any time. We will notify users of any significant changes via email or through the Service. Continued use of the Service after such modifications constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">10. Contact Information</h3>
              <p className="mb-3">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium">ProHappyAssignments</p>
                <p>Email: legal@prohappya.uk</p>
                <p>Address: [To be updated]</p>
              </div>
            </section>

            <section className="text-xs text-muted-foreground border-t pt-4 mt-6">
              <p>Last updated: [Date to be updated]</p>
              <p>This is placeholder content and will be updated with actual legal terms.</p>
            </section>
          </div>
        </ScrollArea>
        
        <DialogFooter className="gap-3 sm:gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {showAcceptButton && onAccept && (
            <Button onClick={() => { onAccept(); onOpenChange(false); }}>
              Accept Terms
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}