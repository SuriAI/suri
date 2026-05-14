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
    memory = TrackLivenessMemory(required_real_frames=2)
    now = 1000.0

    first = memory.stabilize(
        1, _liveness("real", True), frame_number=1, namespace="cam", current_time=now
    )
    second = memory.stabilize(
        1,
        _liveness("real", True),
        frame_number=2,
        namespace="cam",
        current_time=now + 0.1,
    )

    assert first["status"] == "candidate_real"
    assert first["is_real"] is False
    assert second["status"] == "real"
    assert second["is_real"] is True


def test_track_liveness_memory_keeps_locked_real_despite_spoof_until_gap_reset():
    memory = TrackLivenessMemory(required_real_frames=1, reset_after_gap_seconds=0.5)
    now = 1000.0

    # Initial stabilization
    stabilized = memory.stabilize(
        7, _liveness("real", True), frame_number=1, namespace="cam", current_time=now
    )
    assert stabilized["status"] == "real"

    # Spoof frame shortly after (should stay real because of stabilization lock)
    spoof_frame = memory.stabilize(
        7,
        _liveness("spoof", False),
        frame_number=2,
        namespace="cam",
        current_time=now + 0.2,
    )

    assert spoof_frame["status"] == "real"
    assert spoof_frame["is_real"] is True

    # Gap of 0.6s (more than 0.5s reset)
    after_gap = memory.stabilize(
        7,
        _liveness("spoof", False),
        frame_number=3,
        namespace="cam",
        current_time=now + 0.9,
    )
    assert after_gap["status"] == "spoof"
    assert after_gap["is_real"] is False


def test_track_liveness_memory_is_isolated_per_namespace():
    memory = TrackLivenessMemory(required_real_frames=2)
    now = 1000.0

    # Cam A stabilizes
    memory.stabilize(
        3, _liveness("real", True), frame_number=1, namespace="cam-a", current_time=now
    )
    cam_a_result = memory.stabilize(
        3,
        _liveness("real", True),
        frame_number=2,
        namespace="cam-a",
        current_time=now + 0.1,
    )

    # Cam B starts fresh
    cam_b_first = memory.stabilize(
        3,
        _liveness("real", True),
        frame_number=3,
        namespace="cam-b",
        current_time=now + 0.2,
    )

    assert cam_a_result["status"] == "real"
    assert cam_a_result["is_real"] is True
    assert cam_b_first["status"] == "candidate_real"
    assert cam_b_first["is_real"] is False
