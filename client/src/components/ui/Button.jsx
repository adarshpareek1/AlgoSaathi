import { Loader2 } from 'lucide-react';

const Button = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 focus:ring-blue-500",
    secondary: "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 focus:ring-slate-500",
    outline: "bg-transparent border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500",
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-slate-800",
    google: "bg-slate-950 hover:bg-slate-900 text-white border border-slate-800"
  };

  const sizes = "px-4 py-2.5 text-sm";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;