// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
// import { useEffect } from "react";

// const FAQs = () => {
//   useEffect(() => {
//     document.title = "FAQs | EduHope";
//   }, []);

//   return (
//     <div className="section-padding">
//       <div className="container-ngo">
//         <header className="mb-10 text-center">
//           <h1 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h1>
//           <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
//             Find quick answers about our free courses, certificates, and how to get started.
//           </p>
//         </header>

//         <section aria-labelledby="faq-list" className="max-w-3xl mx-auto">
//           <h2 id="faq-list" className="sr-only">FAQs</h2>
//           <Accordion type="single" collapsible className="w-full">
//             <AccordionItem value="item-1">
//               <AccordionTrigger>Are all EduHope courses free?</AccordionTrigger>
//               <AccordionContent>
//                 Yes. EduHope is a non-profit and all our courses are offered free to learners.
//               </AccordionContent>
//             </AccordionItem>
//             <AccordionItem value="item-2">
//               <AccordionTrigger>Do I get a certificate after completion?</AccordionTrigger>
//               <AccordionContent>
//                 Absolutely. You will receive a shareable certificate after successfully completing a course.
//               </AccordionContent>
//             </AccordionItem>
//             <AccordionItem value="item-3">
//               <AccordionTrigger>How do I enroll?</AccordionTrigger>
//               <AccordionContent>
//                 Create a free account, choose a course, and click Enroll. You can start learning instantly.
//               </AccordionContent>
//             </AccordionItem>
//           </Accordion>
//         </section>
//       </div>
//     </div>
//   );
// };

// export default FAQs;



import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";




const FAQs = () => {
  const faqs = [
    {
      question: "What are the eligibility criteria for Yagna Tech programs?",
      answer: "Our programs require enrollment at a partner university/institution. Specific prerequisites requires basic Python & ML proficiency."
    },
    {
      question: "How are certifications validated?",
      answer: "We provide industry-recognized verifiable certifications endorsed by our corporate partners. These credentials include skills assessment metrics and project portfolios to demonstrate competency to employers."
    },
   {
      question: "What corporate experience components are guaranteed?",
      answer: [
         "AI Frontier: Mentor-guided live sessions and projects.",
         "Frontier Plus: Mentor-guided real projects plus a 2-month structured corporate on-site program.",
         "Elite Residency: Mentor-guided live sessions and projects plus a 6-month immersive on-site program.",
         "Placements depend on performance evaluations."
            ]
   },
    {
      question: "What distinguishes Yagna Tech's pedagogy?",
      answer: ["Our industry-integrated approach combines:", 
      "1.Curriculum designed by AI corporate experts",
      "2.Continuous mentor guidance from industry experts"]
    },
    {
      question: "What financial support is available?",
      answer: " Merit-based financial aid is offered to top-performing underprivileged students. Eligibility requires demonstrated excellence in program assessments and socioeconomic need verification."
    },
    {
      question: "How does placement assistance work?",
      answer: ["Top performers receive dedicated placement support through:",
              "1. Corporate talent showcase dashboards",
              "2. Priority internship allocation",
              "3. Elite Residency employment assurance",
              "4. Partner company referral networks"]
    },
    {
      question: "Can institutions integrate these programs?",
      answer: "Partner colleges may embed our industry-aligned modules into curricula. We provide progress tracking dashboards and corporate connection frameworks. Contact our academic partnerships team for integration pathways."
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
               Frequently Asked  <span className="text-gradient">Questions</span>
              </h1>
              {/* <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Find quick answers to common questions about our opportunities, services, certificates, and how to get started.
              </p> */}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding ">
        <div className="container-ngo">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">
               <span className="text-gradient">FAQ's</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {/* Quick answers to common questions about our opportunities and services. */}
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="card-ngo border-2 border-warm-green rounded-xl">
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* <p className="text-muted-foreground leading-relaxed">{faq.answer}</p> */}
                  {Array.isArray(faq.answer) ? (
            <ul className="text-muted-foreground leading-relaxed">
              {faq.answer.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
          )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Don't see your question answered?
            </p>
            <Button variant="outline" size="lg">
              View Full FAQ
            </Button>
          </div> */}
        </div>
      </section>

   
      {/* CTA Section */}
      {/* <section className="section-padding">
        <div className="container-ngo">
          <div className="card-ngo max-w-4xl mx-auto text-center p-8 lg:p-12 space-y-8 bg-gradient-hero">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Join Our Mission
              </h2>
              <p className="text-lg text-white/90 max-w-2xl mx-auto">
                Whether you're a learner looking to grow, an organization wanting to partner, 
                or someone who believes in our mission - there's a place for you in our community.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
                <Link to="/courses">Start Learning</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 border-white text-primary hover:bg-white hover:text-primary" asChild>
                <Link to="/contact">Partner With Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section> */}
    </div>
  );
};

export default FAQs;