import json
import os
import subprocess
import datetime
import shutil
from pathlib import Path
from slugify import slugify
import questionary
from rich.console import Console
import segno

console = Console()

APPS_DIR = Path("apps")
PUBLIC_THUMBNAILS_DIR = Path("public/thumbnails")
OUTPUT_FILE = Path("src/data/projects.json")
BASE_URL = "https://tommyroar.github.io"

if not PUBLIC_THUMBNAILS_DIR.exists():
    PUBLIC_THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)

if not OUTPUT_FILE.parent.exists():
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

def generate_qr_code(url_path, slug):
    """Generate a QR code for the project URL."""
    url = f"{BASE_URL}{url_path}"
    qr_filename = f"{slug}_qr.png"
    qr_path = PUBLIC_THUMBNAILS_DIR / qr_filename
    
    console.print(f"[yellow]Generating QR code for {url}...[/yellow]")
    qr = segno.make(url)
    
    # Display in terminal
    console.print("\n[bold]QR Code for this project:[/bold]")
    qr.terminal(border=1)
    console.print("\n")
    
    qr.save(qr_path, scale=10)
    console.print(f"[green]QR code saved to {qr_path}[/green]")
    return f"/thumbnails/{qr_filename}"

def run_command(cmd, description):
    """Utility to run shell commands and show output."""
    console.print(f"[yellow]{description}...[/yellow]")
    result = subprocess.run(cmd, capture_output=True, text=True, shell=isinstance(cmd, str))
    if result.returncode == 0:
        if result.stdout.strip():
            console.print(f"[dim]{result.stdout.strip()}[/dim]")
        return True
    else:
        console.print(f"[red]Error: {result.stderr}[/red]")
        return False

def bundle():
    """Native Python implementation of the project bundling logic."""
    console.print("[yellow]Bundling projects (Python)...[/yellow]")
    projects = []
    
    if not APPS_DIR.exists():
        console.print("[red]Apps directory not found![/red]")
        return False

    # Get all project files
    json_files = list(APPS_DIR.glob("*.json"))
    
    for json_file in json_files:
        try:
            with open(json_file, "r") as f:
                data = json.load(f)
            
            slug = json_file.stem
            
            # Check for matching png thumbnail
            thumb_file = APPS_DIR / f"{slug}.png"
            if thumb_file.exists():
                shutil.copy2(thumb_file, PUBLIC_THUMBNAILS_DIR / f"{slug}.png")
                data["thumbnail"] = f"/thumbnails/{slug}.png"
            
            projects.append(data)
        except Exception as e:
            console.print(f"[red]Error processing {json_file.name}: {e}[/red]")

    # Sort projects by name
    projects.sort(key=lambda x: x.get("name", "").lower())

    # Write final output
    try:
        with open(OUTPUT_FILE, "w") as f:
            json.dump(projects, f, indent=2)
        console.print(f"[green]Successfully bundled {len(projects)} projects to {OUTPUT_FILE}[/green]")
        return True
    except Exception as e:
        console.print(f"[red]Failed to write {OUTPUT_FILE}: {e}[/red]")
        return False

def handle_git_workflow(action, project_name):
    """Automates branch creation, commit, and push."""
    if not questionary.confirm("Do you want to create a branch and push these changes to GitHub?").ask():
        show_manual_instructions()
        return

    timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M")
    branch_name = f"{action.lower()}-{slugify(project_name)}-{timestamp}"
    commit_message = f"{action.capitalize()} project: {project_name}"
    
    if not run_command(["git", "checkout", "-b", branch_name], f"Creating branch {branch_name}"): return
    if not run_command(["git", "add", "."], "Staging changes"): return
    if not run_command(["git", "commit", "-m", commit_message], f"Committing: {commit_message}"): return
    if not run_command(["git", "push", "-u", "origin", branch_name], "Pushing to GitHub"): return

    console.print("\n[bold green]Success! Branch pushed to GitHub.[/bold green]")
    # Use the /compare/branch-name?expand=1 format which GitHub handles better for direct PR creation
    pr_url = f"https://github.com/tommyroar/tommyroar.github.io/compare/{branch_name}?expand=1"
    console.print(f"[bold]Create your Pull Request here:[/bold]\n[blue]{pr_url}[/blue]")
    console.print("\n[italic]Once merged to main, the site will redeploy automatically.[/italic]")

