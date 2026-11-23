/** Blason de la Ludothèque (public/logo*.svg, générés par scripts/make-logo.py) : écu, d20 doré, couronne. */
export default function Logo({ className = 'size-8', framed = false }: { className?: string; framed?: boolean }) {
  return <img src={framed ? '/logo.svg' : '/logo-mark.svg'} alt="" aria-hidden className={className} draggable={false} />;
}
