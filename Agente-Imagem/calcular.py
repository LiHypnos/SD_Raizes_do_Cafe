#ATENÇÃO:
#SEM USO REAL POR ENQUANTO, POIS NÃO ESTAMOS USANDO FLASK AINDA!!
#ESSE CÓDIGO DEVE RODAR NO DOCKER, ENTÃO A INTERAÇÃO COM O USUÁRIO DEVE SER FEITA VIA REQUISIÇÕES HTTP.


import cv2
import numpy as np
import matplotlib.pyplot as plt
from skimage.morphology import skeletonize
from tkinter import Tk, filedialog, messagebox
from PIL import Image
import os
from flask import Flask, request, jsonify

def main():
    # Oculta a janela principal do Tkinter
    Tk().withdraw()

    # Abre diálogo para o usuário selecionar a imagem
    caminho_imagem = filedialog.askopenfilename(
        title="Selecione uma imagem",
        filetypes=[("Arquivos de imagem", "*.png *.jpg *.jpeg *.bmp *.tif *.tiff")]
    )

    if not caminho_imagem:
        print("Nenhuma imagem selecionada. Encerrando o programa.")
        return

    # Verifica se o caminho existe
    if not os.path.exists(caminho_imagem):
        raise FileNotFoundError("Caminho inválido ou imagem não encontrada.")

    print(f"Carregando imagem: {caminho_imagem}")

    # 1) Tenta carregar a imagem com PIL (mais robusto para TIFF ou imagens grandes)
    try:
        imagem_pil = Image.open(caminho_imagem).convert("RGB")  # garante RGB
        imagem_rgb = np.array(imagem_pil)
    except Exception as e:
        raise FileNotFoundError(f"Erro ao carregar imagem: {e}")

    # 2) Converte para BGR para compatibilidade com OpenCV se necessário
    imagem_bgr = cv2.cvtColor(imagem_rgb, cv2.COLOR_RGB2BGR)

    # 3) Cria máscara do intervalo de “verde” (ajuste se necessário)
    cor_inf = np.array([109, 92, 80], dtype=np.uint8)
    cor_sup = np.array([177, 145, 131], dtype=np.uint8)
    mascara = cv2.inRange(imagem_rgb, cor_inf, cor_sup)

    # 4) Esqueletiza a máscara
    binaria = (mascara > 0).astype(np.uint8)
    skeleton = skeletonize(binaria)

    # 5) Comprimento total das linhas verdes (pixels do esqueleto)
    comprimento_pixels = np.sum(skeleton)
    print(f"Comprimento total das linhas verdes (em pixels): {comprimento_pixels}")

    # 6) Overlay do esqueleto na imagem original
    skt_rgb = np.zeros_like(imagem_rgb)
    skt_rgb[skeleton] = [255, 0, 0]
    overlay = cv2.addWeighted(imagem_rgb, 0.8, skt_rgb, 0.5, 0)

    # 7) Exibe as imagens (só funciona se tiver interface gráfica)
    plt.figure(figsize=(12, 6))
    plt.subplot(1, 2, 1)
    plt.title("Esqueleto das Linhas Verdes")
    plt.imshow(skeleton, cmap='gray')
    plt.axis('off')

    plt.subplot(1, 2, 2)
    plt.title("Overlay do Esqueleto")
    plt.imshow(overlay)
    plt.axis('off')
    plt.tight_layout()
    plt.show()

    # 8) Conversão de comprimento para cm
    altura_pixels = imagem_rgb.shape[0]
    pixel_por_cm = altura_pixels / 23.0  # 23 cm = altura física
    comprimento_cm = comprimento_pixels / pixel_por_cm

    print(f"Altura da imagem: {altura_pixels} px → 23 cm")
    print(f"Cada cm = {pixel_por_cm:.4f} px")
    print(f"Comprimento total das linhas verdes: {comprimento_cm:.2f} cm")

    # 9) Cálculo da área da raiz e volume estimado
    pixels_brancos = np.count_nonzero(binaria)
    pixels_totais = imagem_rgb.shape[0] * imagem_rgb.shape[1]
    proporcao_area = pixels_brancos / pixels_totais
    indice = 26.4634
    volume_estimado = proporcao_area / indice

    # 10) Área da raiz em cm² e volume estimado em cm³
    largura_pixels = imagem_rgb.shape[1]
    pixel_por_cm2 = pixel_por_cm ** 2
    area_raiz_cm2 = pixels_brancos / pixel_por_cm2

    espessura_media_cm = 0.4  # Assumido com base empírica ou medida
    volume_estimado_cm3 = area_raiz_cm2 * espessura_media_cm


    # Exibe mensagem de conclusão
    mensagem = (
        f"Comprimento total estimado: {comprimento_cm:.2f} cm\n"
        f"Área das raízes: {area_raiz_cm2:.4f} cm²\n"
        f"Volume estimado: {volume_estimado_cm3:.4f} cm³"
    )
    messagebox.showinfo("Resultado da Análise", mensagem)

if __name__ == "__main__":
    main()
