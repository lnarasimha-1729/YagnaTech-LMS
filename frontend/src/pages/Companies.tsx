// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Link } from "react-router-dom";
// import { 
//   BookOpen, 
//   Clock, 
//   Users, 
//   Award,
//   Monitor,
//   Smartphone,
//   Briefcase,
//   Code,
//   PenTool,
//   Languages,
//   Calculator,
//   Globe,
//   ArrowRight,
//   Star,
//   GraduationCap,
//   Building2,
//   CheckCircle
// } from "lucide-react";

// const Companies = () => {
 
//   const featuredCourses = [
//     {
//       id: 1,
//       title: "AI Frontier Program",
//       description: "Kickstart your AI career with 6 months of structured learning in Python, neural networks, and deep learning. This program is designed to provide a strong foundation for beginners.",
//       eligibility: ["Basic proficiency in Python programming required", "Be a student of any partnered University / Institution"],
//       duration: "6 months (Virtual)",
//       icon: GraduationCap,
//       features: ["Most comprehensive curriculum on AI & ML", "Develop command on Python", "Gain stronghold on Neural Networks & Deep Learning concepts", "Learn with industry experts in live sessions", "Hands-on Exercises with Real Datasets", "Access to 20 LMS Modules anytime, anywhere","Mentor-guided projects"],
//     },
//     {
//       id: 2,
//       title: "AI Frontier Plus Program",
//       description: "This program combines AI Frontier program with a 2-month corporate internship, preparing you for advanced roles in AI/ML",
//       eligibility: ["Good proficiency in Python programming required","Be a student of any partnered University / Institution" ],
//       duration: "6 Months (2 months on-site internship)",
//       icon: GraduationCap,
//       features: ["All features of AI Frontier program", "2 months of hands-on corporate experience and close mentorship", "Personalized guidance with industry experts","Possibilities to showcase your skills and secure potential employment"],
//     },
//     {
//       id: 3,
//       title: "Elite AI Residency",
//       description: "Immerse yourself in a full-time, 6-month residency at company premises, working on real AI projects from day one.",
//       eligibility: ["Good proficiency in Python programming required", "Be a student of any partnered University / Institution"],
//       duration: "6 months (On-site)",
//       icon: GraduationCap,
//       features: ["All features of AI Frontier program", "6 months on-site corporate engagement", "Full time real project responsibilities", "Work alongside corporate employees", "Robust experience of AI/ML project in a fast paced environment", "The top performers get assured employement"],
//     }
//   ];

//   return (
//     <div className="overflow-hidden">
//       {/* Hero Section */}
//       <section className="section-padding bg-gradient-subtle">
//         <div className="container-ngo">
//           <div className="max-w-4xl mx-auto text-center space-y-8">
//             <div className="space-y-4">
//               <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
//                 Transform Your Future with{" "}
//                 <span className="text-gradient">Our Opportunities</span>
//               </h1>
//               <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
//                 Explore our comprehensive library of professional development opportunities, 
//                 all designed to help you build the skills you need for success.
//               </p>
//             </div>

//             <div className="flex flex-col sm:flex-row gap-4 justify-center">
//               <Button size="lg" className="bg-gradient-hero border-0 text-lg px-8" asChild>
//                 <Link to="/signup">Start Learning Today</Link>
//               </Button>
//               <Button variant="outline" size="lg" className="text-lg px-8" asChild>
//                 <Link to="/contact">Need Guidance?</Link>
//               </Button>
//             </div>

//             {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
//               <div className="text-center space-y-1">
//                 <div className="text-2xl font-bold text-gradient">25+</div>
//                 <div className="text-sm text-muted-foreground">Courses Available</div>
//               </div>
//               <div className="text-center space-y-1">
//                 <div className="text-2xl font-bold text-gradient">5,000+</div>
//                 <div className="text-sm text-muted-foreground">Active Learners</div>
//               </div>
//               <div className="text-center space-y-1">
//                 <div className="text-2xl font-bold text-gradient">95%</div>
//                 <div className="text-sm text-muted-foreground">Completion Rate</div>
//               </div>
//               <div className="text-center space-y-1">
//                 <div className="text-2xl font-bold text-gradient">4.8★</div>
//                 <div className="text-sm text-muted-foreground">Average Rating</div>
//               </div>
//             </div> */}
//           </div>
//         </div>
//       </section>

