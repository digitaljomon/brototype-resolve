import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mail, Phone, MessageCircle } from "lucide-react";

export default function StudentHelp() {
  const faqs = [
    {
      question: "How do I submit a complaint?",
      answer: "Click on 'File a Complaint' from the sidebar, fill in the required details including title, description, category, and priority, then click Submit. You'll receive a confirmation once submitted.",
    },
    {
      question: "How long does it take to get a response?",
      answer: "Most complaints are reviewed within 24-48 hours. High priority complaints are typically addressed faster. You'll receive notifications as your complaint status updates.",
    },
    {
      question: "Can I edit my complaint after submission?",
      answer: "Yes, you can update your complaint details from the 'My Complaints' page. Click on the complaint and select 'Edit' to make changes.",
    },
    {
      question: "How do I track my complaint status?",
      answer: "Go to 'My Complaints' to see all your submitted complaints and their current status. You can also enable notifications to get real-time updates.",
    },
    {
      question: "What do the different status labels mean?",
      answer: "Pending: Awaiting review | In Progress: Being worked on | Resolved: Issue fixed | Rejected: Not actionable at this time",
    },
    {
      question: "Can I attach files to my complaint?",
      answer: "Yes, you can attach images, documents, or other relevant files when submitting or updating a complaint. This helps us better understand and resolve your issue.",
    },
  ];

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Help & FAQ</h1>
        <p className="text-muted-foreground">Find answers to common questions</p>
      </div>

      <div className="grid gap-6">
        {/* FAQs */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>Quick answers to common questions</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
            <CardDescription>Need more help? Reach out to us</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Email Support</p>
                <p className="text-sm text-muted-foreground">support@brototype.com</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Phone Support</p>
                <p className="text-sm text-muted-foreground">+91 1234567890</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <MessageCircle className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Live Chat</p>
                <p className="text-sm text-muted-foreground">Available Mon-Fri, 9AM-6PM</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Community Guidelines */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Community Guidelines</CardTitle>
            <CardDescription>Please follow these guidelines when submitting complaints</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Be respectful and professional in all communications</li>
              <li>• Provide clear and detailed information about your issue</li>
              <li>• Attach relevant files or screenshots when possible</li>
              <li>• Select the appropriate category and priority for your complaint</li>
              <li>• Avoid submitting duplicate complaints</li>
              <li>• Check your notifications regularly for updates</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
