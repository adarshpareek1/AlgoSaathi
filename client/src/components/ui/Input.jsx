const Input = ({ label, icon: Icon, type = "text", ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          type={type}
          className={`w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 
            ${Icon ? 'pl-10' : 'pl-4'} pr-4 text-white placeholder-slate-500 
            focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 
            transition disabled:opacity-50 disabled:cursor-not-allowed`}
          {...props}
        />
      </div>
    </div>
  );
};

export default Input;