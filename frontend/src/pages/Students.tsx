import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Award, GraduationCap, CheckCircle, Globe, Star, BookOpen } from "lucide-react";

const ADMIN_BASE =
  (import.meta.env.VITE_ADMIN_API_URL as string) || "http://localhost:4000";

interface FeaturedProgram {
  id: number;
  title: string;
  description: string;
  features: string[];
}

const Students = () => {
  // Featured Opportunities are the real active programs the admin created —
  // the same college-agnostic /api/public/programs source the Home page uses,
  // so "View More" on a Home program card lands here and shows the same set.
  // Inactive programs (active unchecked at creation) never surface.
  const [featuredCourses, setFeaturedCourses] = useState<FeaturedProgram[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get(`${ADMIN_BASE}/api/public/programs`, {
          timeout: 30000,
        });
        if (cancelled) return;
        const rows = Array.isArray(data?.programs) ? data.programs : [];
        setFeaturedCourses(
          rows.map((p: any) => ({
            id: Number(p.id),
            title: String(p.title || ""),
            description: String(p.tagline || ""),
            features: Array.isArray(p.features)
              ? p.features.map((f: any) => String(f).trim()).filter(Boolean)
              : [],
          })),
        );
      } catch {
        if (!cancelled) setFeaturedCourses([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="section-padding">
        <div className="container-ngo">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
               Our <span className="text-gradient"> Opportunities</span>
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="section-padding">
        <div className="container-ngo">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">
              Featured <span className="text-gradient">Opportunities</span>
            </h2>
          </div>

          {featuredCourses.length === 0 && (
            <p className="text-center text-muted-foreground">
              No opportunities available yet.
            </p>
          )}

          <div className="roadmapt grid md:grid-cols-2 lg:grid-cols-1 gap-8">
           {featuredCourses.map((course) => (
  <Card
    key={course.id}
    className="card-ngo  flex flex-col h-full p-8 space-y-6 border-0 border-2 border-warm-green rounded-xl"
  >
    {/* Header with Icon */}
    <CardHeader className="text-center space-y-4">
      <CardTitle className="text-4xl font-bold text-gradient py-2">
        {course.title}
      </CardTitle>
       <div className="w-44 h-2 mx-auto bg-gradient-hero rounded-full"></div>
    </CardHeader>

    <CardContent>
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column — Program Overview */}
        <div className="space-y-6">
          <div>
            <h3 className="flex items-center text-lg font-semibold text-warm-green">
            <BookOpen className="w-5 h-5 mr-1 text-warm-green" />  Program Overview
            </h3>
            <p className="text-black mt-2">{course.description}</p>
          </div>
        </div>

        {/* Right Column — Key Features */}
        <div>
          <h3 className="flex items-center text-lg font-bold text-warm-green">
           <Star className="w-5 h-5 mr-1 text-warm-green" /> Key Features
          </h3>
          <ul className="mt-2 space-y-1">
            {course.features.map((feature, idx) => (
              <li
                key={idx}
                className="flex items-start space-x-2 text-black"
              >
                <CheckCircle className="w-4 h-4 min-w-[16px] min-h-[16px] text-warm-green flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

    </CardContent>
  </Card>
))}

          </div>
        </div>
      </section>

       {/* Career Programs*/}

      <section className="section-padding">
        <div className="container-ngo">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Yagna’s Career{" "}
              <span className="text-gradient">Launch Programs</span> vs{" "}
              <span className="text-gradient">Traditional Programs</span>
            </h2>
          </div>

          <div className="roadmapt grid md:grid-cols-2 lg:grid-cols-2 gap-8">
            {[
              {
                icon: Globe,
                title: "Yagna Tech’s Career Launch Opportunities",
                description:
                  "Fast-track AI and software careers with real corporate exposure.",
                points: [
                  {
                    heading: "Fast-Track AI Careers",
                    text: "Tailored opportunities designed for students aiming to accelerate their entry into AI careers with advanced training integrated with real-world corporate experience",
                  },
                  {
                    heading: "Industry-Ready Skills",
                    text: "Focus on practical applications and industry-relevant skills ensures you gain confidence to apply knowledge in real-world scenarios",
                  },
                  {
                    heading: "Corporate Exposure",
                    text: "Hands-on corporate experience bridges the gap between learning and application, giving you a competitive edge in the AI/ML field",
                  },
                  {
                    heading: "Real-World Innovation",
                    text: "Immersion in real-world projects with top companies ensures you develop skills and experience needed to drive innovation.",
                  },
                  {
                    heading: "Job Market Advantage",
                    text: "Well-prepared to meet industry demands and excel in competitive job markets with proven track record.",
                  },
                  {
                    heading: "Industry Collaboration",
                    text: "Curated dashboards for employers to review the pre-assessed talent pool, giving easy access to corporate opportunities for students.",
                  },
                ],
              },
              {
                icon: GraduationCap,
                title: "Traditional Programs",
                description:
                  "Conventional learning with limited industry application.",
                points: [
                  {
                    heading: "Theoretical Focus",
                    text: "Heavy emphasis on theoretical concepts with limited practical application opportunities.",
                  },
                  {
                    heading: "Generic Curriculum",
                    text: "One-size-fits-all approach without industry-specific customization or real-world context.",
                  },
                  {
                    heading: "Limited Industry Exposure",
                    text: "Minimal or no direct corporate experience, creating a gap between academic learning and industry requirements",
                  },
                  {
                    heading: "Isolated Learning",
                    text: "Learning happens in academic silos without exposure to actual business challenges and innovation processes.",
                  },
                  {
                    heading: "Preparation Gap",
                    text: "Graduates often require additional training and experience before becoming industry-ready professionals.",
                  },
                  {
                    heading: "Assessment Gap",
                    text: "Lack of verifiable assessments to showcase tech abilities of the student.",
                  },
                ],
              },
            ].map((action, index) => (
              <Card
                key={index}
                className="card-ngo border-0 flex flex-col h-full border-2 border-warm-green rounded-xl"
              >
                <CardHeader className="text-center space-y-4">
                  <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto">
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <CardDescription className="text-center leading-relaxed mb-6">
                    {action.description}
                  </CardDescription>
                  <div className="flex flex-col items-start space-y-3 mb-4">
                    {action.points.map((point, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <CheckCircle className="w-5 h-5 min-w-[20px] min-h-[20px] text-warm-green" />
                        <span className="text-muted-foreground">
                          <strong style={{ color: "#177385" }}>
                            {point.heading}:
                          </strong>{" "}
                          {point.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {/* <section className="section-padding bg-gradient-subtle">
        <div className="container-ngo">
          <div className="card-ngo max-w-4xl mx-auto text-center p-8 lg:p-12 space-y-8 bg-gradient-hero">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Ready to Start Learning?
              </h2>
              <p className="text-lg text-white/90 max-w-2xl mx-auto">
                Join thousands of learners who are already building new skills
                and transforming their lives through our opportunities.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8"
                asChild
              >
                <Link to="/signup">Create Free Account</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 border-white text-primary hover:bg-white hover:text-primary"
                asChild
              >
                <Link to="/about">Learn About Us</Link>
              </Button>
            </div>

            <div className="flex items-center justify-center space-x-2 text-white/80">
              <Award className="w-5 h-5" />
              <span className="text-sm">
                All opportunities include certificates upon completion
              </span>
            </div>
          </div>
        </div>
      </section> */}
    </div>
  );
};

export default Students;
