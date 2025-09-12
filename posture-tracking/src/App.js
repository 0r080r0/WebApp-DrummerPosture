// App.js

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BarChart3, ChevronRight, MessageCircle, TrendingUp } from 'lucide-react';

const PostureDashboard = ({ score }) => {
  const getScoreColor = () => {
    if (score >= 8) return '#00D4AA';
    if (score >= 5) return '#FFB800';
    return '#FF4444';
  };

  return (
    <div style={{
      backgroundColor: '#1E2329',
      border: '1px solid #30363D',
      padding: '12px',
      borderRadius: '8px',
      textAlign: 'center',
      marginBottom: '10px'
    }}>
      <h2 style={{ 
        color: '#7D8590', 
        margin: '0 0 8px 0', 
        fontSize: '11px',
        fontWeight: '400',
        textTransform: 'uppercase'
      }}>Live Posture Score</h2>
      <div style={{
        fontSize: '2em',
        fontWeight: '300',
        color: getScoreColor(),
        margin: 0
      }}>
        {score.toFixed(1)}<span style={{ fontSize: '0.4em', color: '#7D8590' }}>/10</span>
      </div>
    </div>
  );
};

const SessionDataSidebar = ({ isOpen, sessionData, onToggle, isDetecting }) => {
  const getAverage = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : '0.0';

  return (
    <>
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          right: isOpen ? '280px' : '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1001,
          backgroundColor: '#1F6FEB',
          color: '#FFFFFF',
          border: 'none',
          padding: '10px 6px',
          borderRadius: isOpen ? '6px 0 0 6px' : '6px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: '600',
          fontSize: '11px'
        }}
      >
        {!isOpen && <TrendingUp size={14} />}
        {!isOpen && <span>Session</span>}
        {isOpen && <ChevronRight size={14} />}
      </button>

      <div style={{
        position: 'fixed',
        top: 0,
        right: isOpen ? 0 : '-280px',
        width: '280px',
        height: '100vh',
        backgroundColor: '#1A1D23',
        color: '#E6EDF3',
        transition: 'right 0.3s ease',
        zIndex: 1000,
        padding: '15px',
        boxSizing: 'border-box',
        borderLeft: '1px solid #30363D',
        fontSize: '13px',
        overflowY: 'auto'
      }}>
        <h2 style={{ 
          marginBottom: '15px', 
          color: '#1F6FEB', 
          fontSize: '16px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <TrendingUp size={16} />
          Session Data
        </h2>
        
        <div style={{ marginBottom: '15px' }}>
          <h3 style={{ 
            color: '#1F6FEB', 
            marginBottom: '8px', 
            fontSize: '12px',
            fontWeight: '500',
            textTransform: 'uppercase'
          }}>Session Overview</h3>
          <div style={{ 
            backgroundColor: '#21262D', 
            padding: '12px', 
            borderRadius: '6px', 
            fontSize: '12px',
            border: '1px solid #30363D'
          }}>
            <p style={{ margin: '4px 0', color: '#E6EDF3' }}>
              <strong style={{ color: '#1F6FEB' }}>Duration:</strong> {Math.floor(sessionData.duration / 60)}:{(sessionData.duration % 60).toString().padStart(2, '0')}
            </p>
            <p style={{ margin: '4px 0', color: '#E6EDF3' }}>
              <strong style={{ color: '#1F6FEB' }}>Avg Score:</strong> {getAverage(sessionData.scores)}/10
            </p>
            <p style={{ margin: '4px 0', color: '#E6EDF3' }}>
              <strong style={{ color: '#1F6FEB' }}>Peak:</strong> {sessionData.scores.length ? Math.max(...sessionData.scores).toFixed(1) : '0.0'}/10
            </p>
            <p style={{ margin: '4px 0', color: '#E6EDF3' }}>
              <strong style={{ color: '#1F6FEB' }}>Samples:</strong> {sessionData.scores.length}
            </p>
          </div>
        </div>

        <div>
          <h3 style={{ 
            color: '#1F6FEB', 
            marginBottom: '8px', 
            fontSize: '12px',
            fontWeight: '500',
            textTransform: 'uppercase'
          }}>Score Trend</h3>
          <div style={{ 
            backgroundColor: '#21262D', 
            padding: '12px', 
            borderRadius: '6px',
            border: '1px solid #30363D'
          }}>
            <div style={{ height: '60px', position: 'relative', marginBottom: '6px' }}>
              <svg width="100%" height="100%" viewBox="0 0 240 60">
                {sessionData.scores.length > 1 && sessionData.scores.slice(-30).map((score, i, arr) => {
                  const x = (i / Math.max(1, arr.length - 1)) * 220 + 10;
                  const y = 50 - (score / 10) * 40;
                  const nextScore = arr[i + 1];
                  if (nextScore !== undefined) {
                    const nextX = ((i + 1) / Math.max(1, arr.length - 1)) * 220 + 10;
                    const nextY = 50 - (nextScore / 10) * 40;
                    return (
                      <line
                        key={i}
                        x1={x}
                        y1={y}
                        x2={nextX}
                        y2={nextY}
                        stroke="#1F6FEB"
                        strokeWidth="2"
                      />
                    );
                  }
                  return null;
                })}
                {sessionData.scores.slice(-30).map((score, i, arr) => {
                  const x = (i / Math.max(1, arr.length - 1)) * 220 + 10;
                  const y = 50 - (score / 10) * 40;
                  return (
                    <circle
                      key={`dot-${i}`}
                      cx={x}
                      cy={y}
                      r="2"
                      fill="#1F6FEB"
                    />
                  );
                })}
              </svg>
            </div>
            <p style={{ fontSize: '10px', color: '#7D8590', margin: 0 }}>Last 30 measurements</p>
          </div>
        </div>
      </div>
    </>
  );
};

