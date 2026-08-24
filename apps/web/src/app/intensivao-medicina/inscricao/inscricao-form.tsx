"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { evento, serieOptions } from "@/lib/evento/config";
import {
  calculateAge,
  formatCPF,
  formatWhatsapp,
  onlyDigits,
} from "@/lib/evento/format";
import { inscricaoSchema } from "@/lib/validations/inscricao";
import { getEventoSessionId } from "@/lib/evento/session";
import { captureAndGetUtmParams } from "@/lib/evento/utm";
import {
  consultarStatusInscricaoAction,
  criarInscricaoAction,
  trackEventoAction,
} from "@/lib/actions/inscricao";
import { PaymentBrick, type PixResult } from "./payment-brick";

type Step = "form" | "pagamento" | "confirmado";

type FormState = {
  nomeAluno: string;
  emailAluno: string;
  whatsappAluno: string;
  cpfAluno: string;
  dataNascimento: string;
  serieAtual: (typeof serieOptions)[number]["value"] | "";
  nomeResponsavel: string;
  whatsappResponsavel: string;
  restricoesMedicas: string;
};

const initialFormState: FormState = {
  nomeAluno: "",
  emailAluno: "",
  whatsappAluno: "",
  cpfAluno: "",
  dataNascimento: "",
  serieAtual: "",
  nomeResponsavel: "",
  whatsappResponsavel: "",
  restricoesMedicas: "",
};

const inputClassName =
  "w-full bg-surface-container rounded-xl px-4 py-3.5 text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-colors";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-bold text-on-surface">{label}</span>
      {children}
      {error && (
        <span className="block text-xs text-error font-medium">{error}</span>
      )}
    </label>
  );
}

