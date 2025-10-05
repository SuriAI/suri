import logging
import time
from collections import deque
from typing import Dict, Optional, Tuple

import cv2
import numpy as np

logger = logging.getLogger(__name__)


class TemporalConsistencyAnalyzer:

    def __init__(
        self,
        history_size: int = 5,
        score_variance_threshold: float = 0.03,
        correlation_threshold: float = 0.97,
        micro_movement_threshold: float = 0.001,
        history_timeout: float = 1.0
    ):
        """
        Args:
            history_size: Number of frames to track (5 = 166ms at 30fps)
            score_variance_threshold: Min variance for real faces (0.03 optimal)
            correlation_threshold: Max correlation for real faces (0.97 optimal)
            micro_movement_threshold: Min movement for real faces (0.001 optimal)
            history_timeout: Max age of history entries (1.0 second)
        """
        self.history_size = history_size
        self.score_variance_threshold = score_variance_threshold
        self.correlation_threshold = correlation_threshold
        self.micro_movement_threshold = micro_movement_threshold
        self.history_timeout = history_timeout
        
        # Track histories per face (by track_id)
        self.score_history: Dict[int, deque] = {}
        self.texture_history: Dict[int, deque] = {}
        self.timestamp_history: Dict[int, deque] = {}
        
        logger.info(
            f"TemporalConsistencyAnalyzer initialized with RANK 1 thresholds: "
            f"variance={score_variance_threshold}, correlation={correlation_threshold}, "
            f"micro_movement={micro_movement_threshold}, history_size={history_size}"
        )
    
    def update_history(
        self,
        track_id: int,
        real_score: float,
        fake_score: float,
        texture_features: Optional[np.ndarray] = None
    ):
        """
        Update temporal history for a tracked face.
        
        Args:
            track_id: SORT tracker ID
            real_score: Current frame's real score
            fake_score: Current frame's fake score
            texture_features: Optional texture features for correlation analysis
        """
        current_time = time.time()
        
        # Initialize history for new track
        if track_id not in self.score_history:
            self.score_history[track_id] = deque(maxlen=self.history_size)
            self.texture_history[track_id] = deque(maxlen=self.history_size)
            self.timestamp_history[track_id] = deque(maxlen=self.history_size)
        
        # Clean old entries (older than timeout)
        self._clean_old_entries(track_id, current_time)
        
        # Add new entry
        self.score_history[track_id].append({
            "real_score": real_score,
            "fake_score": fake_score
        })
        self.timestamp_history[track_id].append(current_time)
        
        if texture_features is not None:
            self.texture_history[track_id].append(texture_features)
    
    def _clean_old_entries(self, track_id: int, current_time: float):
        """Remove entries older than timeout"""
        if track_id not in self.timestamp_history:
            return
        
        timestamps = self.timestamp_history[track_id]
        while timestamps and (current_time - timestamps[0]) > self.history_timeout:
            timestamps.popleft()
            if track_id in self.score_history and self.score_history[track_id]:
                self.score_history[track_id].popleft()
            if track_id in self.texture_history and self.texture_history[track_id]:
                self.texture_history[track_id].popleft()
    
    def analyze_temporal_pattern(
        self,
        track_id: int,
        current_real_score: float,
        current_fake_score: float
    ) -> Tuple[str, float, Dict]:
        """
        Analyze temporal patterns to detect spoofs.
        
        STRATEGY 1: Score Variance Analysis
        - Real faces: Scores vary naturally (variance > 0.03)
        - Spoofs: Suspiciously consistent scores (variance < 0.02)
        
        STRATEGY 2: Texture Correlation Analysis
        - Real faces: Texture changes frame-to-frame (correlation < 0.97)
        - Spoofs: Static texture (correlation > 0.97)
        
        STRATEGY 3: Micro-Movement Detection
        - Real faces: Subtle movements visible (std > 0.001)
        - Spoofs: Frozen/mechanical (std < 0.001)
        
        Args:
            track_id: SORT tracker ID
            current_real_score: Current frame's real score
            current_fake_score: Current frame's fake score
            
        Returns:
            Tuple of (verdict, confidence, analysis_details)
            - verdict: "REAL", "SPOOF", or "UNCERTAIN"
            - confidence: Confidence in verdict [0.0, 1.0]
            - analysis_details: Dict with detailed analysis
        """
        # Not enough history yet
        if track_id not in self.score_history or len(self.score_history[track_id]) < 3:
            return "UNCERTAIN", 0.5, {"reason": "insufficient_history"}
        
        score_history = self.score_history[track_id]
        texture_history = self.texture_history.get(track_id, deque())
        
        analysis = {}
        spoof_indicators = []
        real_indicators = []
        
        # STRATEGY 1: Score Variance Analysis
        real_scores = [entry["real_score"] for entry in score_history]
        fake_scores = [entry["fake_score"] for entry in score_history]
        
        real_variance = np.var(real_scores)
        fake_variance = np.var(fake_scores)
        mean_real_score = np.mean(real_scores)
        mean_fake_score = np.mean(fake_scores)
        
        analysis["real_variance"] = float(real_variance)
        analysis["fake_variance"] = float(fake_variance)
        analysis["mean_real_score"] = float(mean_real_score)
        analysis["mean_fake_score"] = float(mean_fake_score)
        
        # Suspiciously low variance with high mean score = likely static photo
        if real_variance < self.score_variance_threshold * 0.5 and mean_real_score > 0.6:
            spoof_indicators.append({
                "type": "static_scores",
                "confidence": 0.95,
                "reason": f"Score variance too low ({real_variance:.4f}), suspicious consistency"
            })
        elif real_variance < self.score_variance_threshold and mean_real_score > 0.7:
            spoof_indicators.append({
                "type": "low_variance",
                "confidence": 0.85,
                "reason": f"Low score variance ({real_variance:.4f}), possible static image"
            })
        
        # Natural variance = real face indicator
        if real_variance > self.score_variance_threshold * 1.5:
            real_indicators.append({
                "type": "natural_variance",
                "confidence": 0.80,
                "reason": f"Natural score variation ({real_variance:.4f})"
            })
        
        # STRATEGY 2: Texture Correlation Analysis
        if len(texture_history) >= 3:
            correlations = []
            texture_list = list(texture_history)
            
            for i in range(len(texture_list) - 1):
                try:
                    corr = np.corrcoef(
                        texture_list[i].flatten(),
                        texture_list[i + 1].flatten()
                    )[0, 1]
                    correlations.append(corr)
                except:
                    pass
            
            if correlations:
                mean_correlation = np.mean(correlations)
                analysis["texture_correlation"] = float(mean_correlation)
                
                # Very high correlation = static image
                if mean_correlation > self.correlation_threshold:
                    spoof_indicators.append({
                        "type": "static_texture",
                        "confidence": 0.92,
                        "reason": f"Static texture pattern ({mean_correlation:.4f})"
                    })
                elif mean_correlation > self.correlation_threshold * 0.95:
                    spoof_indicators.append({
                        "type": "high_correlation",
                        "confidence": 0.80,
                        "reason": f"High texture correlation ({mean_correlation:.4f})"
                    })
                
                # Natural texture changes = real face
                if mean_correlation < 0.90:
                    real_indicators.append({
                        "type": "dynamic_texture",
                        "confidence": 0.75,
                        "reason": f"Dynamic texture changes ({mean_correlation:.4f})"
                    })
        
        # STRATEGY 3: Micro-Movement Detection
        if len(real_scores) >= 4:
            # Compute frame-to-frame differences
            score_diffs = np.diff(real_scores)
            movement_std = np.std(score_diffs)
            
            analysis["micro_movement_std"] = float(movement_std)
            
            # No micro-movements = frozen/static
            if movement_std < self.micro_movement_threshold:
                spoof_indicators.append({
                    "type": "no_micro_movement",
                    "confidence": 0.88,
                    "reason": f"No micro-movements detected ({movement_std:.6f})"
                })
            
            # Natural micro-movements = real face
            if movement_std > self.micro_movement_threshold * 3:
                real_indicators.append({
                    "type": "natural_movement",
                    "confidence": 0.70,
                    "reason": f"Natural micro-movements ({movement_std:.6f})"
                })
        
        # STRATEGY 4: Pattern Repetition Detection (for video replays)
        if len(real_scores) >= 5:
            # Detect periodic patterns (video loops)
            periodicity = self._detect_periodicity(real_scores)
            analysis["periodicity"] = float(periodicity)
            
            if periodicity > 0.8:
                spoof_indicators.append({
                    "type": "video_loop",
                    "confidence": 0.90,
                    "reason": f"Periodic pattern detected ({periodicity:.3f}), likely video replay"
                })
        
        # DECISION LOGIC: Aggregate indicators
        analysis["spoof_indicators"] = spoof_indicators
        analysis["real_indicators"] = real_indicators
        
        # Calculate aggregate confidence
        spoof_confidence = 0.0
        if spoof_indicators:
            spoof_confidence = max(ind["confidence"] for ind in spoof_indicators)
        
        real_confidence = 0.0
        if real_indicators:
            real_confidence = max(ind["confidence"] for ind in real_indicators)
        
        # Make decision
        if spoof_confidence > real_confidence and spoof_confidence > 0.80:
            verdict = "SPOOF"
            confidence = spoof_confidence
            analysis["decision_reason"] = spoof_indicators[0]["reason"]
        elif real_confidence > spoof_confidence and real_confidence > 0.70:
            verdict = "REAL"
            confidence = real_confidence
            analysis["decision_reason"] = real_indicators[0]["reason"]
        else:
            verdict = "UNCERTAIN"
            confidence = 0.5
            analysis["decision_reason"] = "Insufficient evidence for clear decision"
        
        return verdict, confidence, analysis
    
    def _detect_periodicity(self, scores: list) -> float:
        """
        Detect periodic patterns in scores (video replay detection).
        
        Uses autocorrelation to detect repeating patterns.
        
        Returns:
            Periodicity score [0.0, 1.0] where higher = more periodic
        """
        try:
            if len(scores) < 5:
                return 0.0
            
            scores_array = np.array(scores)
            
            # Normalize scores
            scores_norm = (scores_array - np.mean(scores_array)) / (np.std(scores_array) + 1e-6)
            
            # Compute autocorrelation
            autocorr = np.correlate(scores_norm, scores_norm, mode='full')
            autocorr = autocorr[len(autocorr) // 2:]  # Keep only positive lags
            autocorr = autocorr / autocorr[0]  # Normalize
            
            # Look for peaks in autocorrelation (excluding lag 0)
            if len(autocorr) > 2:
                max_autocorr = np.max(autocorr[1:])  # Max excluding lag 0
                return float(max_autocorr)
            
            return 0.0
            
        except Exception as e:
            logger.debug(f"Periodicity detection failed: {e}")
            return 0.0
    
    def get_track_stability(self, track_id: int) -> float:
        """
        Get tracking stability score for a face.
        
        Longer tracking history = more stable = higher confidence in analysis.
        
        Args:
            track_id: SORT tracker ID
            
        Returns:
            Stability score [0.0, 1.0]
        """
        if track_id not in self.score_history:
            return 0.0
        
        history_length = len(self.score_history[track_id])
        
        # Normalize to [0, 1] where history_size = 1.0
        stability = min(1.0, history_length / self.history_size)
        
        return float(stability)
    
    def extract_texture_features(self, face_crop: np.ndarray) -> np.ndarray:
        """
        Extract lightweight texture features for correlation analysis.
        
        Uses downsampled grayscale image for fast correlation computation.
        
        Args:
            face_crop: Face crop image (BGR)
            
        Returns:
            Texture feature vector (flattened grayscale image)
        """
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
            
            # Downsample for speed (16x16 = 256 features)
            downsampled = cv2.resize(gray, (16, 16), interpolation=cv2.INTER_AREA)
            
            # Normalize to [0, 1]
            normalized = downsampled.astype(np.float32) / 255.0
            
            # Flatten to 1D vector
            features = normalized.flatten()
            
            return features
            
        except Exception as e:
            logger.error(f"Texture feature extraction failed: {e}")
            # Return zero vector on error
            return np.zeros(256, dtype=np.float32)
    
    def clear_track(self, track_id: int):
        """Clear history for a specific track (when track is lost)"""
        if track_id in self.score_history:
            del self.score_history[track_id]
        if track_id in self.texture_history:
            del self.texture_history[track_id]
        if track_id in self.timestamp_history:
            del self.timestamp_history[track_id]
    
    def clear_all(self):
        """Clear all tracking history"""
        self.score_history.clear()
        self.texture_history.clear()
        self.timestamp_history.clear()
