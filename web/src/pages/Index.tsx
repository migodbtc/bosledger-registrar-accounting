import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faGraduationCap,
  faChartLine,
  faUsers,
  faShield,
  faClock,
  faCloud,
  faChartBar,
  faStar,
  faQuoteLeft,
  faNewspaper,
  faCalendar,
  faMapMarkerAlt,
  faEnvelope,
  faPhone,
  faBrain,
  faRobot,
  faMobile,
  faLock,
  faAward,
  faCheckCircle,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { faLinkedin, faGithub } from "@fortawesome/free-brands-svg-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import dbImg from "@/assets/db.png";
import hidePainImg from "@/assets/hide_the_pain_lol.jpeg";
import bsitImg from "@/assets/bsit.jpg";
import bsarchiImg from "@/assets/bsarchi.jpg";
import bsmeImg from "@/assets/bsme.jpg";

const Index = () => {
  const heroOverlayStats = [
    {
      id: 1,
      value: "25K+",
      label: "Users",
      left: "35%",
      top: "80%",
      icon: faUsers,
    },
    // moved to far left
    {
      id: 2,
      value: "120K+",
      label: "Transactions",
      left: "15%",
      top: "30%",
      icon: faChartLine,
    },
    // shifted left
    {
      id: 3,
      value: "99.99%",
      label: "Uptime",
      left: "70%",
      top: "50%",
      icon: faShield,
    },
  ];

  const coreFeatures = [
    {
      icon: faGraduationCap,
      title: "Student Management",
      description:
        "Complete student lifecycle management from admission to graduation",
      features: [
        "Digital records",
        "Enrollment tracking",
        "Academic progress",
        "Grade management",
      ],
    },
    {
      icon: faBook,
      title: "Academic Administration",
      description: "Comprehensive course and subject management system",
      features: [
        "Curriculum design",
        "Subject scheduling",
        "Faculty assignment",
        "Resource allocation",
      ],
    },
    {
      icon: faChartLine,
      title: "Financial Operations",
      description: "Advanced payment processing and financial tracking",
      features: [
        "Automated billing",
        "Payment tracking",
        "Balance monitoring",
        "Financial reports",
      ],
    },
    {
      icon: faUsers,
      title: "Multi-Role Access",
      description: "Secure role-based access control for all stakeholders",
      features: [
        "Student portal",
        "Staff dashboard",
        "Admin controls",
        "Parent access",
      ],
    },
  ];

  const benefits = [
    {
      icon: faGraduationCap,
      title: "Centralized Enrollment Management",
      description:
        "Manage admissions, enrollment, and academic records from a single dashboard. Reduce paperwork and speed up processing with automated workflows.",
    },
    {
      icon: faChartLine,
      title: "Easy Access to DBTC Billing",
      description:
        "Access DBTC-related billing and payment history in one place for students and administrators. Streamline invoicing and reconcile payments faster.",
    },
    {
      icon: faMobile,
      title: "Modern & Sleek User Interface",
      description:
        "An intuitive UI designed for efficiency and clarity across devices. Navigate tasks quickly with responsive layouts and clear visual cues.",
    },
    {
      icon: faUsers,
      title: "Made for Students and Faculty",
      description:
        "Designed to meet the needs of both students and faculty with role-based features. Collaborate, share updates, and access essential tools tailored to each role.",
    },
  ];

  const courses = [
    {
      id: "bsit",
      title: "Bachelor of Science in Information Technology (BSIT)",
      description:
        "A career-focused program covering software development, networks, and systems administration. Students gain hands-on experience building applications, managing cloud services, and securing systems for real-world deployments. ",
      rating: "4.8",
      image: bsitImg,
      route: "/courses/bsit",
    },
    {
      id: "bsarchi",
      title: "Bachelor of Science in Architecture (BSArchi)",
      description:
        "A rigorous program blending design, construction, and architectural theory. Students work on studios and real projects to develop spatial thinking, technical drawing, and sustainable design practices for the built environment.",
      rating: "4.7",
      image: bsarchiImg,
      route: "/courses/bsarchi",
    },
    {
      id: "bsme",
      title: "Bachelor of Science in Mechanical Engineering (BSME)",
      description:
        "Hands-on engineering program focused on mechanics, thermodynamics, and manufacturing processes. Coursework includes labs, CAD, and project-based learning to design and test mechanical systems, preparing students for roles in industry and research.",
      rating: "4.6",
      image: bsmeImg,
      route: "/courses/bsme",
    },
  ];

  const testimonials = [
    {
      name: "Anna Reyes",
      role: "BSIT Student",
      content: "Bosledger made checking my grades and payments so much easier.",
      rating: 5,
    },
    {
      name: "Dr. Maria Santos",
      role: "Registrar, Don Bosco Technical College",
      content:
        "Implementing Bosledger improved our admission processing times significantly.",
      rating: 5,
    },
    {
      name: "Prof. Juan Cruz",
      role: "Head of Accounting Department",
      content:
        "The reporting tools give us consolidated views of student balances and payments.",
      rating: 5,
    },
  ];

  const newsUpdates = [
    {
      title: "Bosledger development has started",
      date: "September 29, 2025",
      summary: `The Bosledger project has entered its initial development phase with core engineering and product teams assembled.
Roadmapping sessions established the first milestones for student records, enrollment flows, and payment reconciliation.
Early prototypes...`,
      category: "Product Update",
    },
    {
      title:
        "Fourth year college students attend a spiritual retreat in Batulao",
      date: "September 15, 2025",
      summary: `A cohort of fourth-year students attended a multi-day spiritual retreat in the Batulao highlands focused on reflection and community.
Facilitators led workshops on leadership, vocation, and small-group activities that strengthened...`,
      category: "Campus Life",
    },
    {
      title: "Fellowship with Salesio Polytechnic",
      date: "August 28, 2025",
      summary: `Don Bosco Technical College and Salesio Polytechnic launched a fellowship for faculty exchange and joint training programs.
Initial activities include co-hosted seminars, instructor shadowing, and pilot short courses to strengthen applied learning.
Students will...`,
      category: "Partnership",
    },
  ];

  return (
    <div className="bg-background">
      {/* Fixed Header */}
      <motion.header
        className="fixed top-0 w-full border-b bg-card/95 backdrop-blur-sm z-50"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg hypatia-gradient-bg flex items-center justify-center">
                <FontAwesomeIcon icon={faBook} className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Bosledger
                </h1>
                <p className="text-sm text-muted-foreground">
                  DBTC Registrar &amp; Accounting Portal
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button className="hypatia-gradient-bg" asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
          </nav>
        </div>
      </motion.header>

      {/* Hero Section - split 50/50 */}
      <section className="h-screen flex md:items-stretch items-center pt-20 bg-gradient-to-br from-background via-muted/30 to-accent/10">
        <div className="container-fluid mx-auto h-full">
          <motion.div
            className="flex flex-col md:flex-row md:items-stretch h-full px-24"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Left: Text - takes 50% on md+ */}
            <div className="md:w-1/2 w-full text-left md:pr-8 md:h-full flex flex-col justify-center">
              <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight mt-6">
                Simplify Records.
                <br />
                <span className="hypatia-gradient">Simplify Education.</span>
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-2xl">
                BosLedger is your go-to place for enrollment and finance for Don
                Bosco Technical College. Record your finances, courses, and
                enrollments, all in one secure platform.
              </p>
              <div className="flex items-start md:justify-start justify-center space-x-4 mb-8">
                <Button
                  size="lg"
                  className="hypatia-gradient-bg text-lg px-8"
                  asChild
                >
                  <Link to="/register">Register</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8"
                  asChild
                >
                  <Link to="/login">Sign In</Link>
                </Button>
              </div>
            </div>

            {/* Right: Image - takes 50% on md+ and fills its half */}
            <div className="md:w-1/2 w-full mt-8 md:mt-0 md:h-full h-[40vh] select-none">
              <div className="relative w-full h-full overflow-hidden">
                <img
                  src={dbImg}
                  alt="Bosledger database illustration"
                  loading="lazy"
                  className="w-full h-full object-cover bg-transparent"
                />

                {/* Overlay cards - visible on md+ */}
                {heroOverlayStats.map((s) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: s.id * 0.15 }}
                    className="hidden md:flex absolute z-20 pointer-events-auto rounded-lg bg-white/90 dark:bg-black/65 py-3 px-4 shadow-md backdrop-blur-sm items-center space-x-3 min-w-[9rem] md:min-w-[10rem]"
                    style={{
                      left: s.left,
                      top: s.top,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={s.icon}
                      className="text-primary text-xl md:text-2xl"
                    />
                    <div>
                      <div className="text-xs md:text-sm text-muted-foreground">
                        {s.label}
                      </div>
                      <div className="text-base md:text-xl font-bold text-foreground">
                        {s.value}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Mobile stacked fallback */}
                <div className="md:hidden absolute bottom-2 left-1/2 transform -translate-x-1/2 w-full px-4">
                  <div className="flex items-center justify-between space-x-3">
                    {heroOverlayStats.map((s) => (
                      <div
                        key={s.id}
                        className="flex-1 min-w-[4rem] text-center bg-white/90 dark:bg-black/65 py-2 rounded-md shadow-sm"
                      >
                        <div className="text-xs text-muted-foreground">
                          {s.label}
                        </div>
                        <div className="text-sm md:text-base font-bold text-foreground">
                          {s.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Statistics Section (25% viewport height) */}
      <section className="h-[25vh] flex items-center hypatia-gradient-bg">
        <div className="container mx-auto px-6 h-full">
          <motion.div
            className="flex flex-col md:flex-row md:items-stretch h-full"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="md:w-1/3 w-full flex items-center justify-center">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <FontAwesomeIcon
                    icon={faGraduationCap}
                    className="text-2xl md:text-3xl text-white"
                  />
                </div>
                <h4 className="text-3xl md:text-4xl font-bold text-white">
                  1953
                </h4>
                <p className="text-sm text-white/90">Teaching students since</p>
              </div>
            </div>

            <div className="md:w-1/3 w-full flex items-center justify-center">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <FontAwesomeIcon
                    icon={faChartLine}
                    className="text-2xl md:text-3xl text-white"
                  />
                </div>
                <h4 className="text-3xl md:text-4xl font-bold text-white">
                  120K+
                </h4>
                <p className="text-sm text-white/90">Records processed</p>
              </div>
            </div>

            <div className="md:w-1/3 w-full flex items-center justify-center">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <FontAwesomeIcon
                    icon={faStar}
                    className="text-2xl md:text-3xl text-white"
                  />
                </div>
                <h4 className="text-3xl md:text-4xl font-bold text-white">
                  98%
                </h4>
                <p className="text-sm text-white/90">Satisfaction rate</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section - image left, text right (matches hero split) */}
      <section className="min-h-screen flex items-center bg-gradient-to-br from-primary/5 to-accent/5 py-20">
        <div className="container mx-auto px-6">
          <motion.div
            className="flex flex-col md:flex-row md:items-stretch h-full"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {/* Left: Image */}
            <div className="md:w-1/2 w-full md:h-full h-[40vh] select-none">
              <div className="relative w-full h-full overflow-hidden rounded-lg shadow-2xl ring-1 ring-black/5 transform-gpu transition-transform duration-300 hover:scale-[1.01]">
                <img
                  src={hidePainImg}
                  alt="Bosledger illustration"
                  loading="lazy"
                  className="w-full h-full object-cover bg-transparent"
                />
              </div>
            </div>

            {/* Right: Text / Benefits */}
            <div className="md:w-1/2 w-full flex flex-col justify-center md:pl-12 pt-8 md:pt-0">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                <span className="hypatia-gradient">Benefits</span> of Bosledger
                — For Students &amp; Faculty
              </h3>

              <div className="space-y-4">
                {benefits.map((b, i) => (
                  <div key={b.title} className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-full hypatia-gradient-bg flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon
                        icon={b.icon}
                        className="text-white text-lg"
                      />
                    </div>
                    <div>
                      <span className="block font-semibold text-foreground">
                        {b.title}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {b.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Popular Courses Section */}
      <section className="min-h-screen flex items-start hypatia-gradient-bg text-white py-20">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-4xl font-bold mb-4 text-white">
              Popular Courses
            </h3>
            <p className="max-w-3xl mx-auto text-white/90">
              Explore some of the most sought-after programs at DBTC — carefully
              designed to prepare students for industry and careers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.map((c, idx) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-[60vh] overflow-hidden flex flex-col shadow-lg">
                  <div
                    className="h-1/2 bg-cover bg-center"
                    style={{ backgroundImage: `url(${c.image})` }}
                  />
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div>
                      <h4 className="text-xl font-bold mb-2 text-black">
                        {c.title}
                      </h4>
                      <p className="text-sm text-black/60 mb-4">
                        {c.description}
                      </p>
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                      <span className="hypatia-gradient-bg text-white inline-flex items-center px-3 py-1 rounded-full">
                        <FontAwesomeIcon icon={faStar} className="mr-2" />
                        {c.rating}
                      </span>
                      <Button
                        variant="ghost"
                        className="px-4 h-auto font-medium"
                        asChild
                      >
                        <Link to={c.route}>
                          View Course
                          <FontAwesomeIcon
                            icon={faArrowRight}
                            className="ml-2"
                          />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* News & Updates Section */}
      <section className="min-h-screen flex items-center bg-gradient-to-br from-background to-muted/30 py-20">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-4xl font-bold text-foreground mb-6">
              Latest News & Updates
            </h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Highlights pulled from our official marketing site — visit the
              official marketing portal for full articles, press releases, and
              detailed announcements.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {newsUpdates.map((news, index) => (
              <motion.div
                key={news.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-[48vh] overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105 cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{news.category}</Badge>
                      <div className="flex items-center text-muted-foreground text-sm">
                        <FontAwesomeIcon icon={faCalendar} className="mr-2" />
                        {news.date}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <CardTitle className="text-lg font-bold text-foreground leading-tight pb-2">
                      {news.title}
                    </CardTitle>
                    <p className="text-muted-foreground mb-4">{news.summary}</p>

                    <div className="mt-auto">
                      <Button
                        variant="ghost"
                        className="px-4 h-auto font-medium"
                        asChild
                      >
                        <Link to="#">
                          Read More
                          <FontAwesomeIcon
                            icon={faArrowRight}
                            className="ml-2"
                          />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="min-h-screen flex items-center hypatia-gradient-bg py-20">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-4xl font-bold text-white mb-4">Testimonials</h3>
            <p className="text-xl max-w-3xl mx-auto text-white/90">
              Read authentic reviews from students, registrars, and accounting
              staff who have tried and tested Bosledger with different use
              cases.
            </p>
          </motion.div>

          {/* helper to produce a short badge label from role */}
          {/* eslint-disable-next-line no-unused-vars */}
          {null}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((t, index) => {
              const roleLower = t.role.toLowerCase();
              const badge = roleLower.includes("student")
                ? "Student"
                : roleLower.includes("registrar")
                ? "Registrar"
                : roleLower.includes("account") ||
                  roleLower.includes("accounting")
                ? "Accounting"
                : "Review";

              return (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-[40vh] overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105 cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center justify-start">
                        <Badge variant="outline" className="px-3 py-1 text-sm">
                          {badge}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="px-6 flex-1 flex flex-col justify-center">
                      <CardTitle className="text-xl md:text-2xl font-bold text-foreground leading-tight pb-4">
                        {t.name}
                      </CardTitle>
                      <p className="text-muted-foreground mb-4 text-base md:text-lg">
                        {t.content}
                      </p>

                      <div className="mt-auto">
                        <div className="flex items-center space-x-3 text-base md:text-lg">
                          <FontAwesomeIcon
                            icon={faStar}
                            className="text-yellow-400"
                          />
                          <span className="font-medium text-foreground">
                            {t.rating}.0
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-card border-t">
        <div className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-lg hypatia-gradient-bg flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faBook}
                    className="text-white text-lg"
                  />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-foreground">
                    Bosledger
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    DBTC Registrar &amp; Accounting Portal
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                A Cloud-Integrated Accounting & Registrar System with Role-Based
                Access Control Using Github, React/Typescript, and Supabase
              </p>
            </div>

            {/* Developer Information */}
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-4">
                Lead Developer
              </h4>
              <div className="space-y-3">
                <div>
                  <div className="font-medium text-foreground">
                    Migo Gennesaret
                  </div>
                  <div className="text-sm text-muted-foreground">
                    End-to-end Solutions Developer
                  </div>
                  <div className="text-sm text-muted-foreground">
                    BS Information Technology, DBTC
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button variant="ghost" size="sm" className="p-2">
                    <FontAwesomeIcon
                      icon={faLinkedin}
                      className="text-primary"
                    />
                  </Button>
                  <Button variant="ghost" size="sm" className="p-2">
                    <FontAwesomeIcon icon={faGithub} className="text-primary" />
                  </Button>
                  <Button variant="ghost" size="sm" className="p-2">
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="text-primary"
                    />
                  </Button>
                </div>
              </div>
            </div>

            {/* School Information */}
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-4">
                Institution
              </h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start">
                  <FontAwesomeIcon
                    icon={faMapMarkerAlt}
                    className="mt-1 mr-2 flex-shrink-0"
                  />
                  <div>
                    <div className="font-medium text-foreground">
                      Don Bosco Technical College
                    </div>
                    <div>736 Gen Kalentong, Mandaluyong City, Philippines</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faPhone} className="mr-2" />
                  <span>+63 (02) 8812-3456</span>
                </div>
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                  <span>info@donbosco.edu.ph</span>
                </div>
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faAward} className="mr-2" />
                  <span>CHED Accredited • ISO 9001:2015</span>
                </div>
              </div>
            </div>

            {/* Academic Programs */}
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-4">
                Academic Programs
              </h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Bachelor of Science in Information Technology (BSIT)</div>
                <div>Bachelor of Science in Mechanical Engineering (BSME)</div>
                <div>Bachelor of Science in Architecture (BSArchi)</div>
                <div className="pt-2 text-xs">
                  <span className="text-success font-medium">
                    ✓ ABET Accredited Programs
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between">
            <div className="text-muted-foreground text-sm mb-4 md:mb-0">
              © 2025 Bosledger Registrar &amp; Accounting System. Built for Don
              Bosco Technical College. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <Link
                to="/privacy"
                className="hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="/contact"
                className="hover:text-primary transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