//       {/* Categories Section */}
//       <section className="section-padding">
//         <div className="container-ngo">
//           <div className="text-center space-y-4 mb-12">
//             <h2 className="text-3xl md:text-4xl font-bold">
//               Our <span className="text-gradient">Categories</span>
//             </h2>
//             <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
//               Discover opportunities organized by field of study to find exactly what you need for your goals.
//             </p>
//           </div>

//                      <div className="roadmapt grid md:grid-cols-2 lg:grid-cols-3 gap-8">
//                      {[
//                        {
//                        icon: Globe, // Changed from BookOpen to Globe
//                        title: "AI Frontier Program",
//                        description: "Kickstart your AI career with industry-ready knowledge in neural networks and deep learning.",
//                        points: [
//                          {
//                          icon: CheckCircle,
//                          text: "AI expert devised curriculum "
//                          },
//                          {
//                          icon: CheckCircle,
//                          text: "Live program delivered by industry experts"
//                          },
//                          {
//                          icon: CheckCircle,
//                          text: "Project-based learning approach"
//                          },
//                          {
//                          icon: CheckCircle,
//                          text: "Continuous mentor guidance"
//                          },
//                          {
//                          icon: CheckCircle,
//                          text: "6 months virtual comprehensive program"
//                          }
//                        ]
//                        },
//                        {
//                        icon: GraduationCap,
//                        title: "AI Frontier Plus Program",
//                        description: "Hybrid learning with corporate experience component",
//                        points: [
//                          {
//                          icon: CheckCircle,
//                          text: "All the benefits of AI Frontier Program "
//                          },
//                          {
//                          icon: CheckCircle,
//                          text: "2 months of hands-on corporate experience"
//                          },
//                          {
//                          icon: CheckCircle,
//                          text: "Personalized guidance with industry experts"
//                          },
//                          {
//                          icon: CheckCircle,
//                          text: "Fast-track your career with advanced skills"
//                          }
//                        ]
//                        },
//                        {
//                        icon: Building2, // Changed from Award to Building2
//                        title: "Elite AI Residency",
//                        description: "Full-time corporate experience for advanced learners",
//                        points: [
//                          {
//                          icon: CheckCircle,
//                          text: "All the benefits of AI Frontier Program"
//                          },
//                          {
//                          icon: CheckCircle,
//                          text: "6 months on-site corporate engagement"
//                          },
//                          {
//                          icon: CheckCircle,
//                          text: "Full time real project responsibilities"
//                          },
//                          {
//                          icon: CheckCircle,
//                          text: "Work alongside corporate employees"
//                          },
//                          {
//                          icon: CheckCircle,
//                          text: "Fast paced learning experience"
//                          }
//                        ]
//                        }
//                      ].map((action, index) => (
//                          <Card key={index} className="card-ngo border-0 flex flex-col h-full">
//                          <CardHeader className="text-center space-y-4">
//                            <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto">
//                            <action.icon className="w-6 h-6 text-white" />
//                            </div>
//                            <CardTitle className="text-lg">{action.title}</CardTitle>
//                          </CardHeader>
//                          <CardContent className="flex-1 flex flex-col">
//                            <CardDescription className="text-center leading-relaxed mb-6">
//                            {action.description}
//                            </CardDescription>
//                            <div className="flex flex-col items-start space-y-3 mb-4">
//                            {action.points.map((point, idx) => (
//                              <div key={idx} className="flex items-center space-x-2">
//                              <point.icon className="w-5 h-5 text-warm-green" />
//                              <span className="text-muted-foreground">{point.text}</span>
//                              </div>
//                            ))}
//                            </div>
//                            {/* <div className="mt-auto pt-2">
//                            <Button size="sm" className="w-full bg-gradient-hero border-0" asChild>
//                              <Link to="/courses">View More</Link>
//                            </Button>
//                            </div> */}
//                          </CardContent>
//                          </Card>
//                      ))}
//                      </div>
//         </div>
//       </section>

