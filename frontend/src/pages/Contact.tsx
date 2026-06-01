import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Users,
  Heart,
  MessageCircle,
  HelpCircle,
  Briefcase,
  Globe,
  Send,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { sendContactMessage } from "@/api/contactApi";

const Contact = () => {
  // Controlled contact form. Posts to /api/public/contact (admin-service),
  // which stores the message and emails the admin.
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form, v: string) =>
    setForm((s) => ({ ...s, [k]: v }));

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const canSubmit =
    form.firstName.trim() && emailValid && form.message.trim() && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.firstName.trim()) return setError("Please enter your first name.");
    if (!emailValid) return setError("Please enter a valid email address.");
    if (!form.message.trim()) return setError("Please enter a message.");

    setSubmitting(true);
    try {
      await sendContactMessage({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || undefined,
        email: form.email.trim(),
        subject: form.subject.trim() || undefined,
        message: form.message.trim(),
      });
      setSent(true);
      setForm({ firstName: "", lastName: "", email: "", subject: "", message: "" });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Failed to send your message. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };
  const contactMethods = [
    {
      icon: Mail,
      title: "Email Us",
      primary: "info@yagnatech.org",
      // secondary: "support@eduhope.org",
      description: "General inquiries and support"
    },
    {
      icon: Phone,
      title: "Call Us",
      primary: "+91 9491829495",
      // secondary: "Mon-Fri 9AM-6PM EST",
      description: "Phone support available"
    },
    // {
    //   icon: MapPin,
    //   title: "Visit Us",
    //   primary: "Guntur, Andhra Pradesh, India",
    //   secondary: "Learning City, LC 12345",
    //   description: "Our main office location"
    // },
    // {
    //   icon: Clock,
    //   title: "Office Hours",
    //   primary: "Monday - Friday",
    //   secondary: "9:00 AM - 6:00 PM EST",
    //   description: "We're here to help"
    // }
  ];

  const supportTypes = [
    {
      icon: HelpCircle,
      title: "General Support",
      description: "Questions about courses, certificates, or technical issues",
      // contact: "support@eduhope.org"
    },
    {
      icon: Users,
      title: "Student Services",
      description: "Academic support, mentoring, and learning guidance",
      // contact: "students@eduhope.org"
    },
    {
      icon: Briefcase,
      title: "Partnerships",
      description: "Collaboration opportunities and institutional partnerships",
      // contact: "partnerships@eduhope.org"
    },
    {
      icon: Heart,
      title: "Donations & Volunteering",
      description: "Ways to support our mission and get involved",
      // contact: "giving@eduhope.org"
    }
  ];


  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="section-padding">
        <div className="container-ngo">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Get in <span className="text-gradient">Touch</span>
              </h1>
              {/* <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                We're here to help you succeed. Whether you have questions about our opportunities, 
                need technical support, or want to explore partnership opportunities - we'd love to hear from you.
              </p> */}
            </div>

            {/* <div className="flex items-center justify-center space-x-6 text-muted-foreground">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                <span>Quick Response</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary" />
                <span>Friendly Support</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-primary" />
                <span>Global Community</span>
              </div>
            </div> */}
          </div>
        </div>
      </section>

      {/* Contact Methods Section */}
      <section className="section-padding">
        <div className="container-ngo">
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6 mb-16 max-w-3xl flex justify-center mx-auto">
            {contactMethods.map((method, index) => (
              <Card key={index} className="card-ngo border-0 text-center border-2 border-warm-green rounded-xl">
                <CardHeader className="space-y-4">
                  <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto">
                    <method.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{method.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="font-semibold">{method.primary}</div>
                  {/* <div className="text-muted-foreground">{method.secondary}</div> */}
                  <CardDescription>{method.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
<div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">
                  How can we <span className="text-gradient">Help</span>?
                </h2>
                <p className="text-muted-foreground">
                  Choose the right department for faster assistance.
                </p>
              </div>

              <div className="space-y-4">
                {supportTypes.map((type, index) => (
                  <Card key={index} className="card-ngo border-0">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center flex-shrink-0">
                          <type.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="space-y-2 flex-1">
                          <h3 className="font-semibold">{type.title}</h3>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                          {/* <div className="text-sm text-primary font-medium">{type.contact}</div> */}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">
                  Send us a <span className="text-gradient">Message</span>
                </h2>
                <p className="text-muted-foreground">
                  Fill out the form below and we'll get back to you.
                </p>
              </div>

              <Card className="card-ngo border-0">
                <CardContent className="p-6">
                  {sent ? (
                    <div className="py-10 text-center space-y-3">
                      <CheckCircle2 className="w-12 h-12 text-warm-green mx-auto" />
                      <h3 className="text-xl font-semibold">Message sent!</h3>
                      <p className="text-muted-foreground">
                        Thanks for reaching out — we'll get back to you soon.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setSent(false)}
                        className="mt-2"
                      >
                        Send another message
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {error && (
                        <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
                          {error}
                        </div>
                      )}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            placeholder="Your first name"
                            value={form.firstName}
                            onChange={(e) => set("firstName", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            placeholder="Your last name"
                            value={form.lastName}
                            onChange={(e) => set("lastName", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={form.email}
                          onChange={(e) => set("email", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          placeholder="What is this regarding?"
                          value={form.subject}
                          onChange={(e) => set("subject", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          placeholder="Tell us how we can help you..."
                          rows={6}
                          value={form.message}
                          onChange={(e) => set("message", e.target.value)}
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={!canSubmit}
                        className="w-full bg-gradient-hero border-0 disabled:opacity-60"
                        size="lg"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending…
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Support Types */}
            
          </div>
        </div>
      </section>


      {/* Community Section */}
      {/* <section className="section-padding">
        <div className="container-ngo">
          <div className="card-ngo max-w-4xl mx-auto text-center p-8 lg:p-12 space-y-8 bg-gradient-hero">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Join Our Community
              </h2>
              <p className="text-lg text-white/90 max-w-2xl mx-auto">
                Connect with fellow learners, share your progress, and get support from 
                our global community of students and mentors.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Community Forum
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 border-white text-primary hover:bg-white hover:text-primary">
                Student Discord
              </Button>
            </div>

            <div className="flex items-center justify-center space-x-2 text-white/80">
              <Users className="w-5 h-5" />
              <span className="text-sm">5,000+ active community members worldwide</span>
            </div>
          </div>
        </div>
      </section> */}
    </div>
  );
};

export default Contact;