export function InscricaoForm({ precoReais }: { precoReais: number }) {
  const sessionId = useMemo(() => getEventoSessionId(), []);
  const formStartedRef = useRef(false);

  const [step, setStep] = useState<Step>("form");
  const [values, setValues] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [inscricaoId, setInscricaoId] = useState<string | null>(null);
  const [pixData, setPixData] = useState<PixResult | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [confirmacao, setConfirmacao] = useState<{
    turmaAlocada: 1 | 2 | null;
    horarioTurma: string | null;
    codigoIngresso: string;
  } | null>(null);

  const age = values.dataNascimento
    ? calculateAge(values.dataNascimento)
    : null;
  const isMinor = age !== null && age < 18;

  function markFormStarted() {
    if (formStartedRef.current) return;
    formStartedRef.current = true;
    trackEventoAction({ sessionId, tipoEvento: "form_started" }).catch(
      () => {},
    );
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    markFormStarted();
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const utm = captureAndGetUtmParams();
    const parsed = inscricaoSchema.safeParse({
      ...values,
      serieAtual: values.serieAtual || undefined,
      utmSource: utm.utmSource,
      utmMedium: utm.utmMedium,
      utmCampaign: utm.utmCampaign,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      setFormError("Verifique os campos destacados abaixo.");
      return;
    }

    setErrors({});
    setSubmitting(true);
    trackEventoAction({
      sessionId,
      tipoEvento: "form_submitted",
      utmSource: utm.utmSource,
      utmMedium: utm.utmMedium,
      utmCampaign: utm.utmCampaign,
    }).catch(() => {});

    const result = await criarInscricaoAction(parsed.data, sessionId);
    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    setInscricaoId(result.inscricaoId);
    setStep("pagamento");
  }

  function handlePixGenerated(pix: PixResult) {
    setPixData(pix);
    trackEventoAction({
      sessionId,
      tipoEvento: "pix_generated",
      inscricaoId: inscricaoId ?? undefined,
    }).catch(() => {});
  }

  async function handleCopyPix() {
    if (!pixData) return;
    await navigator.clipboard.writeText(pixData.qrCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  }

  async function handleCardApproved() {
    if (!inscricaoId) return;
    const result = await consultarStatusInscricaoAction(inscricaoId);
    if (result.ok) {
      setConfirmacao({
        turmaAlocada: result.turmaAlocada,
        horarioTurma: result.horarioTurma,
        codigoIngresso: result.codigoIngresso,
      });
    }
    setStep("confirmado");
  }

  useEffect(() => {
    if (step !== "pagamento" || !pixData || !inscricaoId) {
      return;
    }

    const interval = setInterval(async () => {
      const result = await consultarStatusInscricaoAction(inscricaoId);
      if (result.ok && result.statusPagamento === "aprovado") {
        clearInterval(interval);
        setConfirmacao({
          turmaAlocada: result.turmaAlocada,
          horarioTurma: result.horarioTurma,
          codigoIngresso: result.codigoIngresso,
        });
        setStep("confirmado");
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [step, pixData, inscricaoId]);

  if (step === "confirmado") {
    return (
      <div className="bg-surface-container-low rounded-3xl p-6 md:p-10 space-y-8 border border-outline-variant/10 shadow-lg print:border-none print:shadow-none print:p-0">
        {/* Print-only CSS style */}
        <style font-sans>{`
          @media print {
            nav, footer, button, .print\\:hidden { display: none !important; }
            body { background: white !important; color: black !important; }
          }
        `}</style>

        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto">
            <span className="material-symbols-outlined text-4xl">
              check_circle
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Pagamento Confirmado
          </p>
          <h2 className="text-2xl md:text-3xl font-headline font-bold text-on-surface">
            Vaga garantida no Intensivão! 🎉
          </h2>
          <p className="text-on-surface-variant text-sm max-w-md mx-auto">
            Sua inscrição foi confirmada com sucesso. Enviamos o ingresso
            digital com QR Code para <strong>{values.emailAluno}</strong>.
          </p>
        </div>

        {/* Card de Resumo do Ingresso */}
        <div className="bg-surface rounded-2xl p-6 border border-outline-variant/20 space-y-6 text-left">
          <div className="grid sm:grid-cols-2 gap-4 pb-4 border-b border-outline-variant/10">
            <div>
              <span className="text-xs text-on-surface-variant font-medium block">
                Aluno Inscrito
              </span>
              <span className="font-bold text-on-surface text-base">
                {values.nomeAluno || "Aluno"}
              </span>
              <span className="text-xs text-on-surface-variant block">
                CPF: {values.cpfAluno}
              </span>
            </div>
            <div>
              <span className="text-xs text-on-surface-variant font-medium block">
                Turma & Horário Alocado
              </span>
              <span className="font-bold text-primary text-base">
                {confirmacao?.turmaAlocada
                  ? `Turma ${confirmacao.turmaAlocada} (${confirmacao.horarioTurma})`
                  : "Turma 1 (08:00 às 10:00)"}
              </span>
              <span className="text-xs text-on-surface-variant block">
                Sala: {evento.salaTurma1}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs text-on-surface-variant font-medium block uppercase tracking-wider">
              Código do Ingresso
            </span>
            <div className="flex items-center justify-between bg-surface-container rounded-xl p-3">
              <span className="font-mono font-bold text-sm text-on-surface select-all">
                {confirmacao?.codigoIngresso || "ING-2026-MED"}
              </span>
              <span className="text-xs text-emerald-700 font-bold bg-emerald-100 px-2.5 py-1 rounded-md">
                CONFIRMADO
              </span>
            </div>
          </div>

          {/* Datas dos Sábados */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface block">
              Calendário dos 4 Sábados Presenciais:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-surface-container p-2.5 rounded-xl">
                <span className="font-bold text-primary block">Sábado 1</span>
                <span>12/09 · 2h</span>
              </div>
              <div className="bg-surface-container p-2.5 rounded-xl">
                <span className="font-bold text-primary block">Sábado 2</span>
                <span>19/09 · 2h</span>
              </div>
              <div className="bg-surface-container p-2.5 rounded-xl">
                <span className="font-bold text-primary block">Sábado 3</span>
                <span>26/09 · 2h</span>
              </div>
              <div className="bg-surface-container p-2.5 rounded-xl">
                <span className="font-bold text-primary block">Sábado 4</span>
                <span>03/10 · 2h</span>
              </div>
            </div>
          </div>

          {/* Localização e Mapa */}
          <div className="space-y-3 pt-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface block">
                Localização do Evento:
              </span>
              <p className="text-sm font-semibold text-on-surface">
                {evento.localNome}
              </p>
              <p className="text-xs text-on-surface-variant">
                {evento.localEndereco}
              </p>
            </div>

            <div className="w-full h-48 rounded-xl overflow-hidden border border-outline-variant/20 bg-surface-container print:hidden">
              <iframe
                title="Mapa do Local"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3984.1037381014167!2d-60.01639!3d-3.06733!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x926c1000676451e5%3A0xb3eefdf000000000!2sOpen%20Laranjeiras%20Gallery!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* Informações de Suporte e Próximos Passos */}
        <div className="bg-blue-50/60 dark:bg-blue-950/20 rounded-2xl p-5 text-left text-xs space-y-2 border border-blue-200/50">
          <p className="font-bold text-blue-900 dark:text-blue-200 text-sm">
            📩 Próximos passos e Acompanhamento:
          </p>
          <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-300">
            <li>
              Verifique seu e-mail (inclusive caixa de spam) para visualizar seu
              ingresso oficial.
            </li>
            <li>
              Entraremos em contato pelo WhatsApp no número{" "}
              <strong>{values.whatsappAluno}</strong> para adicionar você ao
              grupo exclusivo da turma.
            </li>
            <li>
              Dúvidas ou suporte pré-evento? Telefone / WhatsApp:{" "}
              <strong>(92) 98158-1955</strong>.
            </li>
          </ul>
        </div>

        {/* Ações: Imprimir e Voltar */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full sm:w-auto bg-primary hover:bg-blue-700 text-on-primary px-6 py-3.5 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md"
          >
            <span className="material-symbols-outlined text-lg">print</span>
            Imprimir / Salvar Ingresso (PDF)
          </button>
          <a
            href="/intensivao-medicina"
            className="w-full sm:w-auto bg-surface-container hover:bg-surface-container-high text-on-surface px-6 py-3.5 rounded-xl font-bold text-sm inline-flex items-center justify-center transition-colors"
          >
            Voltar para a página principal
          </a>
        </div>
      </div>
    );
  }

  if (step === "pagamento" && inscricaoId) {
    return (
      <div className="bg-surface-container-low rounded-3xl p-8 md:p-10 space-y-6">
        <div className="text-center space-y-1">
          <p className="text-sm font-bold uppercase tracking-widest text-tertiary">
            Passo 2 de 2 — Escolha a forma de pagamento
          </p>
          <h2 className="text-2xl font-bold text-on-surface">
            Investimento — R$ 500,00
          </h2>
          <p className="text-xs text-on-surface-variant font-medium">
            (à vista no Pix / cartão ou em até 10x de R$ 50,00)
          </p>
        </div>

        {!pixData && (
          <PaymentBrick
            inscricaoId={inscricaoId}
            amount={precoReais}
            payerEmail={values.emailAluno}
            payerCpf={onlyDigits(values.cpfAluno)}
            onPixGenerated={handlePixGenerated}
            onCardApproved={handleCardApproved}
            onError={(message) => setPaymentError(message)}
          />
        )}

        {pixData && (
          <div className="text-center space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${pixData.qrCodeBase64}`}
              alt="QR Code do PIX"
              className="mx-auto w-56 h-56 rounded-2xl bg-white p-2"
            />
            <button
              onClick={handleCopyPix}
              className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold cursor-pointer"
            >
              {copySuccess ? "Copiado!" : "Copiar código Pix Copia e Cola"}
            </button>
            <p className="text-sm text-on-surface-variant">
              Aguardando confirmação do pagamento...
            </p>
          </div>
        )}

        {paymentError && (
          <p className="text-center text-error font-medium">{paymentError}</p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface-container-low rounded-3xl p-8 md:p-10 space-y-5"
    >
      <p className="text-sm font-bold uppercase tracking-widest text-tertiary text-center">
        Passo 1 de 2 — Dados do Aluno
      </p>

      <Field label="Nome completo" error={errors.nomeAluno}>
        <input
          className={inputClassName}
          value={values.nomeAluno}
          onChange={(e) => updateField("nomeAluno", e.target.value)}
          placeholder="Nome completo do aluno"
        />
      </Field>

      <Field label="E-mail" error={errors.emailAluno}>
        <input
          type="email"
          className={inputClassName}
          value={values.emailAluno}
          onChange={(e) => updateField("emailAluno", e.target.value)}
          placeholder="seu@email.com"
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="WhatsApp com DDD" error={errors.whatsappAluno}>
          <input
            className={inputClassName}
            value={values.whatsappAluno}
            onChange={(e) =>
              updateField("whatsappAluno", formatWhatsapp(e.target.value))
            }
            placeholder="(92) 9 9999-9999"
          />
        </Field>

        <Field label="CPF" error={errors.cpfAluno}>
          <input
            className={inputClassName}
            value={values.cpfAluno}
            onChange={(e) => updateField("cpfAluno", formatCPF(e.target.value))}
            placeholder="000.000.000-00"
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Data de nascimento" error={errors.dataNascimento}>
          <input
            type="date"
            className={inputClassName}
            value={values.dataNascimento}
            onChange={(e) => updateField("dataNascimento", e.target.value)}
          />
        </Field>

        <Field label="Série atual" error={errors.serieAtual}>
          <select
            className={inputClassName}
            value={values.serieAtual}
            onChange={(e) =>
              updateField(
                "serieAtual",
                e.target.value as FormState["serieAtual"],
              )
            }
          >
            <option value="">Selecione...</option>
            {serieOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {isMinor && (
        <div className="grid sm:grid-cols-2 gap-5 bg-secondary-container/30 p-5 rounded-2xl">
          <Field label="Nome do responsável" error={errors.nomeResponsavel}>
            <input
              className={inputClassName}
              value={values.nomeResponsavel}
              onChange={(e) => updateField("nomeResponsavel", e.target.value)}
              placeholder="Nome do responsável"
            />
          </Field>
          <Field
            label="WhatsApp do responsável"
            error={errors.whatsappResponsavel}
          >
            <input
              className={inputClassName}
              value={values.whatsappResponsavel}
              onChange={(e) =>
                updateField(
                  "whatsappResponsavel",
                  formatWhatsapp(e.target.value),
                )
              }
              placeholder="(92) 9 9999-9999"
            />
          </Field>
        </div>
      )}

      {formError && (
        <p className="text-center text-error font-medium">{formError}</p>
      )}

      <div className="space-y-2 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-tertiary hover:bg-blue-700 text-on-tertiary px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
        >
          {submitting
            ? "Processando inscrição..."
            : "Ir para o Pagamento — R$ 500"}
        </button>
        <p className="text-xs text-center text-on-surface-variant font-medium">
          🔒 Inscrição rápida e 100% segura • Processado pelo Mercado Pago •
          Ingresso instantâneo
        </p>
      </div>
    </form>
  );
}
