import uvicorn

if __name__ == "__main__":
    from rich.console import Console

    console = Console()
    console.rule("[bold cyan]HirePulse Server[/bold cyan]")
    console.print("⚡ Initializing API...", style="bold green")

    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        reload_dirs=["app"],   
        log_level="info",
    )
