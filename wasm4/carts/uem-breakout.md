---
author: Jean Massumi Tamura Aoyagui
github: Jean-Massumi
date: 2025-07-14
---

# UEM Breakout

Um clone do clássico jogo Breakout, desenvolvido em C para o fantasy console [WASM-4](https://wasm4.org). 🕹️

O jogo recria a experiência arcade atemporal onde o jogador controla uma raquete para rebater uma bola e quebrar fileiras de blocos. Possui uma bola dinâmica que reage ao movimento da raquete e múltiplos estados de jogo, como menu, jogo, game over e tela de vitória.

## Funcionalidades

-   **Raquete Controlável**: Use as setas para mover a raquete na parte inferior da tela.
-   **Física da Bola**: A bola ricocheteia nas paredes e na raquete. O ângulo de reflexão na raquete é influenciado pelo local do impacto e pelo movimento da raquete.
-   **Blocos Destrutíveis**: Uma parede de blocos com cores diferentes, cada uma valendo uma pontuação específica.
-   **Estados de Jogo**: O jogo possui um menu inicial, tela de jogo, tela de "Game Over" e tela de "Vitória".
-   **Detecção de Colisão**: Lógica de colisão precisa entre a bola, os blocos, a raquete e as paredes.

## Controles

-   **Setas Esquerda/Direita**: Movem a raquete.
-   **Botão X**: Inicia o jogo no menu, lança a bola e reinicia o jogo após "Game Over" ou "Vitória".
-   **Botão Z**: Retorna ao menu principal durante o jogo.

## Como Jogar

1.  Na tela de menu, pressione **X** para começar.
2.  Use as **setas direcionais** para mover a raquete.
3.  Pressione **X** para lançar a bola.
4.  Rebata a bola para quebrar os blocos coloridos na parte superior.
5.  Não deixe a bola passar pela sua raquete.
6.  O jogo termina quando todos os blocos são destruídos (vitória) ou quando a bola cai (game over).

## Compilando

Para compilar o cartucho, execute:

shell: make

Depois para rodar:

shell: w4 run build/UEM-breakouot_game.wasm


