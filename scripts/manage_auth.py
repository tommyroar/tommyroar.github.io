#!/usr/bin/env python3
import subprocess
import os
import signal
import sys
import time
import argparse
from pathlib import Path

# Config
BASE_DIR = Path(__file__).parent.parent.resolve()
LOG_DIR = BASE_DIR / "logs"
AUTH_SERVER = BASE_DIR / "scripts" / "auth_server.js"
PID_FILE = BASE_DIR / "scripts" / "auth_server.pid"
LOG_FILE = LOG_DIR / "auth_server.log"

def start():
    """Starts the auth server as a background process."""
    if is_running():
        print(f"Auth server is already running (PID: {get_pid()})")
        return

    print("Starting Tailscale Auth Server...")
    LOG_DIR.mkdir(exist_ok=True)
    
    # Run in background
    with open(LOG_FILE, "a") as log:
        process = subprocess.Popen(
            ["node", str(AUTH_SERVER)],
            stdout=log,
            stderr=log,
            cwd=str(BASE_DIR),
            start_new_session=True # Decouple from parent
        )
        
    with open(PID_FILE, "w") as f:
        f.write(str(process.pid))
    
    # Brief wait and check if it stayed alive
    time.sleep(1)
    if is_running():
        print(f"Successfully started (PID: {process.pid})")
        print(f"Logs: tail -f {LOG_FILE}")
    else:
        print("Failed to start server. Check logs.")

def stop():
    """Stops the auth server."""
    pid = get_pid()
    if pid:
        print(f"Stopping Auth Server (PID: {pid})...")
        try:
            os.kill(pid, signal.SIGTERM)
            # Wait for it to shut down
            for _ in range(5):
                if not is_running():
                    break
                time.sleep(0.5)
            
            if is_running():
                print("Force killing...")
                os.kill(pid, signal.SIGKILL)
                
            if PID_FILE.exists():
                PID_FILE.unlink()
            print("Server stopped.")
        except ProcessLookupError:
            print("Process not found. Cleaning up PID file.")
            if PID_FILE.exists():
                PID_FILE.unlink()
    else:
        print("Auth server is not running.")

def get_pid():
    """Returns the PID from the pid file if it exists."""
    if PID_FILE.exists():
        try:
            return int(PID_FILE.read_text().strip())
        except ValueError:
            return None
    return None

def is_running():
    """Checks if the process is actually running."""
    pid = get_pid()
    if pid:
        try:
            # Signal 0 checks if process exists without sending a signal
            os.kill(pid, 0)
            return True
        except ProcessLookupError:
            return False
    return False

def status():
    """Prints the current status of the auth server."""
    pid = get_pid()
    if is_running():
        print(f"STATUS: RUNNING (PID: {pid})")
        print(f"LOGS: {LOG_FILE}")
        # Show last 3 lines of logs
        if LOG_FILE.exists():
            print("
Last 3 log entries:")
            subprocess.run(["tail", "-n", "3", str(LOG_FILE)])
    else:
        print("STATUS: NOT RUNNING")

def main():
    parser = argparse.ArgumentParser(description="Manage the Tailscale Auth Server")
    parser.add_argument("command", choices=["start", "stop", "restart", "status", "logs"], help="Action to perform")
    
    args = parser.parse_args()
    
    if args.command == "start":
        start()
    elif args.command == "stop":
        stop()
    elif args.command == "restart":
        stop()
        start()
    elif args.command == "status":
        status()
    elif args.command == "logs":
        if LOG_FILE.exists():
            subprocess.run(["tail", "-f", str(LOG_FILE)])
        else:
            print("Log file not found.")

if __name__ == "__main__":
    main()
