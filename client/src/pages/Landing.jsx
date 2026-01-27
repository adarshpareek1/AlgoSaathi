import { Link, useNavigate } from 'react-router-dom';
import { Code2, Cpu, FileText, ChevronRight } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/workspace');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Reusable Navbar */}
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-16 px-6 text-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium mb-6 border border-blue-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          New: AI-Powered Context Analysis
        </div>
        
        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6">
          Master Coding with <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Intelligent Hints
          </span>
        </h1>
        
        <p className="text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed">
          Don't just copy-paste solutions. Get progressive, context-aware nudges 
          that help you solve LeetCode problems without ruining the "Aha!" moment.
        </p>

        {/* Call to Actions using Reusable Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link to="/signup">
            <Button variant="primary" className="h-12 px-8 text-base w-full sm:w-auto">
              Start solving for free 
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          
          <a href="#features">
            <Button variant="secondary" className="h-12 px-8 text-base w-full sm:w-auto">
              How it works
            </Button>
          </a>
        </div>
      </main>

      {/* Feature Grid */}
      <section id="features" className="py-24 bg-slate-900/50 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Cpu className="w-6 h-6 text-indigo-400" />}
            title="AI Logic Analysis"
            desc="Our engine analyzes your code's complexity (Big O) and logic flaws instantly."
          />
          <FeatureCard 
            icon={<FileText className="w-6 h-6 text-emerald-400" />}
            title="Progressive Hints"
            desc="Get 3 levels of hints. From vague nudges to mathematical proofs, never get stuck."
          />
          <FeatureCard 
            icon={<Code2 className="w-6 h-6 text-amber-400" />}
            title="Multi-Language"
            desc="Support for C++, Python, Java, and JavaScript with syntax highlighting."
          />
        </div>
      </section>
    </div>
  );
};

// Local component for Features (Clean & Isolated)
const FeatureCard = ({ icon, title, desc }) => (
  <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition hover:shadow-xl hover:shadow-blue-500/5 group">
    <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center mb-4 border border-slate-800 group-hover:border-slate-700 transition">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-slate-400 leading-relaxed">{desc}</p>
  </div>
);

export default LandingPage;