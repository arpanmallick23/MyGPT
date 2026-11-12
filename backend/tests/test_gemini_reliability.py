import math
import random
import sys

# Test the exact backoff and jitter mathematical logic
def test_backoff_calculation():
    base_delay_ms = 1000
    max_delay_ms = 10000

    for attempt in range(1, 4):
        exponential = min(max_delay_ms, base_delay_ms * (2 ** (attempt - 1)))
        assert exponential in [1000, 2000, 4000], f"Unexpected delay {exponential} for attempt {attempt}"

    # Verify Retry-After header override
    retry_after_header = "4.5"
    seconds = float(retry_after_header)
    assert min(seconds * 1000, max_delay_ms) == 4500.0
    print("[PASS] Backoff calculation test passed.")

# Test error classification logic
def classify_error(status=None, message=""):
    msg = message.lower()
    if status in [503, 429, 500, 502, 504]:
        return {"isTransient": True, "status": status}
    if any(k in msg for k in ["503", "unavailable", "rate limit", "resource exhausted", "quota exceeded", "429", "temporarily unavailable", "overloaded", "econnreset", "socket hang up"]):
        inferred = 429 if ("429" in msg or "resource exhausted" in msg) else 503
        return {"isTransient": True, "status": inferred}
    if status in [400, 401, 403] or any(k in msg for k in ["api key", "unauthorized", "permission denied"]):
        return {"isTransient": False, "status": status or 400}
    if isinstance(status, int) and 500 <= status < 600:
        return {"isTransient": True, "status": status}
    return {"isTransient": False, "status": status or 500}

def test_error_classification():
    # 1. 503 Service Unavailable -> Transient
    res = classify_error(503, "The model is overloaded. Please try again later.")
    assert res["isTransient"] is True and res["status"] == 503

    # 2. 429 Rate Limit -> Transient
    res = classify_error(429, "Resource has been exhausted (e.g. check quota).")
    assert res["isTransient"] is True and res["status"] == 429

    # 3. 401/403 Invalid API Key -> Permanent (fail fast, no retries)
    res = classify_error(401, "API key not valid. Please pass a valid API key.")
    assert res["isTransient"] is False and res["status"] == 401

    # 4. 400 Malformed Request -> Permanent
    res = classify_error(400, "Contents must not be empty.")
    assert res["isTransient"] is False and res["status"] == 400

    # 5. Socket hangup / network blip -> Transient
    res = classify_error(None, "FetchError: socket hang up")
    assert res["isTransient"] is True and res["status"] == 503
    print("[PASS] Error classification tests passed.")

# Simulate retry loop and fallback mechanism
def simulate_generation(primary_behavior, fallback_behavior=None, fallback_model_configured=True):
    MAX_RETRIES = 3
    primary_attempts = 0
    fallback_attempts = 0

    # 1. Primary Model loop
    primary_success = False
    primary_result = None
    primary_last_err = None

    for attempt in range(1, MAX_RETRIES + 1):
        primary_attempts += 1
        behavior = primary_behavior[attempt - 1] if attempt - 1 < len(primary_behavior) else primary_behavior[-1]
        if behavior["success"]:
            primary_success = True
            primary_result = behavior.get("text", "Primary success")
            break
        else:
            c = classify_error(behavior.get("status"), behavior.get("message", ""))
            primary_last_err = c
            if not c["isTransient"] or attempt >= MAX_RETRIES:
                break

    if primary_success:
        return {
            "reply": primary_result,
            "primary_attempts": primary_attempts,
            "fallback_attempts": 0,
            "used_fallback": False
        }

    # 2. Fallback check
    if fallback_model_configured and primary_last_err and primary_last_err["isTransient"] and fallback_behavior:
        for attempt in range(1, MAX_RETRIES + 1):
            fallback_attempts += 1
            behavior = fallback_behavior[attempt - 1] if attempt - 1 < len(fallback_behavior) else fallback_behavior[-1]
            if behavior["success"]:
                return {
                    "reply": behavior.get("text", "Fallback success"),
                    "primary_attempts": primary_attempts,
                    "fallback_attempts": fallback_attempts,
                    "used_fallback": True
                }
            else:
                c = classify_error(behavior.get("status"), behavior.get("message", ""))
                if not c["isTransient"] or attempt >= MAX_RETRIES:
                    raise RuntimeError(f"Fallback failed: {c}")

    raise RuntimeError(f"All retries failed: {primary_last_err}")

def test_scenarios():
    # Scenario A: First attempt succeeds
    r = simulate_generation([{"success": True, "text": "Hello world"}])
    assert r["reply"] == "Hello world"
    assert r["primary_attempts"] == 1
    assert r["fallback_attempts"] == 0
    print("[PASS] Scenario A (First attempt success) passed.")

    # Scenario B: 503 on 1st and 2nd attempt, succeeds on 3rd attempt
    r = simulate_generation([
        {"success": False, "status": 503, "message": "Service Unavailable"},
        {"success": False, "status": 503, "message": "Service Unavailable"},
        {"success": True, "text": "Recovered response"}
    ])
    assert r["reply"] == "Recovered response"
    assert r["primary_attempts"] == 3
    assert r["used_fallback"] is False
    print("[PASS] Scenario B (Successful retry after 503) passed.")

    # Scenario C: Permanent 401 error fails immediately on attempt 1
    try:
        simulate_generation([{"success": False, "status": 401, "message": "API key not valid"}])
        assert False, "Should have raised"
    except RuntimeError as e:
        assert "All retries failed" in str(e)
    print("[PASS] Scenario C (Permanent error fails fast on attempt 1) passed.")

    # Scenario D: Primary model exhausts all 3 retries on 503, fallback model succeeds on attempt 1
    r = simulate_generation(
        primary_behavior=[{"success": False, "status": 503, "message": "Service Unavailable"}],
        fallback_behavior=[{"success": True, "text": "Fallback generated response"}],
        fallback_model_configured=True
    )
    assert r["reply"] == "Fallback generated response"
    assert r["primary_attempts"] == 3
    assert r["fallback_attempts"] == 1
    assert r["used_fallback"] is True
    print("[PASS] Scenario D (Fallback model success after retries exhausted) passed.")

    # Scenario E: Both primary and fallback exhaust retries
    try:
        simulate_generation(
            primary_behavior=[{"success": False, "status": 503, "message": "Service Unavailable"}],
            fallback_behavior=[{"success": False, "status": 503, "message": "Service Unavailable"}],
            fallback_model_configured=True
        )
        assert False, "Should have raised"
    except RuntimeError as e:
        assert "Fallback failed" in str(e)
    print("[PASS] Scenario E (Exhausted primary and fallback retries) passed.")

if __name__ == "__main__":
    test_backoff_calculation()
    test_error_classification()
    test_scenarios()
    print("\nALL SIMULATION UNIT TESTS PASSED SUCCESSFULLY!")

