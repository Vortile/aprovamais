import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types
from PIL import Image

def main():
    root_dir = Path(__file__).resolve().parent.parent
    env_path = root_dir / ".env"
    load_dotenv(dotenv_path=env_path)

    api_key = os.getenv("GEMINI_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_KEY not found in .env", file=sys.stderr)
        sys.exit(1)

    print(f"Loaded GEMINI_KEY successfully (length {len(api_key)})")

    client = genai.Client(api_key=api_key)

    # Let's inspect available models or use gemini-2.5-flash
    model_name = "gemini-2.5-flash"
    
    # Check if we have screenshot files
    images = []
    
    # We can pass the funnel metrics and LP context to the model
    prompt_text = """
Você é um especialista internacional em CRO (Conversion Rate Optimization), Growth Hacking e UX/UI Design para produtos educacionais e eventos presenciais de alta conversão (com foco em turmas de elite para Medicina no ENEM/Manaus).

Análise dos dados do Nosso Funil Atual (Evento: Intensivão ENEM 2026 - Foco Medicina em Manaus):
- Visitantes da Landing Page (page_view): 40
- Cliques no Botão CTA (cta_click): 7 (CTR do CTA: 17.5% - muito bom!)
- Iniciaram o Formulário (form_started): 0 (0% de conversão após o clique no CTA!)
- Enviar/Completar Formulário: 0
- Pagamentos Aprovados: 0

Problema Crítico Detectado:
7 pessoas clicaram no botão "Garantir Vaga" no Hero/Nav da Landing Page, mas NENHUMA pessoa preencheu ou começou a preencher o formulário na página seguinte (/intensivao-medicina/inscricao).

Forneça um relatório altamente estratégico, profissional e detalhado dividido em:
1. Diagnóstico do Gargalo (Por que 7 cliques geraram 0 form_started)
2. Estratégia de UX/UI e CRO para eliminar a fricção no formulário (Embedded Form / Modal vs Multi-page, auto-focus, micro-copy, prova social na página de inscrição)
3. Adequação da Copy e Oferta ao Público de Medicina em Manaus (UFAM/UEA, valor percebido de R$ 500, facilidade de PIX/Cartão)
4. Pipeline Automatizada de Monitoramento e Alertas
"""

    print("Sending prompt to Gemini API...")
    try:
        response = client.models.generate_content(
            model=model_name,
            contents=[prompt_text]
        )
        print("\n--- RESPOSTA DO GEMINI ---")
        print(response.text)
    except Exception as e:
        print(f"Error calling Gemini API with model {model_name}: {e}")
        # Try fallback model
        try:
            print("Retrying with fallback model gemini-1.5-flash...")
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=[prompt_text]
            )
            print("\n--- RESPOSTA DO GEMINI ---")
            print(response.text)
        except Exception as fallback_err:
            print(f"Fallback model error: {fallback_err}")

if __name__ == "__main__":
    main()
