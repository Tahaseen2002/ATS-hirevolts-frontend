// Rupee Symbol Component - ensures the rupee symbol displays correctly
export default function RupeeSymbol() {
  return (
    <span 
      className="rupee-symbol inline-block"
      style={{ 
        fontFamily: "'Inter', 'Noto Sans', 'Arial Unicode MS', 'Lucida Grande', 'DejaVu Sans', sans-serif",
        fontSize: 'inherit',
        lineHeight: 'inherit',
        fontWeight: 'inherit'
      }}
      aria-label="Rupees"
    >
      ₹
    </span>
  );
}

