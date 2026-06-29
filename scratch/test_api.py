import asyncio
import json
import urllib.request
import urllib.error
import websockets

BACKEND_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000"
TEST_REPO = "https://github.com/Brijesh-BM/RepoSage"

async def test_flow():
    print("--- 1. Testing POST /v1/jobs ---")
    payload = {
        "repo_url": TEST_REPO,
        "github_token": None
    }
    req_data = json.dumps(payload).encode("utf-8")
    
    req = urllib.request.Request(
        f"{BACKEND_URL}/v1/jobs",
        data=req_data,
        headers={"Content-Type": "application/json"}
    )
    
    try:
        with urllib.request.urlopen(req) as res:
            resp_body = res.read().decode("utf-8")
            job_data = json.loads(resp_body)
            print("Response:", json.dumps(job_data, indent=2))
            job_id = job_data.get("id")
            assert job_id is not None, "No job ID returned"
            assert job_data.get("status") == "pending", "Initial job status should be pending"
            print(f"[OK] Job created successfully. Job ID: {job_id}")
    except urllib.error.HTTPError as e:
        print(f"Failed to create job: {e.code} - {e.read().decode('utf-8')}")
        return
    except Exception as e:
        print(f"Error: {e}")
        return

    print("\n--- 2. Testing WebSocket /v1/ws/{job_id} & Polling GET /v1/jobs/{job_id} ---")
    ws_uri = f"{WS_URL}/v1/ws/{job_id}"
    print(f"Connecting to WebSocket: {ws_uri}")
    
    async def poll_status():
        while True:
            await asyncio.sleep(2.0)
            try:
                with urllib.request.urlopen(f"{BACKEND_URL}/v1/jobs/{job_id}") as poll_res:
                    poll_data = json.loads(poll_res.read().decode("utf-8"))
                    print(f"[POLL] Job Status: {poll_data.get('status')}")
                    if poll_data.get("status") in ["done", "failed"]:
                        break
            except Exception as e:
                print(f"[POLL ERROR] {e}")
                break

    poll_task = asyncio.create_task(poll_status())

    try:
        async with websockets.connect(ws_uri) as ws:
            while True:
                msg_raw = await ws.recv()
                msg = json.loads(msg_raw)
                if msg.get("type") == "ping":
                    continue
                
                print(f"[WS STEP] Phase: {msg.get('phase')}, Progress: {msg.get('progress')}, Message: {msg.get('message')}")
                
                if msg.get("phase") == "failed" or msg.get("status") == "failed":
                    print("[ERROR] Job failed according to WebSocket stream")
                    break
                    
                if msg.get("phase") == "report" and msg.get("status") == "complete":
                    print("[OK] WebSocket finished successfully")
                    break
    except websockets.exceptions.ConnectionClosedOK:
        print("WebSocket connection closed normally")
    except Exception as e:
        print(f"WebSocket error: {e}")

    await poll_task

    print("\n--- 3. Testing GET /v1/reports/{job_id} ---")
    try:
        with urllib.request.urlopen(f"{BACKEND_URL}/v1/reports/{job_id}") as report_res:
            report_data = json.loads(report_res.read().decode("utf-8"))
            print("[OK] Report loaded successfully!")
            print("Health Score:", report_data.get("health_score"))
            print("Critical Issues Found:", len(report_data.get("critical_issues", [])))
            print("Security Risks Found:", len(report_data.get("security_risks", [])))
    except urllib.error.HTTPError as e:
        print(f"Failed to fetch report: {e.code} - {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"Error fetching report: {e}")

if __name__ == "__main__":
    asyncio.run(test_flow())
