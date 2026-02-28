import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { 
  Clock, CheckCircle, ArrowRight, BookOpen, BarChart3, Users, 
  ClipboardList, Sparkles, Brain, Calendar, GraduationCap, Home, 
  Play, Target, Award, LogIn, Rocket, Gamepad2, Zap
} from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';

// Animation hook for scroll reveal
const useScrollReveal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
};

// Animated Section Component
const AnimatedSection = ({ children, className = '', delay = 0 }) => {
  const [ref, isVisible] = useScrollReveal();
  
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
};

const Landing = () => {
  const { t } = useLanguage();

  // Target audience data
  const targetAudience = [
    { icon: GraduationCap, labelKey: 'landingElementaryTeachers' },
    { icon: BookOpen, labelKey: 'landingMiddleSchoolEducators' },
    { icon: Target, labelKey: 'landingHighSchoolTeachers' },
    { icon: Home, labelKey: 'landingHomeschoolEducators' },
    { icon: Award, labelKey: 'landingInstructionalCoaches' },
  ];

  // Outcomes data
  const outcomes = [
    'landingFasterPlanning',
    'landingLessTimeGrading',
    'landingBetterOrganization',
    'landingMoreConfidence',
    'landingMorePersonalTime',
  ];

  // Solution features
  const solutionFeatures = [
    { icon: Calendar, titleKey: 'landingGenerateLessons', color: 'emerald' },
    { icon: BarChart3, titleKey: 'landingTrackGrades', color: 'blue' },
    { icon: ClipboardList, titleKey: 'landingRecordAttendance', color: 'purple' },
    { icon: Users, titleKey: 'landingOrganizeData', color: 'amber' },
    { icon: Brain, titleKey: 'landingUseAiTools', color: 'rose' },
  ];

  // How it works steps
  const howItWorksSteps = [
    { 
      step: '1', 
      titleKey: 'landingCreateClasses', 
      descKey: 'landingCreateClassesDesc',
      icon: Users 
    },
    { 
      step: '2', 
      titleKey: 'landingGenerateWithAi', 
      descKey: 'landingGenerateWithAiDesc',
      icon: Sparkles 
    },
    { 
      step: '3', 
      titleKey: 'landingManageGradesAttendance', 
      descKey: 'landingManageGradesAttendanceDesc',
      icon: BarChart3 
    },
  ];

  const featureColors = {
    emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100',
    amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100',
    rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-100',
  };

  // Images - American/European classrooms
  const images = {
    hero: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
    students: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
    teaching: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80',
    collaboration: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=600&q=80',
    playToLearn: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80',
    games: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80',
    adaptive: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=80',
  };

  // Platform integrations data
  const platformIntegrations = [
    { icon: Brain, titleKey: 'landingAiAssistantTitle', color: 'indigo', isNew: true },
    { icon: Sparkles, titleKey: 'landingAdaptiveLearningTitle', color: 'pink', isNew: false },
    { icon: Gamepad2, titleKey: 'landingEducationalGamesTitle', color: 'orange', isNew: false },
    { icon: Rocket, titleKey: 'landingPlayToLearnTitle', color: 'blue', isNew: true },
    { icon: BarChart3, titleKey: 'landingStudentProgressTitle', color: 'emerald', isNew: false },
    { icon: Play, titleKey: 'landingPresentationsTitle', color: 'purple', isNew: true },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src="https://customer-assets.emergentagent.com/job_teachersuite/artifacts/swlef12w_ChatGPT%20Image%20Feb%2015%2C%202026%2C%2009_08_36%20PM.png"
              alt="TeacherHubPro Logo"
              className="h-10 w-10 sm:h-11 sm:w-11 object-contain"
              data-testid="header-logo"
            />
            <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">TeacherHubPro</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a 
              href="#solution" 
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
              data-testid="nav-features"
            >
              {t('landingFeatures') || 'Features'}
            </a>
            <a 
              href="#how-it-works" 
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
              data-testid="nav-how-it-works"
            >
              {t('landingSeeHowItWorks') || 'How It Works'}
            </a>
            <Link 
              to="/pricing" 
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
              data-testid="nav-pricing"
            >
              {t('landingPricing') || 'Pricing'}
            </Link>
          </nav>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector variant="compact" dropdownPosition="down" />
            <Link to="/auth?mode=login">
              <Button 
                variant="ghost"
                className="text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 px-3 sm:px-4"
                data-testid="header-login"
              >
                <LogIn className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">{t('landingLogIn') || 'Log In'}</span>
              </Button>
            </Link>
            <Link to="/auth">
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 sm:px-6 shadow-sm hover:shadow-md transition-all"
                data-testid="header-cta"
              >
                {t('landingStartFreeCta') || 'Start Free'}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 sm:pt-28 sm:pb-20 px-4 sm:px-6 bg-gradient-to-b from-slate-50 via-white to-white overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left - Main Copy */}
            <div className="text-center lg:text-left">
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-6 border border-emerald-100"
                style={{ animation: 'fadeInUp 0.6s ease-out' }}
              >
                <Clock className="h-4 w-4" />
                {t('landingBuiltForBusyTeachers') || 'Built for busy teachers'}
              </div>
              
              <h1 
                className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold text-slate-900 leading-[1.15] mb-6"
                style={{ animation: 'fadeInUp 0.6s ease-out 0.1s both' }}
              >
                {t('landingSave5HoursTitle') || 'Save 5+ Hours Every Week on Planning, Grading, and Classroom Admin'}
              </h1>
              
              <p 
                className="text-base sm:text-lg text-slate-600 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0"
                style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}
              >
                {t('landingSave5HoursSubtitle') || 'TeacherHubPro helps busy educators create lesson plans, manage grades, track attendance, and use AI to simplify daily classroom work — all in one place.'}
              </p>
              
              <div 
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start"
                style={{ animation: 'fadeInUp 0.6s ease-out 0.3s both' }}
              >
                <Link to="/auth">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 sm:px-8 h-12 sm:h-14 text-base sm:text-lg shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:shadow-emerald-200/50 transition-all group"
                    data-testid="hero-primary-cta"
                  >
                    {t('landingStartFreeNoCreditCard') || 'Start Free — No Credit Card Required'}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 h-12 sm:h-14 text-base sm:text-lg transition-all"
                  onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                  data-testid="hero-secondary-cta"
                >
                  <Play className="mr-2 h-5 w-5" />
                  {t('landingSeeHowItWorks') || 'See How It Works'}
                </Button>
              </div>
            </div>

            {/* Right - Hero Image */}
            <div 
              className="relative mt-8 lg:mt-0"
              style={{ animation: 'fadeInRight 0.8s ease-out 0.2s both' }}
            >
              <div className="relative">
                {/* Main Image */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src={images.hero}
                    alt="Teacher using TeacherHubPro"
                    className="w-full h-[300px] sm:h-[350px] lg:h-[400px] object-cover object-top"
                    data-testid="hero-image"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent"></div>
                </div>

                {/* Floating card - Top Left */}
                <div 
                  className="absolute -top-3 -left-3 sm:-top-4 sm:-left-6 bg-white rounded-xl shadow-lg border border-slate-100 p-3 sm:p-4 animate-float hidden sm:block"
                  style={{ animationDelay: '0s' }}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Class Average</div>
                      <div className="text-base sm:text-lg font-bold text-slate-900">87%</div>
                    </div>
                  </div>
                </div>

                {/* Floating card - Bottom Right */}
                <div 
                  className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-6 bg-white rounded-xl shadow-lg border border-slate-100 p-3 sm:p-4 animate-float hidden sm:block"
                  style={{ animationDelay: '1.5s' }}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">AI Generated</div>
                      <div className="text-base sm:text-lg font-bold text-slate-900">3 Lessons</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-900 text-white">
        <AnimatedSection className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6">
            {t('landingTeachingIsMore') || 'Teaching Is More Than Teaching'}
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-10 leading-relaxed max-w-3xl mx-auto">
            {t('landingTeachingIsMoreDesc') || 'Between lesson planning, grading, attendance, reporting, and communication — most teachers spend hours every week on tasks that steal time from students and personal life.'}
          </p>
          <div className="border-t border-slate-700 pt-8 max-w-2xl mx-auto">
            <p className="text-xl sm:text-2xl font-semibold text-emerald-400 mb-2">
              {t('landingYouBecameTeacher') || 'You became a teacher to educate.'}
            </p>
            <p className="text-lg sm:text-xl text-slate-400">
              {t('landingNotToDrown') || 'Not to drown in paperwork.'}
            </p>
          </div>
        </AnimatedSection>
      </section>

      {/* The Solution Section */}
      <section id="solution" className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {t('landingEverythingSimple') || 'Everything You Need. One Simple Platform.'}
            </h2>
            <p className="text-lg sm:text-xl text-slate-600">
              {t('landingLessBusywork') || 'Less busywork. More teaching.'}
            </p>
          </AnimatedSection>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-12">
            {/* Left - Feature List */}
            <div className="grid sm:grid-cols-1 gap-4">
              {solutionFeatures.map((feature, idx) => (
                <AnimatedSection key={idx} delay={idx * 100}>
                  <div 
                    className="group flex items-start gap-4 p-5 sm:p-6 rounded-xl bg-slate-50 hover:bg-white hover:shadow-lg border border-transparent hover:border-slate-200 transition-all duration-300 cursor-default"
                    data-testid={`feature-${idx}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${featureColors[feature.color]}`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-slate-800 font-medium text-base sm:text-lg leading-snug">{t(feature.titleKey)}</p>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>

            {/* Right - Image */}
            <AnimatedSection delay={200} className="hidden lg:block">
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <img 
                  src={images.teaching}
                  alt="Teacher helping student"
                  className="w-full h-[400px] object-cover"
                  data-testid="solution-image"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/20 to-transparent"></div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Engage Students Section - Play to Learn, Educational Games, Adaptive Learning */}
      <section id="engage" className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {t('landingEngageStudents') || 'Engage Students Like Never Before'}
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto">
              {t('landingEngageStudentsDesc') || 'Transform your classroom with interactive games, adaptive learning, and live quizzes that keep students motivated and learning.'}
            </p>
          </AnimatedSection>

          {/* Play to Learn */}
          <AnimatedSection className="mb-16">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <img 
                  src={images.playToLearn}
                  alt="Play to Learn - Live quiz games"
                  className="w-full h-[300px] sm:h-[350px] object-cover"
                  data-testid="play-to-learn-image"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 text-indigo-700 text-sm font-medium">
                    <Rocket className="h-4 w-4" />
                    {t('landingPlayToLearnSubtitle') || 'Kahoot-Style Live Games'}
                  </span>
                </div>
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-4">
                  <Rocket className="h-4 w-4" />
                  NEW
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                  {t('landingPlayToLearnTitle') || 'Play to Learn'}
                </h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  {t('landingPlayToLearnDesc') || 'Host live quiz games or assign self-paced activities. Students join with a PIN and compete in real-time with instant feedback.'}
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    t('landingPlayToLearnFeature1') || 'Live multiplayer quizzes',
                    t('landingPlayToLearnFeature2') || 'Self-paced assignments',
                    t('landingPlayToLearnFeature3') || 'Real-time leaderboards',
                    t('landingPlayToLearnFeature4') || '9+ game modes',
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {t('landingExploreFeature') || 'Explore'} Play to Learn
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </AnimatedSection>

          {/* Educational Games */}
          <AnimatedSection className="mb-16">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-medium mb-4">
                  <Gamepad2 className="h-4 w-4" />
                  INTERACTIVE
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                  {t('landingEducationalGamesTitle') || 'Educational Games'}
                </h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  {t('landingEducationalGamesDesc') || 'Create custom games for any subject. Share with students via link or Google Classroom. Track engagement and progress.'}
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    t('landingEducationalGamesFeature1') || 'Customizable game templates',
                    t('landingEducationalGamesFeature2') || 'Share via link or QR code',
                    t('landingEducationalGamesFeature3') || 'Student progress tracking',
                    t('landingEducationalGamesFeature4') || 'Works on any device',
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                    {t('landingExploreFeature') || 'Explore'} {t('landingEducationalGamesTitle') || 'Educational Games'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="order-1 lg:order-2 relative rounded-2xl overflow-hidden shadow-xl">
                <img 
                  src={images.games}
                  alt="Educational Games"
                  className="w-full h-[300px] sm:h-[350px] object-cover"
                  data-testid="games-image"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-orange-900/40 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 text-orange-700 text-sm font-medium">
                    <Gamepad2 className="h-4 w-4" />
                    {t('landingEducationalGamesSubtitle') || 'Fun Learning Activities'}
                  </span>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Adaptive Learning */}
          <AnimatedSection>
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <img 
                  src={images.adaptive}
                  alt="Adaptive Learning"
                  className="w-full h-[300px] sm:h-[350px] object-cover"
                  data-testid="adaptive-image"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-pink-900/40 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 text-pink-700 text-sm font-medium">
                    <Brain className="h-4 w-4" />
                    {t('landingAdaptiveLearningSubtitle') || 'Personalized Learning Paths'}
                  </span>
                </div>
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-100 text-pink-700 text-sm font-medium mb-4">
                  <Zap className="h-4 w-4" />
                  AI-POWERED
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                  {t('landingAdaptiveLearningTitle') || 'Adaptive Learning'}
                </h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  {t('landingAdaptiveLearningDesc') || "AI-powered learning paths that adapt to each student's pace and level. Identify gaps and provide targeted practice."}
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    t('landingAdaptiveLearningFeature1') || 'AI-powered recommendations',
                    t('landingAdaptiveLearningFeature2') || 'Personalized practice',
                    t('landingAdaptiveLearningFeature3') || 'Progress analytics',
                    t('landingAdaptiveLearningFeature4') || 'Automatic difficulty adjustment',
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-pink-500 flex-shrink-0" />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <Button className="bg-pink-600 hover:bg-pink-700 text-white">
                    {t('landingExploreFeature') || 'Explore'} {t('landingAdaptiveLearningTitle') || 'Adaptive Learning'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Real Outcomes Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-emerald-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left - Image */}
            <AnimatedSection className="order-2 lg:order-1">
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <img 
                  src={images.students}
                  alt="Happy students in classroom"
                  className="w-full h-[300px] sm:h-[350px] object-cover"
                  data-testid="outcomes-image"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/20 to-transparent"></div>
              </div>
            </AnimatedSection>

            {/* Right - Content */}
            <div className="order-1 lg:order-2">
              <AnimatedSection className="mb-8">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  {t('landingWhatTeachersExperience') || 'What Teachers Experience'}
                </h2>
              </AnimatedSection>

              <div className="space-y-3 sm:space-y-4">
                {outcomes.map((outcomeKey, idx) => (
                  <AnimatedSection key={idx} delay={idx * 75}>
                    <div 
                      className="flex items-center gap-3 bg-white rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow border border-emerald-100"
                      data-testid={`outcome-${idx}`}
                    >
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500 flex-shrink-0" />
                      <span className="text-slate-700 font-medium text-sm sm:text-base">{t(outcomeKey)}</span>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {t('landing3SimpleSteps') || 'Get Started in 3 Simple Steps'}
            </h2>
            <p className="text-lg sm:text-xl text-slate-600">
              {t('landingValueInMinutes') || "You'll see value in minutes — not hours."}
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8 sm:gap-10">
            {howItWorksSteps.map((item, idx) => (
              <AnimatedSection key={idx} delay={idx * 150} className="text-center">
                <div className="relative inline-flex items-center justify-center mb-6">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100">
                    <item.icon className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 sm:w-9 sm:h-9 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">{t(item.titleKey)}</h3>
                <p className="text-slate-600 text-sm sm:text-base">{t(item.descKey)}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Built For Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {t('landingBuiltForEducators') || 'Built Specifically for Educators'}
            </h2>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {targetAudience.map((audience, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-2 sm:gap-3 bg-white rounded-full px-4 sm:px-6 py-2.5 sm:py-3 shadow-sm border border-slate-200 hover:border-emerald-200 hover:shadow-md transition-all"
                  data-testid={`audience-${idx}`}
                >
                  <audience.icon className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                  <span className="text-slate-700 font-medium text-sm sm:text-base">{t(audience.labelKey)}</span>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Collaboration Image Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left - Content */}
            <AnimatedSection>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                {t('landingJoinThousands') || 'Join Thousands of Teachers'}
              </h2>
              <p className="text-base sm:text-lg text-slate-600 mb-6 leading-relaxed">
                {t('landingJoinThousandsDesc') || 'Educators across the country are already using TeacherHubPro to streamline their workflow, spend more time with students, and reclaim their evenings.'}
              </p>
              
              {/* Trust indicators */}
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {['M', 'J', 'L', 'A', 'S'].map((letter, i) => (
                    <div 
                      key={i} 
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-white flex items-center justify-center text-white text-sm font-bold shadow-sm"
                    >
                      {letter}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-800">500+</span> {t('landingTeachersUsing') || 'teachers already using TeacherHubPro'}
                </div>
              </div>
            </AnimatedSection>

            {/* Right - Image */}
            <AnimatedSection delay={200}>
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <img 
                  src={images.collaboration}
                  alt="Teacher and student collaboration"
                  className="w-full h-[300px] sm:h-[350px] object-cover"
                  data-testid="collaboration-image"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent"></div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-emerald-50 to-white">
        <AnimatedSection className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            {t('landingReadyToSimplify') || 'Ready to Simplify Your Teaching Life?'}
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 mb-8">
            {t('landingExperienceTimeSaved') || 'Start your free account today and experience how much time you can save this week.'}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/auth">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-14 text-lg shadow-lg shadow-emerald-200/50 hover:shadow-xl transition-all group"
                data-testid="final-cta"
              >
                {t('landingStartFreeToday') || 'Start Free Today'}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {[
              t('landingNoCreditCardRequired') || 'No credit card required',
              t('landingSetupIn2Minutes') || 'Set up in under 2 minutes',
              t('landingCancelAnytime') || 'Cancel anytime',
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span className="text-slate-600 text-sm sm:text-base">{item}</span>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="py-10 sm:py-12 px-4 sm:px-6 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src="https://customer-assets.emergentagent.com/job_teachersuite/artifacts/swlef12w_ChatGPT%20Image%20Feb%2015%2C%202026%2C%2009_08_36%20PM.png"
                  alt="TeacherHubPro"
                  className="h-9 w-9 sm:h-10 sm:w-10 object-contain"
                />
                <span className="font-bold text-base sm:text-lg">TeacherHubPro</span>
              </div>
              <p className="text-slate-400 text-sm">
                {t('landingSimplifyingTeaching') || 'Simplifying teaching, one classroom at a time.'}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">{t('landingProductLabel') || 'Product'}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#solution" className="hover:text-white transition-colors">{t('landingFeatures') || 'Features'}</a></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">{t('landingPricing') || 'Pricing'}</Link></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">{t('landingSeeHowItWorks') || 'How It Works'}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">{t('landingCompanyLabel') || 'Company'}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/contact" className="hover:text-white transition-colors">{t('landingContact') || 'Contact'}</Link></li>
                <li><Link to="/help" className="hover:text-white transition-colors">{t('landingHelpCenter') || 'Help Center'}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">{t('landingLegalLabel') || 'Legal'}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/privacy-policy" className="hover:text-white transition-colors">{t('landingPrivacyPolicyLink') || 'Privacy Policy'}</Link></li>
                <li><Link to="/terms-of-use" className="hover:text-white transition-colors">{t('landingTermsOfServiceLink') || 'Terms of Service'}</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} TeacherHubPro. {t('landingAllRightsReserved') || 'All rights reserved.'}
          </div>
        </div>
      </footer>

      {/* CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Landing;
