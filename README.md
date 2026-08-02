# giovaniramosferreira.github.io

Portfólio pessoal — https://giovaniramosferreira.github.io/

Site estático, sem framework e sem build step: três arquivos servidos direto
pelo GitHub Pages.

## Decisões

**Cada projeto entra pela decisão de engenharia, não pela stack.** Lista de
tecnologia não diferencia ninguém; o que diferencia é mostrar o trade-off —
por que o teto de três vídeos por execução do cron, por que um repositório
fica fechado. É isso que se avalia numa entrevista técnica.

**Sem framework.** A página muda poucas vezes por ano. Qualquer build step
seria manutenção sem retorno.

**Papel claro em vez de dark mode.** Portfólio de IA converge para fundo
escuro com gradiente. O tema claro de ficha técnica destoa — e tem variante
escura via `prefers-color-scheme` para quem prefere.

**Movimento contido.** Reveal por `IntersectionObserver`, desconectando o
observer após a primeira entrada. Respeita `prefers-reduced-motion`.

## Stack

HTML · CSS (custom properties, `color-mix`, grid) · JavaScript (ES5,
`IntersectionObserver`) · Instrument Serif + IBM Plex Mono
