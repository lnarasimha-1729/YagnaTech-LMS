import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  X,
  BookOpen,
  Users,
  Home,
  Mail,
  LogIn,
  UserPlus,
  GraduationCap,
  Building2,
  Briefcase,
  Handshake,
  HelpCircle,
  User as UserIcon,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import Logo from "@/assets/yagnatech.png"; // Adjust the path as necessary
import { useAuth } from "@/hooks/useAuth";
import { logout as adminLogout } from "@/admin/api/auth";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();

  const isActive = (path) => location.pathname === path;

  const dashboardPath = user?.role === "admin" ? "/admin/dashboard" : "/dashboard";
  const initials = (user?.name || user?.email || "U")
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = async () => {
    setIsProfileOpen(false);
    try { await adminLogout(); } catch { /* ignore */ }
    try { await logoutUser(); } catch { /* ignore */ }
    navigate("/login", { replace: true });
  };

  // Scroll helper
  const scrollToTopWithOffset = (e, path) => {
    e.preventDefault();
    navigate(path);
    setTimeout(() => {
      const navbarHeight = 80; // Adjust to match lg:h-20 height
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      // if you had anchor targets, you could use:
      // const element = document.querySelector(path);
      // if (element) {
      //   const y = element.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
      //   window.scrollTo({ top: y, behavior: "smooth" });
      // }
    }, 50);
    setIsMenuOpen(false);
  };

  const navigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "About Us", href: "/about", icon: Users },
    { name: "Opportunities", href: "/students", icon: BookOpen },
    { name: "Contact", href: "/contact", icon: Mail },
    { name: "Partners", href: "/partners", icon: Handshake, dropdown: true  },
    // { name: "FAQ's", href: "/faqs", icon: HelpCircle },
  ];

  const partnerItems = [
    { name: "Colleges", href: "/colleges", icon: Building2 },
    { name: "Companies", href: "/companies", icon: Briefcase },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/50">
      <div className="container-ngo">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link
            to="/"
            onClick={(e) => scrollToTopWithOffset(e, "/")}
            className="flex items-center space-x-3 text-xl font-bold text-gradient transition-transform"
          >
            <img
              src={Logo}
              alt="Logo"
              className="w-15 h-15 rounded-lg object-cover"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) =>
              item.dropdown ? (
                <DropdownMenu
                  key={item.name}
                  open={isDropdownOpen}
                  onOpenChange={setIsDropdownOpen}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    sideOffset={8}
                    className="min-w-[150px] "
                  >
                    {partnerItems.map((sub) => (
                      <DropdownMenuItem asChild key={sub.name}>
                        <Link
                          to={sub.href}
                          onClick={(e) => {
                            scrollToTopWithOffset(e, sub.href);
                            setIsDropdownOpen(false); // CLOSE DROPDOWN
                          }}
                          className="flex items-center gap-2"
                        >
                          <sub.icon className="w-4 h-4" />
                          <span>{sub.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={(e) => scrollToTopWithOffset(e, item.href)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              )
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            {user ? (
              <DropdownMenu open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 px-2 py-1 rounded-full hover:bg-secondary/50"
                  >
                    <span className="w-9 h-9 rounded-full bg-gradient-hero text-white text-sm font-semibold flex items-center justify-center">
                      {initials}
                    </span>
                    <span className="text-sm font-medium text-foreground max-w-[140px] truncate">
                      {user.name || user.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className="min-w-[200px]">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground border-b mb-1">
                    {user.email}
                    {user.role && (
                      <span className="ml-1 inline-block px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] uppercase">
                        {user.role}
                      </span>
                    )}
                  </div>
                  <DropdownMenuItem asChild>
                    <Link
                      to={dashboardPath}
                      onClick={(e) => {
                        scrollToTopWithOffset(e, dashboardPath);
                        setIsProfileOpen(false);
                      }}
                      className="flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  {user.role !== "admin" && (
                    <DropdownMenuItem asChild>
                      <Link
                        to="/dashboard"
                        onClick={(e) => {
                          scrollToTopWithOffset(e, "/dashboard");
                          setIsProfileOpen(false);
                        }}
                        className="flex items-center gap-2"
                      >
                        <UserIcon className="w-4 h-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" asChild className="bg-gradient-hero border-0">
                <Link
                  to="/login"
                  onClick={(e) => scrollToTopWithOffset(e, "/login")}
                  className="flex items-center space-x-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border/50">
            <div className="space-y-2">
              {navigation.map((item) =>
                item.dropdown ? (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center px-3 py-3 font-medium text-muted-foreground">
                      <item.icon className="w-5 h-5 mr-2" />
                      {item.name}
                    </div>
                    {partnerItems.map((sub) => (
                      <Link
                        key={sub.name}
                        to={sub.href}
                        onClick={(e) => scrollToTopWithOffset(e, sub.href)}
                        className="flex items-center space-x-3 pl-10 pr-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      >
                        <sub.icon className="w-4 h-4" />
                        <span>{sub.name}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={(e) => scrollToTopWithOffset(e, item.href)}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                      isActive(item.href)
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              )}
              {/* Auth Buttons in Mobile */}
              <div className="pt-4 space-y-2">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2 border-t border-border/50 pt-4">
                      <span className="w-10 h-10 rounded-full bg-gradient-hero text-white text-sm font-semibold flex items-center justify-center">
                        {initials}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {user.name || user.email}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                      </div>
                    </div>
                    <Button
                      className="w-full justify-start bg-gradient-hero border-0"
                      asChild
                    >
                      <Link
                        to={dashboardPath}
                        onClick={(e) => scrollToTopWithOffset(e, dashboardPath)}
                        className="flex items-center space-x-3"
                      >
                        <LayoutDashboard className="w-5 h-5" />
                        <span>Dashboard</span>
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-5 h-5 mr-2" />
                      <span>Logout</span>
                    </Button>
                  </>
                ) : (
                  <Button
                    className="w-full justify-start bg-gradient-hero border-0"
                    asChild
                  >
                    <Link
                      to="/login"
                      onClick={(e) => scrollToTopWithOffset(e, "/login")}
                      className="flex items-center space-x-3"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span>Sign In</span>
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