//       {/* Featured Courses Section */}
//       <section className="section-padding bg-gradient-subtle">
//         <div className="container-ngo">
//           <div className="text-center space-y-4 mb-12">
//             <h2 className="text-3xl md:text-4xl font-bold">
//               Featured <span className="text-gradient">Opportunities</span>
//             </h2>
//             <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
//               Our most popular and impactful opportunities, designed to give you practical skills for real-world success.
//             </p>
//           </div>

//           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
//             {featuredCourses.map((course) => (
//               <Card key={course.id} className="card-ngo border-0 group overflow-hidden flex flex-col h-full">
//   <CardHeader className="space-y-4">
//     <div className="flex items-start justify-between">
//       <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center">
//         <course.icon className="w-6 h-6 text-white" />
//       </div>
//     </div>

//     <div className="space-y-2">
//       <CardTitle className="text-lg group-hover:text-primary transition-colors">
//         {course.title}
//       </CardTitle>
//       <CardDescription className="leading-relaxed">
//         {course.description}
//       </CardDescription>
//     </div>
//   </CardHeader>

//   <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
//     <div className="grid grid-cols-1 gap-4 text-sm text-muted-foreground">
//       {/* Duration Section */}
//       <div className="flex items-center space-x-2">
//         <Clock className="w-4 h-4" />
//         <span className="font-medium text-black">Duration :</span>
//         <span>{course.duration}</span>
//       </div>

//       {/* Eligibility Section */}
//       <div className="space-y-2">
//         <div className="text-sm font-medium text-black">Eligibility:</div>
//         <ul className="space-y-1">
//           {course.eligibility.map((eligibility, index) => (
//             <li key={index} className="flex items-center space-x-2 text-sm text-muted-foreground">
//               <CheckCircle className="w-3 h-3 text-warm-green flex-shrink-0" />
//               <span>{eligibility}</span>
//             </li>
//           ))}
//         </ul>
//       </div>

//       {/* Features Section */}
//       <div className="space-y-2">
//         <div className="text-sm font-medium text-black">Key Features:</div>
//         <ul className="space-y-1">
//           {course.features.map((feature, index) => (
//             <li key={index} className="flex items-center space-x-2 text-sm text-muted-foreground">
//               <CheckCircle className="w-3 h-3 text-warm-green flex-shrink-0" />
//               <span>{feature}</span>
//             </li>
//           ))}
//         </ul>
//       </div>
//     </div>

//     {/* Fixed Bottom Button */}
//     <div className="mt-auto pt-4">
//       <Button size="sm" className="w-full bg-gradient-hero border-0" asChild>
//         <Link to="/courses">Register for Assessment</Link>
//       </Button>
//     </div>
//   </CardContent>
// </Card>

//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Upcoming Courses Section */}
//       {/* <section className="section-padding">
//         <div className="container-ngo">
//           <div className="max-w-4xl mx-auto">
//             <div className="text-center space-y-4 mb-12">
//               <h2 className="text-3xl md:text-4xl font-bold">
//                 Coming <span className="text-gradient">Soon</span>
//               </h2>
//               <p className="text-lg text-muted-foreground">
//                 We're constantly developing new courses based on industry needs and learner feedback.
//               </p>
//             </div>

//             <div className="card-ngo p-8 space-y-6">
//               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
//                 {upcomingCourses.map((course, index) => (
//                   <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/50">
//                     <div className="w-8 h-8 bg-gradient-hero rounded-full flex items-center justify-center flex-shrink-0">
//                       <BookOpen className="w-4 h-4 text-white" />
//                     </div>
//                     <span className="font-medium">{course}</span>
//                   </div>
//                 ))}
//               </div>

//               <div className="text-center pt-4">
//                 <p className="text-muted-foreground mb-4">
//                   Want to be notified when new courses launch?
//                 </p>
//                 <Button variant="outline" asChild>
//                   <Link to="/contact">Stay Updated</Link>
//                 </Button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section> */}