def show_manual_instructions():
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
    
    if name is None: return None # Handle Ctrl+C
    if not name: return None
        
    slug = slugify(name)
    
    root_path = questionary.text(
        "URL Path (e.g., /maps/):",
        default=defaults.get("root_path", f"/{slug}/")
    ).ask()
    if root_path is None: return None
    
    link_label = questionary.text(
        "Link Label (e.g., Live SPA, Open App):",
        default=defaults.get("link_label", "Live SPA")
    ).ask()
    if link_label is None: return None

    docs_path = questionary.text(
        "Docs Path (e.g., /maps/docs/ - Leave empty to remove link):",
        default=defaults.get("docs_path", f"{root_path.rstrip('/')}/docs/")
    ).ask()
    if docs_path is None: return None
    
    is_multiline = questionary.confirm("Do you want to enter a multiline description?", default=False).ask()
    if is_multiline is None: return None

    description = questionary.text(
        "Description (Markdown supported):",
        default=defaults.get("description", ""),
        multiline=is_multiline
    ).ask()
    if description is None: return None
    
    status = questionary.select(
        "Status:",
        choices=["Active", "Beta", "Archived", "Planning"],
        default=defaults.get("status", "Active")
    ).ask()
    if status is None: return None
    
    tags_str = questionary.text(
        "Tags (comma separated):",
        default=", ".join(defaults.get("tags", []))
    ).ask()
    if tags_str is None: return None
    
    tags = [t.strip() for t in tags_str.split(",") if t.strip()]
    
    return {
        "name": name,
        "root_path": root_path,
        "link_label": link_label,
        "docs_path": docs_path,
        "description": description or "",
        "status": status,
        "tags": tags
    }

def add_project():
    """TUI to add a new project."""
    try:
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
                
        # Generate QR Code
        data["qr_code"] = generate_qr_code(data["root_path"], slug)
                
        with open(filename, "w") as f:
            json.dump(data, f, indent=2)
            
        console.print(f"[green]Successfully created {filename}[/green]")
        if bundle():
            handle_git_workflow("add", data["name"])
    except KeyboardInterrupt:
        console.print("\n[yellow]Operation cancelled by user.[/yellow]")

def edit_project():
    """TUI to edit an existing project."""
    try:
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
            
        # Generate/Update QR Code
        slug = slugify(new_data["name"])
        new_data["qr_code"] = generate_qr_code(new_data["root_path"], slug)
            
        with open(filepath, "w") as f:
            json.dump(new_data, f, indent=2)
            
        console.print(f"[green]Successfully updated {filepath}[/green]")
        if bundle():
            handle_git_workflow("update", new_data["name"])
    except KeyboardInterrupt:
        console.print("\n[yellow]Operation cancelled by user.[/yellow]")

def remove_project():
    """TUI to remove an existing project."""
    try:
        console.print("[bold red]Remove Project[/bold red]")
        
        if not APPS_DIR.exists():
            console.print("[red]Apps directory not found![/red]")
            return
            
        json_files = sorted(list(APPS_DIR.glob("*.json")))
        if not json_files:
            console.print("[yellow]No projects found in apps/ directory.[/yellow]")
            return
            
        choices = [f.name for f in json_files]
        selected_filename = questionary.select(
            "Select project to REMOVE:",
            choices=choices
        ).ask()
        
        if not selected_filename:
            return
            
        filepath = APPS_DIR / selected_filename
        with open(filepath, "r") as f:
            current_data = json.load(f)
            
        confirm = questionary.confirm(
            f"Are you SURE you want to permanently remove {current_data.get('name', selected_filename)}?",
            default=False
        ).ask()
        
        if not confirm:
            console.print("[yellow]Cancelled.[/yellow]")
            return
            
        # Delete JSON
        filepath.unlink()
        
        # Delete QR Code if it exists
        slug = Path(selected_filename).stem
        qr_path = PUBLIC_THUMBNAILS_DIR / f"{slug}_qr.png"
        if qr_path.exists():
            qr_path.unlink()
            
        console.print(f"[green]Successfully removed {selected_filename} and its QR code.[/green]")
        
        if bundle():
            handle_git_workflow("remove", current_data.get('name', selected_filename))
    except KeyboardInterrupt:
        console.print("\n[yellow]Operation cancelled by user.[/yellow]")

if __name__ == "__main__":
    import sys
    # This is fallback if not called via uv scripts
    if len(sys.argv) > 1:
        if sys.argv[1] == "add":
            add_project()
        elif sys.argv[1] == "edit":
            edit_project()
        elif sys.argv[1] == "remove":
            remove_project()
        elif sys.argv[1] == "bundle":
            bundle()
    else:
        edit_project()