const AdviceSidebar = ({ isOpen, currentAngles, spineData, onToggle, isDetecting }) => {
  const getAdviceForAngle = (angle, bodyPart, optimalMin, optimalMax) => {
    if (angle < optimalMin) {
      return { status: 'too_closed', advice: `${bodyPart} too closed - open up more`, color: '#FF4444' };
    } else if (angle > optimalMax) {
      return { status: 'too_open', advice: `${bodyPart} too extended - bring closer`, color: '#FF4444' };
    }
    return { status: 'good', advice: `${bodyPart} angle looks good`, color: '#00D4AA' };
  };

  const adviceData = {
    leftElbow: getAdviceForAngle(currentAngles.leftElbow, 'Left elbow', 60, 120),
    rightElbow: getAdviceForAngle(currentAngles.rightElbow, 'Right elbow', 60, 120),
    leftKnee: getAdviceForAngle(currentAngles.leftKnee, 'Left knee', 80, 120),
    rightKnee: getAdviceForAngle(currentAngles.rightKnee, 'Right knee', 80, 120)
  };

  return (
    <>
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          right: isOpen ? '300px' : '10px',
          top: '40%',
          transform: 'translateY(-50%)',
          zIndex: 1001,
          backgroundColor: '#FFB800',
          color: '#0E1116',
          border: 'none',
          padding: '10px 6px',
          borderRadius: isOpen ? '6px 0 0 6px' : '6px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: '600',
          fontSize: '11px'
        }}
      >
        {!isOpen && <MessageCircle size={14} />}
        {!isOpen && <span>Advice</span>}
        {isOpen && <ChevronRight size={14} />}
      </button>

      <div style={{
        position: 'fixed',
        top: 0,
        right: isOpen ? 0 : '-300px',
        width: '300px',
        height: '100vh',
        backgroundColor: '#1A1D23',
        color: '#E6EDF3',
        transition: 'right 0.3s ease',
        zIndex: 999,
        padding: '15px',
        boxSizing: 'border-box',
        borderLeft: '1px solid #30363D',
        fontSize: '13px',
        overflowY: 'auto'
      }}>
        <h2 style={{ 
          marginBottom: '15px', 
          color: '#FFB800', 
          fontSize: '16px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <MessageCircle size={16} />
          Posture Advice
        </h2>
        
        <div style={{ marginBottom: '15px' }}>
          <h3 style={{ 
            color: '#FFB800', 
            marginBottom: '8px', 
            fontSize: '12px',
            fontWeight: '500',
            textTransform: 'uppercase'
          }}>Joint Analysis</h3>
          <div style={{ 
            backgroundColor: '#21262D', 
            padding: '12px', 
            borderRadius: '6px', 
            fontSize: '12px',
            border: '1px solid #30363D'
          }}>
            {Object.entries(adviceData).map(([key, data]) => (
              <div key={key} style={{ marginBottom: '8px', padding: '6px', backgroundColor: '#30363D', borderRadius: '4px' }}>
                <div style={{ color: data.color, fontWeight: '600', marginBottom: '2px' }}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}: {isDetecting ? (currentAngles[key]?.toFixed(0) || '0') : '--'}°
                </div>
                <div style={{ color: '#E6EDF3', fontSize: '11px' }}>
                  {isDetecting ? data.advice : 'Start recording for live analysis'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h3 style={{ 
            color: '#FFB800', 
            marginBottom: '8px', 
            fontSize: '12px',
            fontWeight: '500',
            textTransform: 'uppercase'
          }}>Spine Analysis</h3>
          <div style={{ 
            backgroundColor: '#21262D', 
            padding: '12px', 
            borderRadius: '6px',
            border: '1px solid #30363D'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ 
                color: spineData.lumbar.angle > 15 ? '#FF4444' : '#00D4AA',
                fontSize: '11px',
                marginBottom: '3px',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <strong>Lumbar Curve:</strong> 
                <span>{spineData.lumbar.angle.toFixed(0)}°</span>
              </div>
              <div style={{ fontSize: '10px', color: '#7D8590' }}>
                {spineData.lumbar.angle > 15 ? 'Excessive lumbar curve - sit straighter' : 'Good lumbar position'}
              </div>
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <div style={{ 
                color: spineData.cervical.angle > 20 ? '#FF4444' : '#00D4AA',
                fontSize: '11px',
                marginBottom: '3px',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <strong>Cervical (Neck):</strong> 
                <span>{spineData.cervical.angle.toFixed(0)}°</span>
              </div>
              <div style={{ fontSize: '10px', color: '#7D8590' }}>
                {isDetecting ? (spineData.cervical.angle > 20 ? 'Head too forward - bring chin back' : 'Good neck alignment') : 'Start recording for live analysis'}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 style={{ 
            color: '#FFB800', 
            marginBottom: '8px', 
            fontSize: '12px',
            fontWeight: '500',
            textTransform: 'uppercase'
          }}>Drummer Tips</h3>
          <div style={{ 
            backgroundColor: '#21262D', 
            padding: '12px', 
            borderRadius: '6px',
            border: '1px solid #30363D',
            fontSize: '11px',
            color: '#E6EDF3'
          }}>
            <p style={{ margin: '0 0 8px 0' }}>• Keep shoulders level and relaxed</p>
            <p style={{ margin: '0 0 8px 0' }}>• Maintain 90° elbow angles for stick control</p>
            <p style={{ margin: '0 0 8px 0' }}>• Sit tall with slight forward lean</p>
            <p style={{ margin: '0' }}>• Keep feet flat on floor/pedals</p>
          </div>
        </div>
      </div>
    </>
  );
};

const AnalyticsSidebar = ({ isOpen, currentAngles, spineData, onToggle, isDetecting }) => {
  return (
    <>
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          right: isOpen ? '280px' : '10px',
          top: '30%',
          transform: 'translateY(-50%)',
          zIndex: 1001,
          backgroundColor: '#00D4AA',
          color: '#0E1116',
          border: 'none',
          padding: '10px 6px',
          borderRadius: isOpen ? '6px 0 0 6px' : '6px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: '600',
          fontSize: '11px'
        }}
      >
        {!isOpen && <BarChart3 size={14} />}
        {!isOpen && <span>Analytics</span>}
        {isOpen && <ChevronRight size={14} />}
      </button>

      <div style={{
        position: 'fixed',
        top: 0,
        right: isOpen ? 0 : '-280px',
        width: '280px',
        height: '100vh',
        backgroundColor: '#1A1D23',
        color: '#E6EDF3',
        transition: 'right 0.3s ease',
        zIndex: 1000,
        padding: '15px',
        boxSizing: 'border-box',
        borderLeft: '1px solid #30363D',
        fontSize: '13px',
        overflowY: 'auto'
      }}>
        <h2 style={{ 
          marginBottom: '15px', 
          color: '#00D4AA', 
          fontSize: '16px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <BarChart3 size={16} />
          Live Analytics
        </h2>

        <div style={{ marginBottom: '15px' }}>
          <h3 style={{ 
            color: '#00D4AA', 
            marginBottom: '8px', 
            fontSize: '12px',
            fontWeight: '500',
            textTransform: 'uppercase'
          }}>Current Angles</h3>
          <div style={{ 
            backgroundColor: '#21262D', 
            padding: '12px', 
            borderRadius: '6px',
            border: '1px solid #30363D'
          }}>
            {Object.entries(currentAngles).map(([key, value]) => {
              let isGood = false;
              if (key.includes('Elbow')) isGood = value >= 60 && value <= 120;
              else if (key.includes('Knee')) isGood = value >= 80 && value <= 120;
              
              return (
                <div key={key} style={{ marginBottom: '8px' }}>
                  <div style={{ 
                    color: isGood ? '#00D4AA' : '#FF4444',
                    fontSize: '11px',
                    marginBottom: '3px',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <strong>{key}:</strong> 
                    <span>{isDetecting ? value.toFixed(0) : '--'}°</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '3px',
                    backgroundColor: '#30363D',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.min(100, (value / 180) * 100)}%`,
                      height: '100%',
                      backgroundColor: isGood ? '#00D4AA' : '#FF4444',
                      borderRadius: '2px',
                      transition: 'all 0.1s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 style={{ 
            color: '#00D4AA', 
            marginBottom: '8px', 
            fontSize: '12px',
            fontWeight: '500',
            textTransform: 'uppercase'
          }}>Spine Tracking</h3>
          <div style={{ 
            backgroundColor: '#21262D', 
            padding: '12px', 
            borderRadius: '6px',
            border: '1px solid #30363D'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ 
                color: spineData.lumbar.angle <= 15 ? '#00D4AA' : '#FF4444',
                fontSize: '11px',
                marginBottom: '3px',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <strong>Lumbar:</strong> 
                <span>{spineData.lumbar.angle.toFixed(0)}°</span>
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ 
                color: spineData.cervical.angle <= 20 ? '#00D4AA' : '#FF4444',
                fontSize: '11px',
                marginBottom: '3px',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <strong>Cervical:</strong> 
                <span>{spineData.cervical.angle.toFixed(0)}°</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

function App() {
  const [postureFeedback, setPostureFeedback] = useState('Ready to analyse drumming posture...');
  const [postureScore, setPostureScore] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [adviceOpen, setAdviceOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  
  const [sessionData, setSessionData] = useState({
    startTime: Date.now(),
    duration: 0,
    scores: [],
    issues: []
  });
  const [currentAngles, setCurrentAngles] = useState({
    leftElbow: 90,
    rightElbow: 90,
    leftKnee: 90,
    rightKnee: 90
  });
  const [spineData, setSpineData] = useState({
    lumbar: { angle: 0 },
    cervical: { angle: 0 }
  });
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const netRef = useRef(null);
  const sessionIntervalRef = useRef(null);
  const detectionCount = useRef(0);

  const handleSidebarToggle = (sidebarName) => {
    if (sidebarName === 'analytics') {
      setAnalyticsOpen(!analyticsOpen);
      setAdviceOpen(false);
      setSessionOpen(false);
    } else if (sidebarName === 'advice') {
      setAdviceOpen(!adviceOpen);
      setAnalyticsOpen(false);
      setSessionOpen(false);
    } else if (sidebarName === 'session') {
      setSessionOpen(!sessionOpen);
      setAnalyticsOpen(false);
      setAdviceOpen(false);
    }
  };

  useEffect(() => {
    if (isDetecting) {
      sessionIntervalRef.current = setInterval(() => {
        setSessionData(prev => ({
          ...prev,
          duration: Math.floor((Date.now() - prev.startTime) / 1000)
        }));
      }, 1000);
    } else if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current);
    }
    
    return () => {
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current);
      }
    };
  }, [isDetecting]);

  const calculateAngle = useCallback((x1, y1, x2, y2, x3, y3) => {
    // Calculate vectors from middle point to other points
    const vector1 = { x: x1 - x2, y: y1 - y2 };
    const vector2 = { x: x3 - x2, y: y3 - y2 };
    
    // Calculate dot product
    const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
    
    // Calculate magnitudes
    const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
    const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);
    
    // Calculate angle in radians, then convert to degrees
    const angle = Math.acos(Math.max(-1, Math.min(1, dotProduct / (magnitude1 * magnitude2))));
    // Return interior angle for elbow measurements
    return angle * (180 / Math.PI);
  }, []);

  const getKeypoint = useCallback((pose, partName, minConfidence = 0.3) => {
    const point = pose.keypoints.find(kp => kp.part === partName);
    return point && point.score >= minConfidence ? point : null;
  }, []);

  const drawPose = useCallback((pose, canvas, ctx) => {
    if (!canvas || !ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Only draw keypoints with high confidence to reduce visual clutter
    pose.keypoints.forEach((keypoint) => {
      if (keypoint.score > 0.5) {
        const { x, y } = keypoint.position;
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 6.28);
        
        if (keypoint.part.includes('shoulder') || keypoint.part === 'nose') {
          ctx.fillStyle = '#FF4444';
        } else if (keypoint.part.includes('wrist') || keypoint.part.includes('elbow')) {
          ctx.fillStyle = '#00D4AA';
        } else if (keypoint.part.includes('hip') || keypoint.part.includes('knee') || keypoint.part.includes('ankle')) {
          ctx.fillStyle = '#1F6FEB';
        } else {
          ctx.fillStyle = '#FFD700';
        }
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 6.28);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    const skeleton = [
      ['leftShoulder', 'rightShoulder'],
      ['leftShoulder', 'leftElbow'],
      ['leftElbow', 'leftWrist'],
      ['rightShoulder', 'rightElbow'],
      ['rightElbow', 'rightWrist'],
      ['leftShoulder', 'leftHip'],
      ['rightShoulder', 'rightHip'],
      ['leftHip', 'rightHip'],
      ['leftHip', 'leftKnee'],
      ['rightHip', 'rightKnee'],
      ['leftKnee', 'leftAnkle'],
      ['rightKnee', 'rightAnkle'],
      ['nose', 'leftShoulder'],
      ['nose', 'rightShoulder']
    ];

    skeleton.forEach(([startPoint, endPoint]) => {
      const start = getKeypoint(pose, startPoint, 0.5);
      const end = getKeypoint(pose, endPoint, 0.5);

      if (start && end) {
        ctx.beginPath();
        ctx.moveTo(start.position.x, start.position.y);
        ctx.lineTo(end.position.x, end.position.y);
        ctx.strokeStyle = '#00CCFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    const angles = { ...currentAngles };
    const spineAngles = { lumbar: { angle: 0 }, cervical: { angle: 0 } };
    
    const leftShoulder = getKeypoint(pose, 'leftShoulder', 0.4);
    const rightShoulder = getKeypoint(pose, 'rightShoulder', 0.4);
    const leftElbow = getKeypoint(pose, 'leftElbow', 0.4);
    const rightElbow = getKeypoint(pose, 'rightElbow', 0.4);
    const leftWrist = getKeypoint(pose, 'leftWrist', 0.4);
    const rightWrist = getKeypoint(pose, 'rightWrist', 0.4);
    const leftHip = getKeypoint(pose, 'leftHip', 0.4);
    const rightHip = getKeypoint(pose, 'rightHip', 0.4);
    const leftKnee = getKeypoint(pose, 'leftKnee', 0.4);
    const rightKnee = getKeypoint(pose, 'rightKnee', 0.4);
    const leftAnkle = getKeypoint(pose, 'leftAnkle', 0.4);
    const rightAnkle = getKeypoint(pose, 'rightAnkle', 0.4);
    const nose = getKeypoint(pose, 'nose', 0.4);
    
    if (leftShoulder && leftElbow && leftWrist) {
      angles.leftElbow = calculateAngle(
        leftShoulder.position.x, leftShoulder.position.y,
        leftElbow.position.x, leftElbow.position.y,
        leftWrist.position.x, leftWrist.position.y
      );
    }
    
    if (rightShoulder && rightElbow && rightWrist) {
      angles.rightElbow = calculateAngle(
        rightShoulder.position.x, rightShoulder.position.y,
        rightElbow.position.x, rightElbow.position.y,
        rightWrist.position.x, rightWrist.position.y
      );
    }

    if (leftHip && leftKnee && leftAnkle) {
      angles.leftKnee = calculateAngle(
        leftHip.position.x, leftHip.position.y,
        leftKnee.position.x, leftKnee.position.y,
        leftAnkle.position.x, leftAnkle.position.y
      );
    }

    if (rightHip && rightKnee && rightAnkle) {
      angles.rightKnee = calculateAngle(
        rightHip.position.x, rightHip.position.y,
        rightKnee.position.x, rightKnee.position.y,
        rightAnkle.position.x, rightAnkle.position.y
      );
    }

    // Calculate spine angles
    if (leftShoulder && rightShoulder && leftHip && rightHip) {
      const shoulderMidX = (leftShoulder.position.x + rightShoulder.position.x) / 2;
      const shoulderMidY = (leftShoulder.position.y + rightShoulder.position.y) / 2;
      const hipMidX = (leftHip.position.x + rightHip.position.x) / 2;
      const hipMidY = (leftHip.position.y + rightHip.position.y) / 2;
      
      // Draw spine line
      ctx.beginPath();
      ctx.strokeStyle = '#FF00FF';
      ctx.lineWidth = 4;
      ctx.moveTo(shoulderMidX, shoulderMidY);
      ctx.lineTo(hipMidX, hipMidY);
      ctx.stroke();
      
      // Lumbar spine angle (hip to shoulder alignment)
      const lumbarAngle = Math.abs(Math.atan2(
        shoulderMidX - hipMidX,
        hipMidY - shoulderMidY
      ) * (180 / Math.PI));
      spineAngles.lumbar.angle = lumbarAngle;
      
      // Cervical spine angle (neck forward head posture)
      if (nose) {
        const cervicalAngle = Math.abs(Math.atan2(
          nose.position.x - shoulderMidX,
          shoulderMidY - nose.position.y
        ) * (180 / Math.PI));
        spineAngles.cervical.angle = cervicalAngle;
      }
    }

    // Draw angle labels - ONE label per detected joint, mirrored for user perspective
    // User's actual left elbow (appears on screen right in mirrored view)
    if (leftElbow && angles.leftElbow > 0) {
      ctx.fillStyle = '#00D4AA';
      ctx.font = '14px Arial';
      ctx.fillText(`R: ${angles.leftElbow.toFixed(0)}°`, leftElbow.position.x - 60, leftElbow.position.y - 15);
    }
    
    // User's actual right elbow (appears on screen left in mirrored view)
    if (rightElbow && angles.rightElbow > 0) {
      ctx.fillStyle = '#00D4AA';
      ctx.font = '14px Arial';
      ctx.fillText(`L: ${angles.rightElbow.toFixed(0)}°`, rightElbow.position.x + 15, rightElbow.position.y - 15);
    }
    
    // User's actual left knee (appears on screen right in mirrored view)
    if (leftKnee && angles.leftKnee > 0) {
      ctx.fillStyle = '#1F6FEB';
      ctx.font = '14px Arial';
      ctx.fillText(`R: ${angles.leftKnee.toFixed(0)}°`, leftKnee.position.x - 60, leftKnee.position.y + 25);
    }
    
    // User's actual right knee (appears on screen left in mirrored view)
    if (rightKnee && angles.rightKnee > 0) {
      ctx.fillStyle = '#1F6FEB';
      ctx.font = '14px Arial';
      ctx.fillText(`L: ${angles.rightKnee.toFixed(0)}°`, rightKnee.position.x + 15, rightKnee.position.y + 25);
    }

    setCurrentAngles(angles);
    setSpineData(spineAngles);
  }, [calculateAngle, getKeypoint, currentAngles]);

  const calculateDrummerPostureScore = useCallback((pose) => {
    detectionCount.current += 1;
    
    const leftShoulder = getKeypoint(pose, 'leftShoulder', 0.3);
    const rightShoulder = getKeypoint(pose, 'rightShoulder', 0.3);
    const leftHip = getKeypoint(pose, 'leftHip', 0.3);
    const rightHip = getKeypoint(pose, 'rightHip', 0.3);
    const leftElbow = getKeypoint(pose, 'leftElbow', 0.3);
    const rightElbow = getKeypoint(pose, 'rightElbow', 0.3);
    const leftWrist = getKeypoint(pose, 'leftWrist', 0.3);
    const rightWrist = getKeypoint(pose, 'rightWrist', 0.3);
    const nose = getKeypoint(pose, 'nose', 0.3);

    let score = 10;
    let feedback = [];

    // Always calculate score even with lower confidence points
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
      // Reduced penalty for detection issues
      score -= 3;
      feedback.push("Partial body detection - ensure you're fully visible");
    } else {
      const shoulderDiff = Math.abs(rightShoulder.position.y - leftShoulder.position.y);
      const shoulderDistance = Math.abs(rightShoulder.position.x - leftShoulder.position.x);
      const shoulderSlope = shoulderDiff / Math.max(1, shoulderDistance);
      
      if (shoulderSlope > 0.12) {
        const penalty = Math.min(2, shoulderSlope * 15);
        score -= penalty;
        feedback.push("Uneven shoulders - affects stick control");
      }
      
      const shoulderMidX = (leftShoulder.position.x + rightShoulder.position.x) / 2;
      const shoulderMidY = (leftShoulder.position.y + rightShoulder.position.y) / 2;
      const hipMidX = (leftHip.position.x + rightHip.position.x) / 2;
      const hipMidY = (leftHip.position.y + rightHip.position.y) / 2;
      
      const spineAngle = Math.atan2(
        hipMidX - shoulderMidX,
        shoulderMidY - hipMidY
      ) * (180 / Math.PI);
      
      if (Math.abs(spineAngle) > 15) {
        const penalty = Math.min(2, Math.abs(spineAngle) / 12);
        score -= penalty;
        if (spineAngle < -15) {
          feedback.push("Leaning back too much");
        } else {
          feedback.push("Leaning forward too much");
        }
      }
      
      if (nose) {
        const headForward = Math.abs(nose.position.x - shoulderMidX);
        if (headForward > 30) {
          const penalty = Math.min(1.5, headForward / 40);
          score -= penalty;
          feedback.push("Head position needs adjustment");
        }
      }
    }
    
    if (leftElbow && rightElbow && leftWrist && rightWrist && leftShoulder && rightShoulder) {
      const leftElbowAngle = calculateAngle(
        leftShoulder.position.x, leftShoulder.position.y,
        leftElbow.position.x, leftElbow.position.y,
        leftWrist.position.x, leftWrist.position.y
      );
      
      const rightElbowAngle = calculateAngle(
        rightShoulder.position.x, rightShoulder.position.y,
        rightElbow.position.x, rightElbow.position.y,
        rightWrist.position.x, rightWrist.position.y
      );
      
      if (leftElbowAngle < 60 || leftElbowAngle > 130) {
        const penalty = Math.min(1.5, Math.abs(leftElbowAngle - 90) / 20);
        score -= penalty;
        feedback.push(`Left elbow: ${leftElbowAngle.toFixed(0)}° (optimal: 60-120°)`);
      }
      
      if (rightElbowAngle < 60 || rightElbowAngle > 130) {
        const penalty = Math.min(1.5, Math.abs(rightElbowAngle - 90) / 20);
        score -= penalty;
        feedback.push(`Right elbow: ${rightElbowAngle.toFixed(0)}° (optimal: 60-120°)`);
      }
    } else {
      score -= 1;
      feedback.push("Arm positioning unclear - adjust camera angle");
    }
    
    score = Math.max(1, Math.min(10, score));
    
    setSessionData(prev => ({
      ...prev,
      scores: [...prev.scores.slice(-299), score]
    }));
    
    if (score >= 8.5) {
      feedback.unshift("Excellent drumming posture!");
    } else if (score >= 7) {
      feedback.unshift("Good posture with minor adjustments needed");
    } else if (score >= 5) {
      feedback.unshift("Moderate posture issues detected");
    } else if (score >= 3) {
      feedback.unshift("Significant posture problems");
    } else {
      feedback.unshift("Poor posture - major adjustments needed");
    }
    
    return {
      score: score,
      feedback: feedback.length > 0 ? feedback.join(". ") : "Analyzing posture..."
    };
  }, [calculateAngle, getKeypoint]);

  const detectPoseFrame = useCallback(async () => {
    if (!netRef.current || !videoRef.current || !canvasRef.current || !isDetecting) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (video.readyState < 2) {
        requestRef.current = requestAnimationFrame(detectPoseFrame);
        return;
      }
      
      const pose = await netRef.current.estimateSinglePose(video, {
        flipHorizontal: true,
        decodingMethod: 'single-person'
      });

      drawPose(pose, canvas, ctx);

      if (!calibrationMode) {
        const postureResults = calculateDrummerPostureScore(pose);
        setPostureScore(postureResults.score);
        setPostureFeedback(postureResults.feedback);
      }

      setTimeout(() => {
        requestRef.current = requestAnimationFrame(detectPoseFrame);
      }, 33);
      
    } catch (error) {
      console.error('Error in pose detection frame:', error);
      setTimeout(() => {
        requestRef.current = requestAnimationFrame(detectPoseFrame);
      }, 100);
    }
  }, [isDetecting, calibrationMode, drawPose, calculateDrummerPostureScore]);

  const startVideoStream = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) {
      console.error('Video or canvas element is null');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: 'user'
        }
      });

      video.srcObject = stream;
      
      video.onloadedmetadata = () => {
        video.play();
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        setIsLoading(false);
        console.log(`Video loaded: ${video.videoWidth}x${video.videoHeight}`);
      };
    } catch (error) {
      console.error('Error accessing webcam:', error);
      if (error.name === 'NotAllowedError') {
        setPostureFeedback('Camera access denied. Please allow camera permission and refresh.');
      } else {
        setPostureFeedback('Error accessing camera. Please check your camera connection.');
      }
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        const tf = await import('@tensorflow/tfjs');
        const { load } = await import('@tensorflow-models/posenet');
        
        await tf.ready();
        
        netRef.current = await load({
          architecture: 'MobileNetV1',
          outputStride: 16,
          inputResolution: { width: 513, height: 513 },
          multiplier: 0.75,
          quantBytes: 4
        });
        
        console.log('PoseNet model loaded successfully');
        await startVideoStream();
      } catch (error) {
        console.error('Error initializing:', error);
        setPostureFeedback('Failed to load pose detection. Please refresh the page.');
        setIsLoading(false);
      }
    };

    initialize();

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      
      const currentVideo = videoRef.current;
      if (currentVideo && currentVideo.srcObject) {
        const videoTracks = currentVideo.srcObject.getTracks();
        if (videoTracks) {
          videoTracks.forEach(track => track.stop());
        }
      }
    };
  }, [startVideoStream]);

  useEffect(() => {
    if (isDetecting && netRef.current) {
      detectPoseFrame();
    } else if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [isDetecting, detectPoseFrame]);

  const toggleDetection = () => {
    if (!isDetecting) {
      setSessionData({
        startTime: Date.now(),
        duration: 0,
        scores: [],
        issues: []
      });
      detectionCount.current = 0;
    }
    // Don't clear session data when stopping - keep it for sidebar display
    setIsDetecting(prev => !prev);
  };

  const calibratePosture = () => {
    if (!isDetecting || !netRef.current || !videoRef.current) {
      setPostureFeedback("Please start detection first before calibrating");
      return;
    }
    
    setCalibrationMode(true);
    setPostureFeedback("Please sit in your ideal drumming position, then click 'Save Calibration'");
  };

  const saveCalibration = async () => {
    if (!netRef.current || !videoRef.current) return;
    
    try {
      const pose = await netRef.current.estimateSinglePose(videoRef.current, {
        flipHorizontal: true,
      });
      
      const leftShoulder = getKeypoint(pose, 'leftShoulder', 0.6);
      const rightShoulder = getKeypoint(pose, 'rightShoulder', 0.6);
      const leftHip = getKeypoint(pose, 'leftHip', 0.6);
      const rightHip = getKeypoint(pose, 'rightHip', 0.6);
      
      if (leftShoulder && rightShoulder && leftHip && rightHip) {
        setPostureFeedback("Calibration saved! This is now your reference posture.");
      } else {
        setPostureFeedback("Couldn't detect all required points. Please ensure you're fully visible and try again.");
      }
    } catch (error) {
      console.error("Calibration error:", error);
      setPostureFeedback("Error during calibration. Please try again.");
    }
    
    setCalibrationMode(false);
  };

  return (
    <div style={{ 
      position: 'relative', 
      height: '100vh', 
      width: '100vw',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#0E1116',
      color: '#E6EDF3',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      <SessionDataSidebar 
        isOpen={sessionOpen} 
        sessionData={sessionData}
        onToggle={() => handleSidebarToggle('session')}
        isDetecting={isDetecting}
      />

      <AnalyticsSidebar 
        isOpen={analyticsOpen} 
        currentAngles={currentAngles}
        spineData={spineData}
        onToggle={() => handleSidebarToggle('analytics')}
        isDetecting={isDetecting}
      />

      <AdviceSidebar 
        isOpen={adviceOpen} 
        currentAngles={currentAngles}
        spineData={spineData}
        onToggle={() => handleSidebarToggle('advice')}
        isDetecting={isDetecting}
      />

      <div style={{ textAlign: 'center', padding: '10px', flexShrink: 0 }}>
        <h1 style={{ 
          color: '#00D4AA', 
          margin: 0, 
          fontSize: '18px',
          fontWeight: '600'
        }}>Real-Time Drummer Posture Analysis</h1>
        <p style={{ 
          color: '#7D8590', 
          fontSize: '11px',
          fontWeight: '400',
          margin: '4px 0 0 0'
        }}>Live pose tracking with motion visualisation</p>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '0 10px 10px 10px',
        marginRight: (analyticsOpen || adviceOpen || sessionOpen) ? '300px' : '0',
        transition: 'margin-right 0.3s ease',
        minHeight: 0
      }}>
        
        <PostureDashboard score={postureScore} />
        
        {isLoading && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(14, 17, 22, 0.95)',
            color: '#00D4AA',
            padding: '20px',
            borderRadius: '8px',
            zIndex: 100,
            border: '1px solid #30363D',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Loading drumming posture detection...
          </div>
        )}

        <div style={{
          position: 'relative',
          flex: 1,
          backgroundColor: '#000',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #30363D',
          minHeight: 0,
          maxWidth: '80%',
          margin: '0 auto'
        }}>
          <video
            ref={videoRef}
            width="1280"
            height="720"
            autoPlay
            muted
            style={{ 
              width: '100%', 
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transform: 'scaleX(-1)'
            }}
          />

          <canvas 
            ref={canvasRef}
            width="1280"
            height="720"
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%'
            }}
          />

          <div style={{
            position: 'absolute',
            top: '15px',
            left: '15px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: isDetecting ? '#00D4AA' : '#7D8590',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {isDetecting ? '● DETECTING' : '○ STOPPED'}
            {isDetecting && (
              <span style={{ marginLeft: '10px', fontSize: '10px' }}>
                Frames: {detectionCount.current}
              </span>
            )}
          </div>

          <div style={{
            position: 'absolute',
            bottom: '15px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <button 
              onClick={toggleDetection} 
              style={{
                backgroundColor: isDetecting ? '#FF4444' : '#00D4AA',
                color: '#000000',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '700',
                minWidth: '140px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
              }}
            >
              {isDetecting ? 'Stop Detection' : 'Start Detection'}
            </button>
            
            {!calibrationMode ? (
              <button 
                onClick={calibratePosture} 
                style={{
                  backgroundColor: '#1F6FEB',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '700',
                  minWidth: '140px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
              >
                Calibrate Posture
              </button>
            ) : (
              <button 
                onClick={saveCalibration} 
                style={{
                  backgroundColor: '#FB8500',
                  color: '#000000',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '700',
                  minWidth: '140px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
              >
                Save Calibration
              </button>
            )}
          </div>
        </div>
        
        <div style={{
          backgroundColor: '#1E2329',
          border: '1px solid #30363D',
          color: '#E6EDF3',
          padding: '10px',
          borderRadius: '8px',
          textAlign: 'center',
          marginTop: '10px',
          flexShrink: 0
        }}>
          <h3 style={{ 
            margin: '0 0 6px 0', 
            color: '#00D4AA',
            fontSize: '13px',
            fontWeight: '600'
          }}>Status: {postureScore.toFixed(1)}/10</h3>
          <p style={{ 
            margin: 0, 
            color: '#7D8590',
            fontSize: '11px',
            lineHeight: '1.4'
          }}>{postureFeedback}</p>
        </div>
      </div>
    </div>
  );
}

export default App;