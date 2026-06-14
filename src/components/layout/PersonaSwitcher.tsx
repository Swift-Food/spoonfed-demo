import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { PERSONAS, PERSONA_HOME_ROUTES } from '../../lib/personas';

export default function PersonaSwitcher() {
  const persona = useStore((s) => s.persona);
  const setPersona = useStore((s) => s.setPersona);
  const navigate = useNavigate();

  const currentIndex = PERSONAS.findIndex(
    (p) => p.persona.role === persona.role && p.persona.contactId === persona.contactId,
  );

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const next = PERSONAS[Number(e.target.value)];
    setPersona(next.persona);
    navigate(PERSONA_HOME_ROUTES[next.persona.role]);
  };

  return (
    <select
      value={currentIndex === -1 ? 0 : currentIndex}
      onChange={handleChange}
      aria-label="Switch persona"
      className="rounded-lg border border-eden-sage bg-white px-3 py-1.5 text-sm text-eden-charcoal focus:border-eden-green focus:outline-none focus:ring-1 focus:ring-eden-green"
    >
      {PERSONAS.map((p, i) => (
        <option key={p.label} value={i}>
          {p.label}
        </option>
      ))}
    </select>
  );
}
