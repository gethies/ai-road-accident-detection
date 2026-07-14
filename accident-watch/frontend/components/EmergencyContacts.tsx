import { Phone } from "lucide-react";

const NUMBERS = [
  { label: "Emergency", number: "112" },
  { label: "Highway Helpline", number: "1073" },
  { label: "Ambulance", number: "102" },
];

export function EmergencyContacts() {
  return (
    <footer className="border-t border-white/10 bg-asphalt/50 px-4 py-3">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-4 text-xs text-dim-gray">
        <span className="flex items-center gap-1 font-medium text-mist-white">
          <Phone className="h-3 w-3 text-red-alert" aria-hidden />
          Emergency Numbers:
        </span>
        {NUMBERS.map(({ label, number }) => (
          <span key={number}>
            <span className="text-dim-gray">{label}:</span>{" "}
            <a
              href={`tel:${number}`}
              className="font-mono font-semibold text-lane-yellow hover:underline"
            >
              {number}
            </a>
          </span>
        ))}
      </div>
    </footer>
  );
}
