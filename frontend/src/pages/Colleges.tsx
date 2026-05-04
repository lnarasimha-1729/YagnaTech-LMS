import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Globe,
  GraduationCap,
  Building2,
  Handshake,
} from "lucide-react";

const Colleges = () => {
 
  const featuredCourses = [
    {
      id: 1,
      icon: Handshake, // Hands-On Experience: Handshake for practical collaboration
      title: "Hands-On Experience",
      description: "We provide structured career launch opportunities that allow students to apply classroom knowledge to real-world projects.",
    },
    {
      id: 2,
      icon: GraduationCap, // Enhanced Employability: GraduationCap for employability
      title: "Enhanced Employability",
      description: "Our program significantly increases student employability, providing them with the confidence and practical skills needed to secure top jobs and excel in their careers.",
    },
    {
      id: 3,
      icon: Globe, // Career Pathways: Globe for global/career opportunities
      title: "Career Pathways",
      description: "The internships we facilitate give students a clear career path and a crucial head start in their chosen field.",
    },
    {
      id: 4,
      icon: Building2, // Top Performer Placement Guarantee: Building2 for corporate/placement
      title: "Top Performer Placement Guarantee",
      description: "Your top students await direct job offers in AI/ML from our corporate partners. This provides immediate career impact and solidifies your institution's reputation as a premier pipeline for future-ready tech professionals.",
    }
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-subtle">
        <div className="container-ngo">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Empower Students{" "}
                <span className="text-gradient">for Success</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
               In today's competitive job market, practical experience is just as crucial as a degree. Our NGO's career launch programs are designed to bridge the gap between academic knowledge and real-world application, ensuring students graduate with a competitive edge. By partnering with us, you can equip your students with the hands-on experience and professional network employers demand.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-hero border-0 text-lg px-8" asChild>
                <Link to="/signup">Partner with Us</Link>
              </Button>
              {/* <Button variant="outline" size="lg" className="text-lg px-8" asChild>
                <Link to="/contact">Need Guidance?</Link>
              </Button> */}
            </div>

            {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-gradient">25+</div>
                <div className="text-sm text-muted-foreground">Courses Available</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-gradient">5,000+</div>
                <div className="text-sm text-muted-foreground">Active Learners</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-gradient">95%</div>
                <div className="text-sm text-muted-foreground">Completion Rate</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-gradient">4.8★</div>
                <div className="text-sm text-muted-foreground">Average Rating</div>
              </div>
            </div> */}
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="section-padding bg-gradient-subtle">
        <div className="container-ngo">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">
              Why Partner <span className="text-gradient">With Us?</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredCourses.map((course) => (
              <Card key={course.id} className="card-ngo border-2 border-warm-green group overflow-hidden flex flex-col h-full">
  <CardHeader className="space-y-4">
    <div className="flex items-start justify-between">
      <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center">
        <course.icon className="w-6 h-6 text-white" />
      </div>
    </div>

    <div className="space-y-2">
      <CardTitle className="text-lg group-hover:text-primary transition-colors">
        {course.title}
      </CardTitle>
      <CardDescription className="leading-relaxed">
        {course.description}
      </CardDescription>
    </div>
  </CardHeader>
</Card>

            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-subtle">
        <div className="container-ngo">
          <div className="card-ngo max-w-4xl mx-auto text-center p-8 lg:p-12 space-y-8 bg-gradient-hero">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Ready to get started?
              </h2>
              <p className="text-lg text-white/90 max-w-2xl mx-auto">
                By joining our mission, you’re not just preparing students for a job; you’re setting them up for a successful and fulfilling career. Let's work together to shape the next generation of leaders.
              </p>
              <p className="text-lg text-white/90 max-w-2xl mx-auto">
                Contact us today to learn more about our college partnership programs.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
                <Link to="/signup">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Colleges;