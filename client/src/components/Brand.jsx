import { Code2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Brand = ({ className = "" }) => (
  <Link to="/" className={`flex items-center gap-2 font-bold text-xl tracking-tight text-white ${className}`}>
    <Code2 className="w-6 h-6 text-blue-500" />
    <span>Algo<span className="text-blue-500">Saathi</span></span>
  </Link>
);

export default Brand;