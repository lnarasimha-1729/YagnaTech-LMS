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
  Send
} from "lucide-react";

const Contact = () => {
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
                <CardContent className="p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="Your first name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Your last name" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="your.email@example.com" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" placeholder="What is this regarding?" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Tell us how we can help you..."
                      rows={6}
                    />
                  </div>

                  <Button className="w-full bg-gradient-hero border-0" size="lg">
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
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