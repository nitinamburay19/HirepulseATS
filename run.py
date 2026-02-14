import uvicorn
import os

if __name__ == "__main__":
    from rich.console import Console

    console = Console()
    console.rule("[bold cyan]HirePulse Server[/bold cyan]")
    console.print("⚡ Initializing API...", style="bold green")

    debug_reload = os.getenv("DEBUG", "false").lower() in {"1", "true", "yes"}

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=debug_reload,
        reload_dirs=["app"],   
        log_level="info",
    )
