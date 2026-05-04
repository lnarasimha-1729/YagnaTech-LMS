import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RoadMap from "@/assets/RM.png"; // Adjust the path as necessary
import Vid from "@/assets/Vid1.mp4"; // Adjust the path as necessary

import { 
  BookOpen,  
  Award, 
  Heart, 
  GraduationCap, 
  Globe, 
  Target,
  ArrowRight,
  CheckCircle,
  Star, 
  School,
  Building2,
} from "lucide-react";
import { 
  FaUserEdit, FaEnvelopeOpenText, FaPencilAlt, FaListAlt,
  FaPlayCircle, FaGraduationCap, FaClipboardCheck, FaCertificate
} from "react-icons/fa";

const Home = () => {
  const features = [
    {
      icon: BookOpen,
      title: "Expert-Led Live Sessions",
      description: "Learn from industry professionals with real-world experience"
    },
    {
      icon: GraduationCap,
      title: "Hands-On Corporate Internships",
      description: "Gain practical experience with leading companies"
    },
    {
      icon: Award,
      title: "Verifiable Certification",
      description: "Earn recognized certificates upon course completion with comprehensive testing."
    },
    {
      icon: Target,
      title: "Placement Assistance",
      description: "Top performers receive dedicated placement support."
    },
    {
      icon: Heart,
      title: "Financial Aid",
      description: "Financial aid for top performing underprivileged students"
    },
    {
      icon: Globe,
      title: "Industry-Relevant Curriculum",
      description: "Stay updated with the latest AI/ML trends and technologies"
    }
  ];


  const milestones = [
  {
    icon: <FaUserEdit />,
    year: "Step-1",
    title: "Register for Assessment",
    description: "Sign up and take our initial assessment to evaluate your current skills and interests."
  },
  {
    icon: <FaEnvelopeOpenText />,
    year: "Step-2",
    title: "Receive Test Invitation",
    description: "Get invited to participate in skill-based tests tailored to your chosen field."
  },
  {
    icon: <FaPencilAlt />,
    year: "Step-3",
    title: "Complete Assessment Test",
    description: "Finish the assessment to unlock access to specialized learning modules."
  },
  {
    icon: <FaListAlt />,
    year: "Step-4",
    title: "Eligibility & Program Selection",
    description: "Based on your results, select the most suitable program for your career goals."
  },
  {
    icon: <FaPlayCircle />,
    year: "Step-5",
    title: "Module Activation",
    description: "Begin your learning journey with interactive modules and real-world content."
  },
  {
    icon: <FaGraduationCap />,
    year: "Step-6",
    title: "Complete the Program",
    description: "Finish all required coursework and projects under expert guidance."
  },
  {
    icon: <FaClipboardCheck />,
    year: "Step-7",
    title: "Final Assessment",
    description: "Take the final evaluation to demonstrate your mastery of the subject."
  },
  {
    icon: <FaCertificate />,
    year: "Step-8",
    title: "Certificate Issuance",
    description: "Receive your official certificate and prepare to launch your professional career."
  }
];

  const testimonials = [
    {
      name: "- Rakesh Kumar",
      // course: "Digital Literacy Program",
      text: "YagnaTech changed my life. I went from having no computer skills to landing my first office job!",
      rating: 5
    },
    {
      name: "- Anjali",
      // course: "Professional Development",
      text: "The courses are well-structured and the support from mentors is incredible. Highly recommend!",
      rating: 5
    },
    {
      name: "- Chandra Sekhar",
      // course: "Basic Computer Skills",
      text: "As a passed out graduate, these courses gave me the skills I needed to provide better for my family.",
      rating: 5
    }
  ];

  const missionAction = [
    {
      icon: GraduationCap,
      title: "For Students",
      description: "Access industry-aligned skill development programs that prepare you for real-world challenges",
      points: [
        {
          icon: CheckCircle,
          text: "Hands-on learning with industry mentors"
        },
        {
          icon: CheckCircle,
          text: "Build professional portfolios with real projects"
        },
        {
          icon: CheckCircle,
          text: "Pathways to corporate experience opportunitie"
        }
      ]
    },

    {
      icon: School,
      title: "For Colleges",
      description: "Enhance your curriculum with industry-relevant programs and corporate connections",
      points: [
        {
          icon: CheckCircle,
          text: "Integrate practical skill development modules"
        },
        {
          icon: CheckCircle,
          text: "Track student progress and industry readiness"
        },
        {
          icon: CheckCircle,
          text: "Build corporate partnerships for student opportunities"
        }
      ]
    },

    {
      icon: Building2,
      title: "For Companies",
      description: "Access pre-trained talent aligned with your industry needs",
      points: [
        {
          icon: CheckCircle,
          text: "Reduce recruitment costs with pre-assessed talent"
        },
        {
          icon: CheckCircle,
          text: "Build professional portfolios with real projects"
        },
        {
          icon: CheckCircle,
          text: "Pathways to corporate experience opportunities"
        }
      ]
    }
  ];
  

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
     <section className="relative section-padding py-24 lg:py-44 overflow-hidden">
  {/* Background video */}
  <video
    className="absolute inset-0 w-full h-full object-cover"
    autoPlay
    loop
    muted
    playsInline
  >
    <source src={Vid} type="video/mp4" />
  </video>

  {/* Overlay for better text visibility */}
  <div className="absolute inset-0 bg-black/50"></div>

  <div className="relative z-10 container-ngo text-center text-white">
    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
      <span className="block animate-slide-up mb-5">Building Bridges Between</span>
      <span className="block text-gradient animate-slide-up delay-300">
        Academia and Industries
      </span>
    </h1>

    <p className="mt-6 text-lg md:text-xl max-w-2xl mx-auto mb-8 ">
      Empowering students with industry-relevant skills while connecting
      colleges and companies for sustainable growth.
    </p>

    <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 ">
      <Button
        size="lg"
        className="bg-gradient-hero border-0 text-lg px-8"
        asChild
      >
        <Link to="/students" className="flex items-center space-x-2 "onClick={() => {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
              }}>
          <span>Explore Opportunities</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </Button>
      <Button
        // variant="outline"
        size="lg"
        className="text-lg px-8 bg-white text-primary hover:bg-white/90 border-0"
        asChild
      >
        <Link to="/contact" onClick={() => {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
              }}>Partner with Us</Link>
      </Button>
    </div>
  </div>
</section>


      {/* Stats Section */}
      {/* <section className="py-16 bg-card/50">
        <div className="container-ngo">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-gradient">
                  {stat.number}
                </div>
                <div className="text-sm md:text-base text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

       {/* Mission Action Section */}
      <section className="section-padding ">
        <div className="container-ngo">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Our Mission in <span className="text-gradient">Action</span>
            </h2>
            {/* <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover how our mission empowers students to unlock their
              potential, enables colleges to bridge the gap with industry, and
              helps companies find skilled, job-ready talent.
            </p> */}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {missionAction.map((action, index) => (
              <Card key={index} className="card-ngo border-2 border-warm-green rounded-xl">

                <CardHeader className="text-center space-y-4">
                  <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto">
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center leading-relaxed mb-6">
                    {action.description}
                  </CardDescription>
                  <div className="flex flex-col items-start space-y-3">
                    {action.points.map((point, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <point.icon className="w-5 h-5 text-warm-green" />
                        <span className="text-muted-foreground">
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

       {/* Student Opportunities*/}

      <section className="section-padding bg-gradient-subtle">
        <div className="container-ngo">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Opportunities for <span className="text-gradient">Students</span>
            </h2>
            {/* <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Industry exposure and mentoring opportunities designed to bridge
              the gap between academic knowledge and industry requirements
            </p> */}
          </div>

          <div className="roadmapt grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Globe, // Changed from BookOpen to Globe
                title: "AI Frontier Program",
                description:
                  "Kickstart your AI career with industry-ready knowledge in neural networks and deep learning.",
                points: [
                  {
                    icon: CheckCircle,
                    text: "AI expert devised curriculum ",
                  },
                  {
                    icon: CheckCircle,
                    text: "Live program delivered by industry experts",
                  },
                  {
                    icon: CheckCircle,
                    text: "Project-based learning approach",
                  },
                  {
                    icon: CheckCircle,
                    text: "Continuous mentor guidance",
                  },
                  {
                    icon: CheckCircle,
                    text: "6 months virtual comprehensive program",
                  },
                ],
              },
              {
                icon: GraduationCap,
                title: "AI Frontier Plus Program",
                description:
                  "Hybrid learning with corporate experience component",
                points: [
                  {
                    icon: CheckCircle,
                    text: "All the benefits of AI Frontier Program ",
                  },
                  {
                    icon: CheckCircle,
                    text: "2 months of hands-on corporate experience",
                  },
                  {
                    icon: CheckCircle,
                    text: "Personalized guidance with industry experts",
                  },
                  {
                    icon: CheckCircle,
                    text: "Fast-track your career with advanced skills",
                  },
                ],
              },
              {
                icon: Building2, // Changed from Award to Building2
                title: "Elite AI Residency",
                description:
                  "Full-time corporate experience for advanced learners",
                points: [
                  {
                    icon: CheckCircle,
                    text: "All the benefits of AI Frontier Program",
                  },
                  {
                    icon: CheckCircle,
                    text: "6 months on-site corporate engagement",
                  },
                  {
                    icon: CheckCircle,
                    text: "Full time real project responsibilities",
                  },
                  {
                    icon: CheckCircle,
                    text: "Work alongside corporate employees",
                  },
                  {
                    icon: CheckCircle,
                    text: "Fast paced learning experience",
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
                      <div key={idx} className="flex items-center space-x-2">
                        <point.icon className="w-5 h-5 text-warm-green" />
                        <span className="text-muted-foreground">
                          {point.text}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto pt-2">
                    <Button
                      size="sm"
                      className="w-1/2 bg-gradient-hero border-0 flex justify-center mx-auto"
                      asChild
                    >
                      <Link to="/students" onClick={() => {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
              }}>View More</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

 {/* Timeline Section */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto px-4">
          {/* Heading */}
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Student <span className=" text-gradient">Roadmap</span>
            </h2>
            {/* <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Key milestones in our mission to democratize education worldwide.
            </p> */}
          </div>

          {/* Timeline */}
          {/* <div className="max-w-4xl mx-auto">
      <div className="relative pl-0.5 space-y-8 before:absolute before:top-0 before:left-6 before:w-px before:h-full before:bg-gray-800">
        {milestones.map((milestone, index) => (
          <div key={index} className="flex gap-6 items-start">
            
            <div className="flex-shrink-0 relative z-10">
              <div className="w-12 h-12 bg-gradient-hero rounded-full flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-xl">
                  {milestone.icon}
                </span>
              </div>
            </div>

           
            <div className="bg-white shadow-sm rounded-lg p-6 flex-1">
              <h3 className="text-lg font-semibold mb-2">{milestone.title}</h3>
              <p className="text-gray-600">{milestone.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div> */}

          <div className="relative">
            {/* Path line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/40 rounded-full"></div>

            {/* Milestones */}
            <div className="relative w-full">
              <img
                src={RoadMap}
                alt="Student Roadmap"
                className="w-full h-auto rounded-lg  object-contain"
              />
            </div>
          </div>

          <div className="text-center mt-12">
            <Button className="bg-gradient-hero" size="lg">
              <Link to="/signup">Register for Assessment</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding bg-gradient-subtle">
        <div className="container-ngo">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Why Choose <span className="text-gradient">YagnaTech</span>?
            </h2>
            {/* <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our programs are tailored to meet industry demands, providing
              practical experience and professional connections.
            </p> */}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="card-ngo border-2 border-warm-green rounded-xl">
                <CardHeader className="text-center space-y-4">
                  <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

     
      {/* Roadmap */}
      {/* <section className="section-padding">
        <div className="container-ngo">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Student <span className="text-gradient">Roadmap</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Follow our step-by-step roadmap to become industry-ready: from foundational skills to hands-on experience and certification.
            </p>
          </div>

            <div className="roadmapt grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: BookOpen,
                title: "Step 1: Register for Assessment",
                description: "Sign up and take our initial assessment to evaluate your current skills and interests."
              },
              {
                icon: GraduationCap,
                title: "Step 2: Receive Test Invitation",
                description: "Get invited to participate in skill-based tests tailored to your chosen field."
              },
              {
                icon: Award,
                title: "Step 3: Complete Assessment Test",
                description: "Finish the assessment to unlock access to specialized learning modules."
              },
              {
                icon: Target,
                title: "Step 4: Eligibility & Program Selection",
                description: "Based on your results, select the most suitable program for your career goals."
              },
              {
                icon: Globe,
                title: "Step 5: Module Activation",
                description: "Begin your learning journey with interactive modules and real-world content."
              },
              {
                icon: School,
                title: "Step 6: Complete the Program",
                description: "Finish all required coursework and projects under expert guidance."
              },
              {
                icon: CheckCircle,
                title: "Step 7: Final Assessment",
                description: "Take the final evaluation to demonstrate your mastery of the subject."
              },
              {
                icon: Award,
                title: "Step 8: Certificate Issuance",
                description: "Receive your official certificate and prepare to launch your professional career."
              }
            ].map((step, index) => (
              <Card key={index} className="card-ngo border-0">
                <CardHeader className="text-center space-y-4">
                  <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto">
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center leading-relaxed">
                    {step.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
            </div>
        </div>
      </section> */}

     

     

      {/* Testimonials Section */}
      {/* <section className="section-padding bg-gradient-subtle">
        <div className="container-ngo">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Stories of <span className="text-gradient">Transformation</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real stories from learners whose lives have been changed through our programs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="card-ngo border-0">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current text-soft-orange" />
                    ))}
                  </div>
                  <p className="text-muted-foreground leading-relaxed italic">
                    "{testimonial.text}"
                  </p>
                  <div className="space-y-1">
                    <div className="font-semibold">{testimonial.name}</div>
                   
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section> */}

     

      {/* CTA Section */}
      {/* <section className="section-padding">
        <div className="container-ngo">
          <div className="card-ngo max-w-4xl mx-auto text-center p-8 lg:p-12 space-y-8 bg-gradient-hero">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Ready to Transform Your Future?
              </h2>
              <p className="text-lg text-white/90 max-w-2xl mx-auto">
                Join thousands of learners who have already started their
                journey towards a brighter future. Your education is our
                mission.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8"
                asChild
              >
                <Link to="/courses">Browse Opportunities</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 border-white text-primary hover:bg-white hover:text-primary"
                asChild
              >
                <Link to="/contact">Get Support</Link>
              </Button>
            </div>

            <div className="flex items-center justify-center space-x-2 text-white/80">
              <Heart className="w-5 h-5" />
              <span className="text-sm">Changing lives through education</span>
            </div>
          </div>
        </div>
      </section> */}
    </div>
  );
};

export default Home;