import json
import os
import sys
from openai import OpenAI

def fallback_classify(title: str, description: str):
    text = f"{title} {description}".lower()

    if "login" in text or "contraseña" in text or "sesión" in text:
        return {
            "category": "Autenticación",
            "priority": "Media",
            "summary": "El usuario reporta un problema relacionado con el acceso o inicio de sesión."
        }
    elif "pago" in text or "factura" in text or "cobro" in text:
        return {
            "category": "Facturación",
            "priority": "Alta",
            "summary": "El ticket parece estar relacionado con pagos, facturación o cobros."
        }
    elif "error" in text or "falla" in text or "bug" in text:
        return {
            "category": "Soporte Técnico",
            "priority": "Media",
            "summary": "El usuario reporta una falla técnica o un comportamiento incorrecto del sistema."
        }
    else:
        return {
            "category": "General",
            "priority": "Baja",
            "summary": "El ticket fue clasificado de manera general por el sistema."
        }

def main():
    if len(sys.argv) < 3:
        print(json.dumps({
            "category": "General",
            "priority": "Baja",
            "summary": "Datos insuficientes para clasificar"
        }, ensure_ascii=False))
        sys.exit(0)

    title = sys.argv[1]
    description = sys.argv[2]

    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        print(json.dumps(fallback_classify(title, description), ensure_ascii=False))
        sys.exit(0)

    try:
        client = OpenAI(api_key=api_key)

        prompt = f"""
Analiza este ticket de soporte y devuelve SOLO JSON válido con esta estructura exacta:
{{
  "category": "Autenticación | Facturación | Soporte Técnico | General",
  "priority": "Alta | Media | Baja",
  "summary": "resumen corto en español"
}}

Título: {title}
Descripción: {description}
"""

        response = client.responses.create(
            model="gpt-4o-mini",
            input=prompt
        )

        output_text = response.output_text.strip()

        try:
            parsed = json.loads(output_text)
            print(json.dumps(parsed, ensure_ascii=False))
            sys.exit(0)
        except Exception:
            print(json.dumps({
                "category": "General",
                "priority": "Media",
                "summary": output_text[:500]
            }, ensure_ascii=False))
            sys.exit(0)

    except Exception as e:
        fallback = fallback_classify(title, description)
        fallback["summary"] += " (Clasificación realizada con mecanismo de respaldo.)"
        print(json.dumps(fallback, ensure_ascii=False))
        sys.exit(0)

if __name__ == "__main__":
    main()