"""
calcular.py

Modo CLI/headless para uso em container/microserviço.

Entrada: caminho para a imagem como primeiro argumento de linha de comando.
Saída: JSON impresso no stdout com os campos:
  - comprimento_pixels
  - comprimento_cm
  - area_raiz_cm2
  - volume_estimado_cm3
  - proporcao_area
  - imagem_resultado_base64 (data URI PNG)

Em caso de erro, retorna um JSON de erro no stderr e sai com código != 0.
"""

import sys
import json
import base64
import io
import os

import cv2
import numpy as np
from PIL import Image
from skimage.morphology import skeletonize


def processar_imagem(caminho_imagem: str):
    if not os.path.exists(caminho_imagem):
        raise FileNotFoundError(f"Arquivo não encontrado: {caminho_imagem}")

    # Carrega imagem com PIL (mais robusto para formatos variados)
    img_pil = Image.open(caminho_imagem).convert("RGB")
    imagem_rgb = np.array(img_pil)

    # Máscara de cor (intervalo RGB) — ajuste se necessário
    cor_inf = np.array([109, 92, 80], dtype=np.uint8)
    cor_sup = np.array([177, 145, 131], dtype=np.uint8)
    mascara = cv2.inRange(imagem_rgb, cor_inf, cor_sup)

    # binária para operações morfológicas
    binaria = (mascara > 0).astype(np.uint8)

    # esqueletização espera uma matriz booleana 2D
    skeleton = skeletonize(binaria > 0)

    comprimento_pixels = int(np.count_nonzero(skeleton))

    # Overlay: marca o esqueleto em vermelho sobre a imagem RGB
    skt_rgb = np.zeros_like(imagem_rgb)
    skt_rgb[skeleton] = [255, 0, 0]
    overlay = cv2.addWeighted(imagem_rgb.astype(np.uint8), 0.8, skt_rgb.astype(np.uint8), 0.5, 0)

    # Conversão para cm (assume altura física = 23 cm conforme código original)
    altura_pixels = imagem_rgb.shape[0]
    if altura_pixels == 0:
        raise ValueError("Imagem com altura inválida (0 pixels)")
    pixel_por_cm = altura_pixels / 23.0
    comprimento_cm = comprimento_pixels / pixel_por_cm if pixel_por_cm != 0 else 0.0

    # Área e volume estimado
    pixels_brancos = int(np.count_nonzero(binaria))
    pixels_totais = int(imagem_rgb.shape[0] * imagem_rgb.shape[1])
    proporcao_area = float(pixels_brancos) / pixels_totais if pixels_totais != 0 else 0.0

    pixel_por_cm2 = pixel_por_cm ** 2
    area_raiz_cm2 = pixels_brancos / pixel_por_cm2 if pixel_por_cm2 != 0 else 0.0

    espessura_media_cm = 0.4
    volume_estimado_cm3 = area_raiz_cm2 * espessura_media_cm

    # Serializa overlay para PNG em memória e codifica em base64 (data URI)
    overlay_pil = Image.fromarray(overlay)
    buf = io.BytesIO()
    overlay_pil.save(buf, format="PNG")
    buf.seek(0)
    b64 = base64.b64encode(buf.read()).decode("ascii")
    data_uri = f"data:image/png;base64,{b64}"

    resultado = {
        "comprimento_pixels": comprimento_pixels,
        "comprimento_cm": round(float(comprimento_cm), 4),
        "area_raiz_cm2": round(float(area_raiz_cm2), 6),
        "volume_estimado_cm3": round(float(volume_estimado_cm3), 6),
        "proporcao_area": round(float(proporcao_area), 6),
        "imagem_resultado_base64": data_uri,
    }

    return resultado


def main():
    if len(sys.argv) < 2:
        err = {"error": "Uso: python calcular.py <caminho_imagem>"}
        print(json.dumps(err), file=sys.stderr)
        sys.exit(2)

    caminho = sys.argv[1]
    try:
        resultado = processar_imagem(caminho)
        # Imprime JSON no stdout para que o processo chamador (index.js) possa capturá-lo
        print(json.dumps(resultado))
    except Exception as e:
        err = {"error": str(e)}
        print(json.dumps(err), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
