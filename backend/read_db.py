import sqlite3
import os

def dump_db():
    db_paths = [
        "reposage.db",
        "backend/reposage.db",
        "../reposage.db",
        "./reposage.db"
    ]
    
    found_db = None
    for p in db_paths:
        if os.path.exists(p):
            found_db = p
            break
            
    if not found_db:
        print("Could not find reposage.db in common paths.")
        # List files in current directory to help locate
        print("Files in CWD:", os.listdir('.'))
        if os.path.exists('backend'):
            print("Files in backend:", os.listdir('backend'))
        return
        
    print(f"Reading database: {os.path.abspath(found_db)}")
    conn = sqlite3.connect(found_db)
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print("Tables in database:", [t[0] for t in tables])
        
        # 1. Fetch most recent jobs
        print("\n=== RECENT JOBS ===")
        cursor.execute("SELECT id, repo_url, status, created_at FROM jobs ORDER BY created_at DESC LIMIT 5;")
        jobs = cursor.fetchall()
        for j in jobs:
            print(f"Job ID: {j[0]} | Repo: {j[1]} | Status: {j[2]} | Created At: {j[3]}")
            
            # 2. Fetch steps for this job
            print(f"--- Steps for Job {j[0]} ---")
            cursor.execute(
                "SELECT phase, message, status, progress, created_at FROM agent_steps WHERE job_id = ? ORDER BY id ASC;",
                (j[0],)
            )
            steps = cursor.fetchall()
            for s in steps:
                print(f"  [{s[4]}] Phase: {s[0]} | Msg: {s[1]} | Status: {s[2]} | Prog: {s[3]}")
            print()
            
    except Exception as e:
        print("Error reading SQLite database:", e)
    finally:
        conn.close()

if __name__ == "__main__":
    dump_db()
