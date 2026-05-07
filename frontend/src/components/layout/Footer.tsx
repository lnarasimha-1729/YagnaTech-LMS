import { Link } from "react-router-dom";
import { BookOpen, Mail, Phone, MapPin, FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon } from "lucide-react";
  import Logo from "@/assets/yagnatech.png"; // Adjust the path as necessary


const Footer = () => {
  return (
    <footer className="bg-gradient-subtle border-t border-border/50">
      <div className="container-ngo">
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="space-y-4">
              <Link 
            to="/" 
            className="flex items-center space-x-3 text-xl font-bold text-gradient hover:scale-105 transition-transform"
            >
            <img
              src={Logo}  
              alt="yagnatech Logo"
              className="w-15 h-15 rounded-lg object-cover"
            />
            {/* <span>YAGNATECH</span> */}
            </Link>

              <p className="text-muted-foreground leading-relaxed">
             Empowering students with industry-relevant skills while connecting colleges and companies for sustainable growth.
              </p>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <BookOpen className="w-4 h-4 text-warm-green" />
                <span>Bridging Academia and Industries</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Quick Links</h3>
              <nav className="space-y-3">
                <Link 
                  to="/" 
                  className="block text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
              }}
                >
                  Home
                </Link>
                <Link 
                  to="/about" 
                  className="block text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
              }}
                >
                  About Us
                </Link>
                <Link 
                  to="/students" 
                  className="block text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
              }}
                >
                  Opportunities
                </Link>
                <Link 
                  to="/contact" 
                  className="block text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
              }}
                >
                  Contact Us
                </Link>
                 <Link 
                  to="/colleges" 
                  className="block text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
              }}
                >
                  Partners - Colleges
                </Link>
                 <Link 
                  to="/companies" 
                  className="block text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
              }}
                >
                  Partners - Companies
                </Link>

                <Link 
                  to="/faqs" 
                  className="block text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
              }}
                >
                  FAQ's
                </Link>
              </nav>
            </div>

            {/* Programs */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Programs</h3>
              <div className="space-y-3 text-muted-foreground">
                <div>AI Frontier Program</div>
                <div>AI Frontier Plus Program</div>
                <div>Elite AI Residency</div>
                {/* <div>Technical Training</div> */}
                {/* <div className="text-sm text-primary">More coming soon...</div> */}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Get in Touch</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-muted-foreground">
                    <div>info@yagnatech.org</div>
                    {/* <div>support@yagnatech.org</div> */}
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-muted-foreground">
                    <div>+91 9491829495</div>
                    {/* <div>Mon-Fri 9AM-6PM</div> */}
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-muted-foreground">
                    Guntur,<br />
                    AndhraPradesh, India
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="py-6 border-t border-border/50">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground">
              © 2025 YagnaTech Foundation. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-muted-foreground">
  <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
    <FacebookIcon className="w-5 h-5" />
  </a>
  <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
    <InstagramIcon className="w-5 h-5" />
  </a>
  <a href="https://www.linkedin.com/in/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
    <LinkedinIcon className="w-5 h-5" />
  </a>
  <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
    <TwitterIcon className="w-5 h-5" />
  </a>
</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;