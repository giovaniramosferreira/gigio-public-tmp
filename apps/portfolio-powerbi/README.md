# Portfólio Power BI & Data Analytics

Landing page de portfólio construída em HTML, CSS e JavaScript puros — sem framework,
sem build step, sem dependência externa além das fontes.

**No ar:** https://giovaniramosferreira.github.io/PowerBi_Portifolio/

## O que tem aqui

Seis estudos de caso de BI: cenários de negócio recriados do zero para demonstrar
modelagem dimensional, DAX e arquitetura de dados — vendas executivas, RH, marketing,
supply chain, eficiência operacional e DRE.

Os números exibidos nos dashboards são fictícios. São recriações autorais, não entregas
de cliente — a página diz isso explicitamente na seção de projetos.

## Decisões de projeto

**Zero dependência de runtime.** Três arquivos: `index.html`, `style.css`, `script.js`.
Carrega direto no GitHub Pages sem pipeline de build. Para uma página que muda pouco,
qualquer framework seria peso sem retorno.

**Canvas de partículas em vez de biblioteca de animação.** O fundo animado é ~60 linhas
de canvas 2D com densidade adaptativa (40 partículas no mobile, 80 no desktop) — mais
leve que importar uma lib de animação inteira para um efeito só.

**Reveal por `IntersectionObserver`.** As animações de entrada disparam por observer com
`threshold: .12`, não por listener de scroll. Sem trabalho por frame quando nada entra
em viewport.

**Contadores animados só na primeira vez.** Os números do hero animam quando entram em
tela e param — o observer desconecta depois, sem re-disparo a cada scroll.

## Rodando local

Não precisa de servidor. Abrir `index.html` no navegador basta.

## Stack

HTML5 · CSS3 (custom properties, clamp, grid) · JavaScript (ES6, Canvas API,
IntersectionObserver)
