type PlanoRow = {
  id: string;
  name: string;
  badge: string | null;
  monthly_amount: number;
  features: string[];
  is_featured: boolean;
  sort_order: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Fallback hardcoded plans shown if DB has no plans yet
const fallbackPlanos: PlanoRow[] = [
  {
    id: "1",
    name: "Base Inicial",
    badge: "Iniciante",
    monthly_amount: 650,
    features: [
      "Fundamental",
      "2 matérias (Mat + Ing)",
      "2 aulas/semana (50min)",
    ],
    is_featured: false,
    sort_order: 0,
  },
  {
    id: "2",
    name: "Essencial",
    badge: "Focado",
    monthly_amount: 700,
    features: [
      "Fís, Mat ou Inglês",
      "2 aulas/semana (60min)",
      "Foco em 1 disciplina",
    ],
    is_featured: false,
    sort_order: 1,
  },
  {
    id: "3",
    name: "Avançado",
    badge: "Recomendado",
    monthly_amount: 1000,
    features: ["2 disciplinas", "3 aulas/semana (60min)", "Material de apoio"],
    is_featured: true,
    sort_order: 2,
  },
  {
    id: "4",
    name: "Premium",
    badge: "Elite",
    monthly_amount: 1300,
    features: [
      "3 disciplinas",
      "4 aulas/semana (60min)",
      "Suporte via WhatsApp",
    ],
    is_featured: false,
    sort_order: 3,
  },
];

export function PlanosSection({
  planos,
  zcalUrl,
}: {
  planos: PlanoRow[];
  zcalUrl: string;
}) {
  const displayPlanos = planos.length > 0 ? planos : fallbackPlanos;

  return (
    <section className="py-24 px-6 bg-surface-container-highest" id="planos">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-headline font-bold text-on-surface">
            Planos sob medida
          </h2>
          <p className="text-on-surface-variant">
            Investimento mensal sem contrato de fidelidade. Pagamento via Pix ou
            Cartão.
          </p>
        </div>

        <div
          className={`grid gap-6 items-center ${
            displayPlanos.length === 1
              ? "max-w-sm mx-auto"
              : displayPlanos.length === 2
                ? "md:grid-cols-2 max-w-2xl mx-auto"
                : displayPlanos.length === 3
                  ? "md:grid-cols-3"
                  : "md:grid-cols-2 lg:grid-cols-4"
          }`}
        >
          {displayPlanos.map((plano) =>
            plano.is_featured ? (
              <div
                key={plano.id}
                className="bg-primary text-on-primary p-8 rounded-3xl flex flex-col justify-between shadow-2xl relative overflow-hidden scale-105 z-10"
              >
                <div className="absolute top-4 right-4 bg-tertiary text-on-tertiary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter">
                  {plano.badge ?? "Mais Popular"} ⭐
                </div>
                <div>
                  {plano.badge && (
                    <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                      {plano.badge}
                    </span>
                  )}
                  <h3 className="text-2xl font-bold mt-2 mb-4">{plano.name}</h3>
                  <div className="mb-6">
                    <span className="text-3xl font-black">
                      {formatCurrency(plano.monthly_amount)}
                    </span>
                    <span className="opacity-80">/mês</span>
                  </div>
                  {plano.features.length > 0 && (
                    <ul className="space-y-3 mb-8 text-sm">
                      {plano.features.map((feature, i) => (
                        <li key={i} className="flex gap-2">
                          ✔ {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <a
                  className="block w-full text-center py-3 bg-tertiary text-on-tertiary rounded-xl font-bold hover:shadow-lg transition-all"
                  href={zcalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contratar
                </a>
              </div>
            ) : (
              <div
                key={plano.id}
                className="bg-surface p-8 rounded-3xl flex flex-col justify-between hover:shadow-xl transition-all"
              >
                <div>
                  {plano.badge && (
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      {plano.badge}
                    </span>
                  )}
                  <h3 className="text-2xl font-bold mt-2 mb-4">{plano.name}</h3>
                  <div className="mb-6">
                    <span className="text-3xl font-black text-primary">
                      {formatCurrency(plano.monthly_amount)}
                    </span>
                    <span className="text-on-surface-variant">/mês</span>
                  </div>
                  {plano.features.length > 0 && (
                    <ul className="space-y-3 mb-8 text-sm">
                      {plano.features.map((feature, i) => (
                        <li key={i} className="flex gap-2">
                          ✔ {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <a
                  className="block w-full text-center py-3 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 transition-opacity"
                  href={zcalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contratar
                </a>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