//       {/* CTA Section */}
//       <section className="section-padding bg-gradient-subtle">
//         <div className="container-ngo">
//           <div className="card-ngo max-w-4xl mx-auto text-center p-8 lg:p-12 space-y-8 bg-gradient-hero">
//             <div className="space-y-4">
//               <h2 className="text-3xl md:text-4xl font-bold text-white">
//                 Ready to Start Learning?
//               </h2>
//               <p className="text-lg text-white/90 max-w-2xl mx-auto">
//                 Join thousands of learners who are already building new skills and transforming 
//                 their lives through our opportunities.
//               </p>
//             </div>
            
//             <div className="flex flex-col sm:flex-row gap-4 justify-center">
//               <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
//                 <Link to="/signup">Create Free Account</Link>
//               </Button>
//               <Button size="lg" variant="outline" className="text-lg px-8 border-white text-primary hover:bg-white hover:text-primary" asChild>
//                 <Link to="/about">Learn About Us</Link>
//               </Button>
//             </div>

//             <div className="flex items-center justify-center space-x-2 text-white/80">
//               <Award className="w-5 h-5" />
//               <span className="text-sm">All opportunities include certificates upon completion</span>
//             </div>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// };

// export default Companies;




import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Globe,
  GraduationCap,
  Building2,
  Handshake,
  CheckCircle,
} from "lucide-react";

const Companies = () => {
 
  const featuredCourses = [
    {
      id: 1,
      icon: Handshake, // Hands-On Experience: Handshake for practical collaboration
      title: "Access to Pre-Vetted Talent",
      description: [
        "Gain exclusive access to a pool of highly-trained students who have completed our comprehensive career launch program (industry experts designed program).",
        "You will have access to a dashboard showing students’ performance in the assessment tests, feedback from the previous internship employers, and a link to GitHub showcasing industry-ready projects completed by the students."
      ],
    },
    {
      id: 2,
      icon: Globe, // Enhanced Employability: GraduationCap for employability
      title: "Contribute to Your Community",
      description: ["Show your commitment to corporate social responsibility by providing invaluable internship opportunities. Your guidance and mentorship will directly contribute to a student's professional growth and strengthen the community.", "Choose the top-performing students as the interns from the pre-assessed talent pool"]
    },
    {
      id: 3,
      icon: GraduationCap, // Career Pathways: Globe for global/career opportunities
      title: "Shape Future Professionals",
      description: ["By hosting an intern, you provide direct input on the skills students need, ensuring the talent pipeline is constantly evolving to meet your industry’s demands.",]
    },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-subtle">
        <div className="container-ngo">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Invest in the Future{" "}
                <span className="text-gradient">of Your Workforce</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
               Your company's success depends on a talented and skilled workforce. Yet, finding candidates with the right mix of academic knowledge and practical experience can be challenging. Our career launch program is building a pipeline of highly motivated individuals ready to contribute to your team from day one. Partner with us to tap into this talent pool and help shape the future of your industry.
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

    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {featuredCourses.map((course) => (
        <Card
          key={course.id}
          className="card-ngo border-2 border-warm-green group overflow-hidden flex flex-col h-full"
        >
          <CardHeader className="space-y-4 flex flex-col items-center text-center">
            {/* Icon Centered */}
            <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center">
              <course.icon className="w-6 h-6 text-white" />
            </div>

            {/* Title Centered */}
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {course.title}
            </CardTitle>

            {/* List aligned left */}
            <ul className="space-y-2 w-full text-left mt-2">
              {course.description.map((description, index) => (
                <li
                  key={index}
                  className="flex items-start space-x-2 text-sm text-muted-foreground"
                >
                  <CheckCircle className="w-4 h-4 text-warm-green flex-shrink-0 mt-0.5" />
                  <span>{description}</span>
                </li>
              ))}
            </ul>
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
                Interested in building your talent pipeline?
              </h2>
              <p className="text-lg text-white/90 max-w-2xl mx-auto">
                By offering an internship, you’re not just giving a student a temporary role; you’re shaping a future professional and helping them launch their career.
              </p>
              <p className="text-lg text-white/90 max-w-2xl mx-auto">
                Contact us today to learn more about our company partnership programs.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
                <Link to="/signup">Get in Touch</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Companies;