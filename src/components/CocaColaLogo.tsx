export function CocaColaScriptLogo({ className = "h-8 text-white" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 300 95" 
      fill="currentColor" 
      className={className}
      aria-label="Coca-Cola"
    >
      <text 
        x="10" 
        y="68" 
        fontFamily="'Brush Script MT', 'Dancing Script', 'Edwardian Script ITC', 'Lucida Calligraphy', cursive" 
        fontSize="76" 
        fontWeight="bold" 
        fontStyle="italic"
        letterSpacing="-1px"
      >
        Coca-Cola
      </text>
    </svg>
  );
}

export function CocaColaBadge({ className = "h-6 text-white" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center space-x-1.5 font-black uppercase tracking-wider ${className}`}>
      <span className="font-['Poppins'] font-black tracking-tighter">Coca-Cola</span>
      <span className="text-[10px] bg-white text-[#F40009] px-1.5 py-0.2 rounded font-black">INVEST</span>
    </div>
  );
}
