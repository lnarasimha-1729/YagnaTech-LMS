import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Heart, 
  Target, 
  Users, 
  Globe, 
  LinkedinIcon,
  Lightbulb
} from "lucide-react";



const About = () => {
  const values = [
    {
      icon: Heart,
      title: "Compassion",
      description: "We believe education is a fundamental right, not a privilege. Every learner deserves access to quality education regardless of their economic background."
    },
    {
      icon: Target,
      title: "Excellence",
      description: "We maintain the highest standards in our educational content, ensuring every opportunity meets professional industry requirements."
    },
    {
      icon: Users,
      title: "Community",
      description: "Learning is better together. We foster a supportive environment where learners help each other grow and succeed."
    },
    {
      icon: Globe,
      title: "Accessibility",
      description: "Breaking down geographical and financial barriers to make quality education available to everyone, everywhere."
    }
  ];

  const team = [
    {
      name: "Kishore Gade",
      role: "Founder and Managing Director",
      description: "Ph.D. from IISc, Bengaluru with over 10 years of corporate experience in tech industry.",
      socials: {
      facebook: "https://facebook.com/",
      instagram: "https://instagram.com/",
      linkedin: "https://www.linkedin.com/in/kishore-gade-0059a131/?originalSubdomain=in"
    }
      // expertise: "Educational Strategy"
    },
    {
      name: "M Venkateswara Rao",
      role: "Advisory Board",
      description: "Ph.D. from IIT Madras, with post-doctoral experience from the USA and Canada",
      socials: {
      facebook: "https://facebook.com/",
      instagram: "https://instagram.com/",
      linkedin: "https://www.linkedin.com/in/venkateswararao-mannava-132b2b1a/?utm_source=share&original_referer=&utm_content=profile&utm_campaign=share_via&utm_medium=member_mweb&originalSubdomain=ca"
    }
      // expertise: "Platform Development"
    },
    {
      name: "V K Chaitanya",
      role: "Advisory Board",
      description: "Ph.D. from Purdue University, USA, engaged with US-based AI enterprise.",
      socials: {
      facebook: "https://facebook.com/",
      instagram: "https://instagram.com/",
      linkedin: "https://www.linkedin.com/in/vkcmanam/?utm_source=share&utm_medium=member_mweb&utm_campaign=share_via&utm_content=profile"
    }
      // expertise: "Curriculum Design"
    }
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="section-padding ">
        <div className="container-ngo">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                About <span className="text-gradient">Us</span>
              </h1>
              {/* <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
               To provide high-quality, accessible education and professional development opportunities to underserved communities worldwide, empowering individuals to transform their lives and communities.
              </p> */}
            </div>

            {/* <div className="grid md:grid-cols-3 gap-6 pt-8">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-gradient">5,000+</div>
                <div className="text-muted-foreground">Lives Changed</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-gradient">25+</div>
                <div className="text-muted-foreground">Free Courses</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-gradient">50+</div>
                <div className="text-muted-foreground">Partner Organizations</div>
              </div>
            </div> */}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="section-padding">
        <div className="container-ngo">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Our <span className="text-gradient">Story</span>
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Yagna Tech Foundation is a Section 8 Not-For-Profit organization in India. It was founded by doctorates from prestigious universities with extensive corporate experience to address the critical gap between academic preparation and industry requirements. We believe in creating sustainable bridges between educational institutions and Corporations to benefit all stakeholders.
                </p>
                <p>
                  Today, we partner with organizations worldwide to identify educational gaps and 
                  create targeted programs that make a real difference in people's lives. Every course 
                  we develop is designed with one goal in mind: practical skills that lead to 
                  real opportunities.
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="card-ngo p-6 space-y-4 border-2 border-warm-green rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">Our Vision</h3>
                </div>
                <p className="text-muted-foreground">
                  A world where every student graduates industry-ready, and every company finds the talent they need to innovate and grow.
                </p>
              </div>
              
              <div className="card-ngo p-6 space-y-4 border-2 border-warm-green rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">Our Mission</h3>
                </div>
                <p className="text-muted-foreground">
                  To empower students with industry-relevant skills while creating meaningful connections between educational institutions and corporations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section-padding bg-gradient-subtle">
        <div className="container-ngo">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Our <span className="text-gradient">Values</span>
            </h2>
            {/* <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              These core values guide everything we do and shape how we serve our community of learners.
            </p> */}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="card-ngo border-0 text-center border-2 border-warm-green rounded-xl">
                <CardHeader className="space-y-4">
                  <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto">
                    <value.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="leading-relaxed">
                    {value.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="section-padding">
        <div className="container-ngo">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Meet Our <span className="text-gradient">Leadership</span>
            </h2>
            {/* <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Passionate educators, doctorates, and community builders working together 
              to make education accessible for everyone.
            </p> */}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member, index) => (
             <Card key={index} className="card-ngo border-0 group relative overflow-hidden pb-6 border-2 border-warm-green rounded-xl">
  <CardHeader className="text-center space-y-3">
    <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center mx-auto">
      <Users className="w-8 h-8 text-white" />
    </div>
    <div>
      <CardTitle className="text-lg">{member.name}</CardTitle>
      <CardDescription className="text-primary font-medium">
        {member.role}
      </CardDescription>
    </div>
  </CardHeader>

  <CardContent className="space-y-3">
    <p className="text-sm text-muted-foreground leading-relaxed">
      {member.description}
    </p>
  </CardContent>

  {/* Bottom Footer with Social Icons on Hover */}
  <div className="absolute bottom-0 left-0 w-full backdrop-blur-md py-2 px-4 flex justify-end gap-4 ">
    {/* {member.socials?.facebook && (
      <a href={member.socials.facebook} target="_blank" rel="noopener noreferrer">
        <FacebookIcon className="w-5 h-5 text-primary hover:scale-110 transition-transform" />
      </a>
    )}
    {member.socials?.instagram && (
      <a href={member.socials.instagram} target="_blank" rel="noopener noreferrer">
        <InstagramIcon className="w-5 h-5 text-primary hover:scale-110 transition-transform" />
      </a>
    )} */}
    {member.socials?.linkedin && (
      <a href={member.socials.linkedin} target="_blank" rel="noopener noreferrer">
        <LinkedinIcon className="w-7 h-7 text-primary hover:scale-110 transition-transform" />
      </a>
    )}
  </div>
</Card>


            ))}
          </div>
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

export default About;