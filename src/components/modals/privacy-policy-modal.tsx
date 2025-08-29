"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield } from "lucide-react";

interface PrivacyPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PrivacyPolicyModal({ open, onOpenChange }: PrivacyPolicyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col bg-background/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy Policy
          </DialogTitle>
          <DialogDescription>
            How we collect, use, and protect your personal information.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-1" style={{ maxHeight: 'calc(80vh - 140px)' }}>
          <div className="space-y-6 text-sm pb-4">
            {/* Placeholder Privacy Policy Content */}
            <section>
              <h3 className="text-lg font-semibold mb-3">1. Information We Collect</h3>
              <div className="space-y-3">
                <h4 className="font-medium">Personal Information</h4>
                <p className="mb-3">
                  We collect information you provide directly to us when you create an account, submit homework requests, or contact us. This may include:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Name and contact information (email address)</li>
                  <li>Account credentials and authentication data</li>
                  <li>Academic information (assignments, deadlines, notes)</li>
                  <li>Payment and billing information</li>
                  <li>Communication records and correspondence</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">2. How We Use Your Information</h3>
              <p className="mb-3">We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our educational services</li>
                <li>Process homework submissions and facilitate academic assistance</li>
                <li>Communicate with you about your account, assignments, and our services</li>
                <li>Process payments and manage billing</li>
                <li>Send you technical notices, updates, and administrative messages</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Monitor and analyze trends, usage, and activities in connection with our service</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">3. Information Sharing and Disclosure</h3>
              <p className="mb-3">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Service Providers:</strong> With qualified educational professionals who assist with your academic work</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                <li><strong>Business Transfers:</strong> In connection with any merger, sale of assets, or acquisition</li>
                <li><strong>Consent:</strong> With your explicit consent for specific purposes</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">4. Data Security</h3>
              <p className="mb-3">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Staff training on data protection practices</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">5. Your Rights Under GDPR</h3>
              <p className="mb-3">
                If you are in the European Economic Area (EEA), you have certain data protection rights:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Right to Access:</strong> Request copies of your personal data</li>
                <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Right to Restrict Processing:</strong> Request limitation of data processing</li>
                <li><strong>Right to Data Portability:</strong> Request transfer of your data</li>
                <li><strong>Right to Object:</strong> Object to our processing of your data</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, please contact us at privacy@prohappya.uk
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">6. Cookies and Tracking Technologies</h3>
              <p className="mb-3">
                We use cookies and similar tracking technologies to collect and use information about you. Our Cookie Policy explains what cookies are, how we use them, and your choices regarding cookies.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">7. Data Retention</h3>
              <p className="mb-3">
                We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. We will also retain and use your information as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">8. International Data Transfers</h3>
              <p className="mb-3">
                Your information may be transferred to and maintained on servers located outside your state, province, or country where data protection laws may differ. We ensure appropriate safeguards are in place for such transfers.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">9. Children's Privacy</h3>
              <p className="mb-3">
                Our service is not directed to children under 13 years of age. We do not knowingly collect personal information from children under 13. If we learn we have collected personal information from a child under 13, we will delete such information promptly.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">10. Changes to This Privacy Policy</h3>
              <p className="mb-3">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">11. Contact Us</h3>
              <p className="mb-3">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium">ProHappyAssignments</p>
                <p>Email: privacy@prohappya.uk</p>
                <p>Data Protection Officer: dpo@prohappya.uk</p>
                <p>Address: [To be updated]</p>
              </div>
            </section>

            <section className="text-xs text-muted-foreground border-t pt-4 mt-6">
              <p>Last updated: [Date to be updated]</p>
              <p>This is placeholder content and will be updated with actual privacy policy terms.</p>
            </section>
          </div>
        </ScrollArea>
        
        <DialogFooter className="gap-3 sm:gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}