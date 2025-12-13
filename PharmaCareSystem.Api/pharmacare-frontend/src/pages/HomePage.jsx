import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FaHospital, 
  FaPrescriptionBottle, 
  FaUserMd, 
  FaShieldAlt,
  FaClock,
  FaChartLine,
  FaCheckCircle,
  FaBars,
  FaTimes,
  FaQuoteLeft,
  FaStar,
  FaBell,
  FaMobileAlt,
  FaClipboardCheck
} from 'react-icons/fa';

// Import client images
import client1 from '../assets/images/client1.jpg';
import client2 from '../assets/images/client2.jpg';
import client3 from '../assets/images/client3.jpg';
import client4 from '../assets/images/client4.jpg';

const HomePage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPartner, setCurrentPartner] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const features = [
    {
      icon: <FaPrescriptionBottle className="text-5xl text-primary-600" />,
      title: 'Digital Prescriptions',
      description: 'Seamlessly manage and track prescriptions with automated refill notifications and real-time status updates'
    },
    {
      icon: <FaChartLine className="text-5xl text-secondary-600" />,
      title: 'Smart Inventory',
      description: 'Intelligent stock management with predictive analytics, low-stock alerts, and expiration tracking'
    },
    {
      icon: <FaUserMd className="text-5xl text-green-600" />,
      title: 'Patient Management',
      description: 'Complete patient profiles with medical history, allergies, and personalized care tracking'
    },
    {
      icon: <FaShieldAlt className="text-5xl text-blue-600" />,
      title: 'Enterprise Security',
      description: 'HIPAA-compliant encryption, complete audit trails, and role-based access control'
    },
    {
      icon: <FaBell className="text-5xl text-orange-600" />,
      title: 'Smart Notifications',
      description: 'Automated alerts for medication refills, expiring medicines, and patient reminders'
    },
    {
      icon: <FaMobileAlt className="text-5xl text-purple-600" />,
      title: 'Mobile Access',
      description: 'Access your pharmacy system anywhere, anytime from any device with full functionality'
    },
    {
      icon: <FaClipboardCheck className="text-5xl text-teal-600" />,
      title: 'Insurance Integration',
      description: 'Seamlessly process claims with major Rwandan insurance providers including RAMA, MMI, and Britam'
    },
    {
      icon: <FaClock className="text-5xl text-red-600" />,
      title: 'Lightning Fast',
      description: 'Process prescriptions in seconds with an intuitive interface designed for speed and efficiency'
    }
  ];

  const insuranceProviders = [
    { name: 'RAMA', logo: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&h=100&fit=crop' },
    { name: 'MMI', logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=100&fit=crop' },
    { name: 'Britam', logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=100&fit=crop' },
    { name: 'Soras', logo: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=200&h=100&fit=crop' },
    { name: 'Radiant', logo: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=200&h=100&fit=crop' },
    { name: 'UAP', logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=100&fit=crop' }
  ];

  const partners = [
    { 
      name: 'AUCA University', 
      type: 'Academic Partner',
      logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8f/Adventist_University_of_Central_Africa_logo.png/220px-Adventist_University_of_Central_Africa_logo.png'
    },
    { 
      name: 'King Faisal Hospital', 
      type: 'Healthcare Partner',
      logo: 'https://www.kfh.rw/assets/img/logo.png'
    },
    { 
      name: 'CHUK', 
      type: 'Healthcare Partner',
      logo: '/assets/images/chuk-logo.png'
    },
    { 
      name: 'Rwanda Biomedical Center', 
      type: 'Government Partner',
      logo: 'https://www.rbc.gov.rw/fileadmin/templates/images/logo.png'
    },
    { 
      name: 'Pharmacy Council Rwanda', 
      type: 'Regulatory Partner',
      logo: '/assets/images/pharmacy-council-logo.png'
    },
    { 
      name: 'University of Rwanda', 
      type: 'Academic Partner',
      logo: 'https://www.ur.ac.rw/IMG/png/ur_logo.png'
    },
    { 
      name: 'Kibagabaga Hospital', 
      type: 'Healthcare Partner',
      logo: '/assets/images/kibagabaga-logo.png'
    },
    { 
      name: 'Rwanda FDA', 
      type: 'Regulatory Partner',
      logo: 'https://www.rbc.gov.rw/fileadmin/templates/images/logo.png'
    }
  ];

  const testimonials = [
    {
      name: 'Kwibuka Ishimwe',
      role: 'Chief Pharmacist, City Pharmacy Kigali',
      image: client1,
      text: 'PharmaCare has revolutionized our operations. We reduced medication errors by 85% and saved over 4 hours daily on paperwork. The insurance integration is seamless!',
      rating: 5
    },
    {
      name: 'Ngabo Angellos',
      role: 'Owner, Remera Medical Pharmacy',
      image: client2,
      text: 'The inventory management feature is incredible. We never run out of essential medicines anymore, and the automatic alerts have been a game-changer for our business.',
      rating: 5
    },
    {
      name: 'Titus Irimaso',
      role: 'Pharmacy Manager, Nyamirambo Clinic',
      image: client3,
      text: 'Outstanding system! Patient management is so easy now, and the mobile access means I can monitor my pharmacy even when I am away. Highly recommended!',
      rating: 5
    },
    {
      name: 'Mugisha Leopard',
      role: 'Director, Kicukiro Health Pharmacy',
      image: client4,
      text: 'The best investment we made for our pharmacy. Real-time reporting and analytics help us make better business decisions every day. Excellent support team!',
      rating: 5
    }
  ];

  const stats = [
    { value: '500+', label: 'Active Pharmacies' },
    { value: '50K+', label: 'Prescriptions Daily' },
    { value: '99.9%', label: 'Uptime Guaranteed' },
    { value: '24/7', label: 'Expert Support' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPartner((prev) => (prev + 1) % partners.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [partners.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-11 h-11 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                <FaHospital className="text-white text-xl" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                PharmaCare
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                Features
              </a>
              <a href="#insurance" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                Insurance
              </a>
              <a href="#testimonials" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                Testimonials
              </a>
              <a href="#partners" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                Partners
              </a>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/login');
                }}
                className="px-5 py-2.5 text-gray-700 hover:text-primary-600 font-semibold transition-colors"
              >
                Sign In
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/register');
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-lg hover:scale-105 font-semibold transition-all duration-200"
              >
                Start Free Trial
              </button>
            </div>

            <button 
              type="button"
              className="md:hidden text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <FaTimes className="text-2xl" /> : <FaBars className="text-2xl" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-6 border-t border-gray-100">
              <nav className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-700 hover:text-primary-600 font-medium">Features</a>
                <a href="#insurance" className="text-gray-700 hover:text-primary-600 font-medium">Insurance</a>
                <a href="#testimonials" className="text-gray-700 hover:text-primary-600 font-medium">Testimonials</a>
                <a href="#partners" className="text-gray-700 hover:text-primary-600 font-medium">Partners</a>
                <button 
                  onClick={() => navigate('/login')}
                  className="px-6 py-2.5 text-gray-700 hover:text-primary-600 font-semibold text-left"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => navigate('/register')}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold"
                >
                  Start Free Trial
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      <section className="pt-32 pb-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block mb-6">
                <span className="px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-semibold">
                  Trusted by 500+ Pharmacies Nationwide
                </span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Transform Your Pharmacy Into a 
                <span className="bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent"> Digital Powerhouse</span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed mb-10">
                The complete pharmacy management solution that reduces errors by 90%, saves hours daily, and delivers exceptional patient care. Integrated with all major Rwandan insurance providers.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/register');
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-xl hover:scale-105 font-semibold text-lg transition-all duration-200"
                >
                  Start Your 14-Day Free Trial
                </button>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    // Scroll to features section or handle demo
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-8 py-4 bg-white text-gray-700 border-2 border-gray-200 rounded-xl hover:border-primary-600 hover:text-primary-600 font-semibold text-lg transition-all duration-200"
                >
                  Watch Demo
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-500 text-lg" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-500 text-lg" />
                  <span>Setup in 5 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-500 text-lg" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-blue-100 rounded-3xl transform rotate-3"></div>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&h=600&fit=crop" 
                  alt="Modern Pharmacy"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <h3 className="text-2xl font-bold mb-2">Modern Pharmacy Management</h3>
                  <p className="text-gray-200">Efficient, Secure, and Patient-Centered</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="insurance" className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Accepted Insurance Providers
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Seamlessly integrated with all major insurance providers in Rwanda for faster claims processing
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {insuranceProviders.map((insurance, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 flex flex-col items-center justify-center"
              >
                <div className="w-full h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-2xl font-bold text-gray-700">{insurance.name}</span>
                </div>
                <span className="text-sm text-gray-600 font-medium">Accepted</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Everything Your Pharmacy Needs to Thrive
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features engineered for modern pharmacies to maximize efficiency, ensure compliance, and deliver outstanding patient care
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary-200"
              >
                <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              What Our Clients Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real experiences from pharmacy professionals across Rwanda
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100">
              <FaQuoteLeft className="text-5xl text-primary-200 mb-6" />
              
              <div className="flex mb-4">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <FaStar key={i} className="text-yellow-400 text-xl" />
                ))}
              </div>

              <p className="text-xl text-gray-700 mb-8 leading-relaxed italic">
                {testimonials[currentTestimonial].text}
              </p>

              <div className="flex items-center gap-4">
                <img 
                  src={testimonials[currentTestimonial].image}
                  alt={testimonials[currentTestimonial].name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-lg font-bold text-gray-900">
                    {testimonials[currentTestimonial].name}
                  </h4>
                  <p className="text-gray-600">
                    {testimonials[currentTestimonial].role}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial ? 'bg-primary-600 w-8' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="partners" className="py-20 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our Trusted Partners
            </h2>
            <p className="text-xl text-gray-600">
              Collaborating with leading institutions across Rwanda
            </p>
          </div>

          <div className="relative overflow-hidden h-40">
            <div className="flex absolute left-0 transition-transform duration-500 ease-in-out"
                 style={{ transform: `translateX(-${currentPartner * 320}px)` }}>
              {[...partners, ...partners].map((partner, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-80 mx-4 bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <img 
                      src={partner.logo} 
                      alt={partner.name}
                      className="w-24 h-16 object-contain"
                    />
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900 mb-1">{partner.name}</h4>
                      <p className="text-sm text-primary-600 font-medium">{partner.type}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-primary-600 to-primary-700">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Ready to Revolutionize Your Pharmacy Operations?
              </h2>
              <p className="text-xl text-primary-100 mb-8 leading-relaxed">
                Join hundreds of pharmacies already experiencing dramatic improvements in efficiency, accuracy, and patient satisfaction. Start your transformation today with zero risk.
              </p>
              
              <div className="space-y-4 mb-10">
                {[
                  'Reduce medication errors by 90%',
                  'Save 3+ hours daily on administrative tasks',
                  'Never run out of critical medicines',
                  'Instant insurance claim processing',
                  'Full HIPAA compliance built-in',
                  '24/7 expert support included'
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <FaCheckCircle className="text-green-300 text-xl flex-shrink-0" />
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-10 shadow-2xl">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Start Your Free Trial
              </h3>
              <p className="text-gray-600 mb-8">
                Experience the full power of PharmaCare risk-free for 14 days. No credit card required.
              </p>
              
              <button 
                onClick={() => navigate('/register')}
                className="w-full px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-lg hover:scale-105 font-semibold text-lg mb-6 transition-all duration-200"
              >
                Get Started Now - It's Free
              </button>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">14 Days</div>
                  <div className="text-sm text-gray-600">Free Trial</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">5 Min</div>
                  <div className="text-sm text-gray-600">Setup Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
                  <FaHospital className="text-white text-lg" />
                </div>
                <span className="text-xl font-bold text-white">PharmaCare</span>
              </div>
              <p className="text-gray-500 leading-relaxed">
                Empowering pharmacies with cutting-edge technology for better healthcare delivery.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Updates</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">
              © 2024 PharmaCare. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;