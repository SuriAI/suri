import time
from core.models.liveness_detector.track_memory import TrackLivenessMemory


def _liveness(status: str, is_real: bool) -> dict:
    return {
        "status": status,
        "is_real": is_real,
        "confidence": 1.0,
        "logit_diff": 1.0 if is_real else -1.0,
        "real_logit": 1.0 if is_real else -1.0,
        "spoof_logit": -1.0 if is_real else 1.0,
    }


def test_track_liveness_memory_requires_recent_real_evidence_before_passing():
    memory = TrackLivenessMemory(stable_duration=0.5)
    now = time.time()

    first = memory.stabilize(
        1, _liveness("real", True), timestamp=now, namespace="cam"
    )
    # 0.6s later (more than 0.5s)
    second = memory.stabilize(
        1, _liveness("real", True), timestamp=now + 0.6, namespace="cam"
    )

    assert first["status"] == "candidate_real"
    assert first["is_real"] is False
    assert second["status"] == "real"
    assert second["is_real"] is True


def test_track_liveness_memory_keeps_locked_real_despite_spoof_until_gap_reset():
    memory = TrackLivenessMemory(stable_duration=0.5)
    now = time.time()

    # Initial stabilization
    memory.stabilize(7, _liveness("real", True), timestamp=now, namespace="cam")
    stabilized = memory.stabilize(7, _liveness("real", True), timestamp=now + 0.6, namespace="cam")

    assert stabilized["status"] == "real"
    assert stabilized["is_real"] is True

    # Spoof frame shortly after (should stay real because of stabilization lock)
    spoof_frame = memory.stabilize(
        7, _liveness("spoof", False), timestamp=now + 0.7, namespace="cam"
    )

    assert spoof_frame["status"] == "real"
    assert spoof_frame["is_real"] is True


def test_track_liveness_memory_is_isolated_per_namespace():
    memory = TrackLivenessMemory(stable_duration=0.5)
    now = time.time()

    # Cam A stabilizes
    memory.stabilize(3, _liveness("real", True), timestamp=now, namespace="cam-a")
    cam_a_result = memory.stabilize(3, _liveness("real", True), timestamp=now + 0.6, namespace="cam-a")

    # Cam B starts fresh
    cam_b_first = memory.stabilize(
        3, _liveness("real", True), timestamp=now + 0.7, namespace="cam-b"
    )

    assert cam_a_result["status"] == "real"
    assert cam_a_result["is_real"] is True
    assert cam_b_first["status"] == "candidate_real"
    assert cam_b_first["is_real"] is False


def test_track_liveness_memory_resets_stable_state_after_long_gap():
    memory = TrackLivenessMemory(stable_duration=0.5)
    now = time.time()

    memory.stabilize(10, _liveness("real", True), timestamp=now, namespace="cam")
    memory.stabilize(10, _liveness("real", True), timestamp=now + 0.6, namespace="cam")

    # Gap of 10 seconds (default gap reset is 2s)
    after_gap = memory.stabilize(
        10, _liveness("real", True), timestamp=now + 10.6, namespace="cam"
    )
    
    assert after_gap["status"] == "candidate_real"
    assert after_gap["is_real"] is False
