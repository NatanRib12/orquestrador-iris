import pathlib
import re

from playwright.sync_api import sync_playwright

AQUI = pathlib.Path(__file__).parent
FONTE_CSS = pathlib.Path(r"C:\dev\irisfuseaiot\apresentacao\css\fontes.css")
ESTILO_CSS = AQUI / "estilo.css"
ENTRADA = AQUI / "desafio2.html"
MONTADO = AQUI / ".desafio2-montado.html"
SAIDA = AQUI.parent / "Desafio-IRIS-Orquestrador.pdf"


def chromium_local():
    base = pathlib.Path.home() / "AppData" / "Local" / "ms-playwright"
    if not base.exists():
        return None
    for pasta in sorted(base.glob("chromium-*"), reverse=True):
        for nome in ("chrome-win64", "chrome-win"):
            exe = pasta / nome / "chrome.exe"
            if exe.exists():
                return str(exe)
    return None


def montar():
    html = ENTRADA.read_text(encoding="utf-8")

    if FONTE_CSS.exists():
        fonte = FONTE_CSS.read_text(encoding="utf-8")
        fonte = re.sub(r"/\*.*?\*/", "", fonte, flags=re.S).strip()
        html = html.replace("<!--FONTE-->", "<style>\n" + fonte + "\n</style>")
    else:
        print(f"aviso: {FONTE_CSS} nao encontrado, usando fonte do sistema")

    estilo = ESTILO_CSS.read_text(encoding="utf-8")
    html = html.replace("<!--ESTILO-->", "<style>\n" + estilo + "\n</style>")

    MONTADO.write_text(html, encoding="utf-8")
    return MONTADO


def render(arquivo):
    with sync_playwright() as p:
        binario = chromium_local()
        navegador = p.chromium.launch(executable_path=binario) if binario else p.chromium.launch()
        pagina = navegador.new_page()
        pagina.goto(arquivo.as_uri())
        pagina.wait_for_timeout(1200)
        pagina.pdf(
            path=str(SAIDA),
            format="A4",
            landscape=False,
            print_background=True,
            prefer_css_page_size=True,
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
        )
        navegador.close()


if __name__ == "__main__":
    arquivo = montar()
    render(arquivo)
    arquivo.unlink(missing_ok=True)
    print(f"gerado: {SAIDA}  ({SAIDA.stat().st_size // 1024} KB)")
