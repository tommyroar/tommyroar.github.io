import json
import os
import subprocess
from pathlib import Path
from slugify import slugify
import questionary
from rich.console import Console

console = Console()

APPS_DIR = Path("apps")
BUNDLE_SCRIPT = Path("scripts/bundle_apps.js")

def bundle():
    """Runs the node bundle script to update projects.json."""
    if BUNDLE_SCRIPT.exists():
        console.print("[yellow]Bundling projects...[/yellow]")
        result = subprocess.run(["node", str(BUNDLE_SCRIPT)], capture_output=True, text=True)
        if result.returncode == 0:
            console.print(f"[green]{result.stdout.strip()}[/green]")
        else:
            console.print(f"[red]Error bundling: {result.stderr}[/red]")
    else:
        console.print("[red]Bundle script not found![/red]")

def show_deployment_instructions():
    """Prompt the user with the next steps for deployment."""
    console.print("\n[bold cyan]Next Steps for Deployment (PR Workflow):[/bold cyan]")
    console.print("1. [bold]Create a new branch:[/bold]")
    console.print("   [dim]git checkout -b update-project-index[/dim]")
    console.print("2. [bold]Stage and commit your changes:[/bold]")
    console.print("   [dim]git add . && git commit -m \"Update project index\"[/dim]")
    console.print("3. [bold]Push the branch to GitHub:[/bold]")
    console.print("   [dim]git push -u origin update-project-index[/dim]")
    console.print("4. [bold]Create a Pull Request:[/bold]")
    console.print("   Visit your repository on GitHub and open a PR against [green]main[/green].")
    console.print("5. [bold]Merge the PR:[/bold]")
    console.print("   Once merged, the [bold blue]Build Index[/bold blue] workflow will redeploy the site automatically.")

def prompt_project_info(defaults=None):
    """Common prompts for project information."""
    defaults = defaults or {}
    
    name = questionary.text(
        "Project Name:",
        default=defaults.get("name", "")
    ).ask()
    
    if not name:
        return None
        
    slug = slugify(name)
    
    root_path = questionary.text(
        "URL Path (e.g., /maps/):",
        default=defaults.get("root_path", f"/{slug}/")
    ).ask()
    
    docs_path = questionary.text(
        "Docs Path (e.g., /maps/docs/ - Leave empty to remove link):",
        default=defaults.get("docs_path", f"{root_path.rstrip('/')}/docs/")
    ).ask()
    
    description = questionary.text(
        "Description (Markdown supported):",
        default=defaults.get("description", ""),
        multiline=True
    ).ask()
    
    status = questionary.select(
        "Status:",
        choices=["Active", "Beta", "Archived", "Planning"],
        default=defaults.get("status", "Active")
    ).ask()
    
    tags_str = questionary.text(
        "Tags (comma separated):",
        default=", ".join(defaults.get("tags", []))
    ).ask()
    
    tags = [t.strip() for t in tags_str.split(",") if t.strip()]
    
    return {
        "name": name,
        "root_path": root_path,
        "docs_path": docs_path,
        "description": description,
        "status": status,
        "tags": tags
    }

def add_project():
    """TUI to add a new project."""
    console.print("[bold blue]Add New Project[/bold blue]")
    
    data = prompt_project_info()
    if not data:
        console.print("[yellow]Cancelled.[/yellow]")
        return
        
    slug = slugify(data["name"])
    filename = APPS_DIR / f"{slug}.json"
    
    if filename.exists():
        if not questionary.confirm(f"File {filename} already exists. Overwrite?").ask():
            console.print("[yellow]Cancelled.[/yellow]")
            return
            
    with open(filename, "w") as f:
        json.dump(data, f, indent=2)
        
    console.print(f"[green]Successfully created {filename}[/green]")
    bundle()
    show_deployment_instructions()

def edit_project():
    """TUI to edit an existing project."""
    console.print("[bold blue]Edit Existing Project[/bold blue]")
    
    if not APPS_DIR.exists():
        console.print("[red]Apps directory not found![/red]")
        return
        
    json_files = sorted(list(APPS_DIR.glob("*.json")))
    if not json_files:
        console.print("[yellow]No projects found in apps/ directory.[/yellow]")
        return
        
    choices = [f.name for f in json_files]
    selected_filename = questionary.select(
        "Select project to edit:",
        choices=choices
    ).ask()
    
    if not selected_filename:
        return
        
    filepath = APPS_DIR / selected_filename
    with open(filepath, "r") as f:
        current_data = json.load(f)
        
    console.print(f"Editing: [bold]{current_data.get('name', selected_filename)}[/bold]")
    
    new_data = prompt_project_info(current_data)
    if not new_data:
        console.print("[yellow]Cancelled.[/yellow]")
        return
        
    with open(filepath, "w") as f:
        json.dump(new_data, f, indent=2)
        
    console.print(f"[green]Successfully updated {filepath}[/green]")
    bundle()
    show_deployment_instructions()

if __name__ == "__main__":
    import sys
    # This is fallback if not called via uv scripts
    if len(sys.argv) > 1:
        if sys.argv[1] == "add":
            add_project()
        elif sys.argv[1] == "edit":
            edit_project()
    else:
        edit_project()
