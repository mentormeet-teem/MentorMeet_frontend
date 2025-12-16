import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../../utils/auth';
import { 
  FiChevronRight,
  FiShield,
  FiCreditCard,
  FiCheckCircle,
  FiBookOpen,
  FiUsers,
  FiCalendar,
  FiDownload
} from 'react-icons/fi';
import {
  FaChalkboardTeacher,
  FaUserGraduate,
  FaBuilding,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
  FaStar,
  FaLock,
  FaMobileAlt
} from 'react-icons/fa';
import { RiParentLine, RiBookReadLine } from 'react-icons/ri';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    document.body.classList.toggle('menu-open');
  };
  
  // Close mobile menu when a navigation link is clicked
  const closeMenu = () => {
    setIsMenuOpen(false);
    document.body.classList.remove('menu-open');
  };

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
      return;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [navigate]);

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="nav-content">
            <Link to="/" className="logo">MentorMeet</Link>
            
            <button 
              className="hamburger" 
              onClick={toggleMenu}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>
            
            <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
              <a href="#purpose" className="nav-link" onClick={closeMenu}>Platform</a>
              <a href="#how-it-works" className="nav-link" onClick={closeMenu}>How It Works</a>
              <Link to="/login" className="nav-link" onClick={closeMenu}>Sign In</Link>
              <Link to="/register" className="nav-link nav-cta" onClick={closeMenu}>
                Get Started <FiChevronRight className="ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-background">
          <img 
            src="/h.jpg" 
            className="h"
          />
          <div className="hero-overlay"></div>
        </div>
        
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="hero-title-line">Transform Your Learning</span>
              <span className="hero-title-line">With Expert Mentors</span>
            </h1>
            
            <p className="hero-subtitle">
              Connect with verified tutors, track progress in real-time, and achieve 
              academic excellence through our premium mentoring platform.
            </p>
            
            <div className="hero-cta">
              <div className="relative group">
                <button className="btn btn-primary cursor-default">
                  <FaUserGraduate className="mr-2" />
                  Download Our App
                  <FiChevronRight className="ml-2" />
                </button>
              </div>
              <Link to="/login" className="btn btn-outline">
                <FaChalkboardTeacher className="mr-2" />
                Tutor Portal
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section id="purpose" className="features">
        <div className="container">
          <div className="features-header">
            <h2 className="section-title">About Platform</h2>
            <p className="section-subtitle">Designed for comprehensive educational support</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FaUserGraduate />
              </div>
              <h3>For Students</h3>
              <p>
                Connect with expert tutors, track your progress, and achieve 
                academic success with our structured learning platform.
              </p>
              <div className="app-access-tag">
                <FaMobileAlt className="mr-2" />
                Available on mobile app
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <FaChalkboardTeacher />
              </div>
              <h3>For Tutors</h3>
              <p>
                Build your professional profile, get verified, and connect with students. 
                Fair income opportunities with flexible scheduling.
              </p>
              <Link to="/login" className="feature-link">
                Tutor Login <FiChevronRight />
              </Link>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <RiParentLine />
              </div>
              <h3>For Parents</h3>
              <p>
                Monitor your child's learning progress and achievements. 
                Stay informed about their educational journey.
              </p>
              <div className="app-access-tag">
                Available through student account
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <FaBuilding />
              </div>
              <h3>For Institutions</h3>
              <p>
                Upload materials, sponsor students, and offer certifications. 
                Manage educational programs through our platform.
              </p>
              <Link to="/login" className="feature-link">
                Institution Login <FiChevronRight />
              </Link>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <FiCreditCard />
              </div>
              <h3>Secure Payments</h3>
              <p>
                Legal, traceable payment system ensuring secure transactions 
                with transparent billing and detailed records.
              </p>
              <div className="app-access-tag">
                <FiCheckCircle /> Trust & Safety
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <FiShield />
              </div>
              <h3>Verified Platform</h3>
              <p>
                Every tutor undergoes verification. Structured system maintains 
                quality standards and ensures safe learning environment.
              </p>
              <div className="app-access-tag">
                <FiCheckCircle /> Quality Assured
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <div className="features-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Simple steps to guide you</p>
          </div>
          
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Register</h3>
              <p>
                Create your account based on your role,
                Complete your profile with necessary information.
              </p>
            </div>
            
            <div className="step">
              <div className="step-number">2</div>
              <h3>Find Match</h3>
              <p>
                Students find tutors by subject and schedule. 
                Tutors get matched with suitable students seeking their expertise.
              </p>
            </div>
            
            <div className="step">
              <div className="step-number">3</div>
              <h3>Book Sessions</h3>
              <p>
                Schedule tutoring sessions at convenient times. 
                Use integrated calendar for seamless booking.
              </p>
            </div>
            
            <div className="step">
              <div className="step-number">4</div>
              <h3>Learn & Grow</h3>
              <p>
                Engage in effective learning sessions. 
                Track progress and achieve academic goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Start Your Educational Journey</h2>
            <p>
              Join our platform and experience structured, verified online education 
              designed for success.
            </p>
            <div className="cta-buttons">
              <a href="#download-app" className="btn btn-primary">
                <FaMobileAlt className="mr-2" />
                Download Mobile App
                <FiDownload className="ml-2" />
              </a>
              <Link to="/login" className="btn btn-outline">
                <FaChalkboardTeacher className="mr-2" />
                Access Tutor Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-about">
              <h3>MentorMeet</h3>
              <p>
                A platform connecting verified tutors with students 
                for structured online education.
              </p>
          </div>
            
            <div className="footer-links">
              <div>
                <h4>Platform</h4>
                <ul>
                  <li><a href="#purpose">For Students</a></li>
                  <li><a href="#purpose">For Tutors</a></li>
                  <li><a href="#purpose">For Institutions</a></li>
                  <li><Link to="/register">Get Started</Link></li>
                </ul>
              </div>
              
              <div>
                <h4>Support</h4>
                <ul>
                  <li><Link to="/help">Help Center</Link></li>
                  <li><Link to="/faq">FAQ</Link></li>
                  <li><Link to="/contact">Contact</Link></li>
                  <li><Link to="/privacy">Privacy</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} MentorMeet. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;