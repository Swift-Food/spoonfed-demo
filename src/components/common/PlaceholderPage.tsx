interface PlaceholderPageProps {
  title: string;
  note?: string;
}

export default function PlaceholderPage({ title, note }: PlaceholderPageProps) {
  return (
    <div className="rounded-xl border border-dashed border-eden-sage/60 bg-white/60 px-6 py-16 text-center">
      <h1 className="font-serif text-2xl text-eden-green">{title}</h1>
      <p className="mt-2 text-sm text-eden-stone">{note ?? 'Coming soon.'}</p>
    </div>
  );
}
