// DrummerPostureApp.js

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap, 
  BarChart3,
  Play,
  Pause,
  Target,
  Activity
} from 'lucide-react';

const DrummerPostureApp = () => {
  // Main app state
  const [postureFeedback, setPostureFeedback] = useState('Initializing pose detection...');
  const [postureScore, setPostureScore] = useState(0);
  const [currentAngles, setCurrentAngles] = useState({});
  const [isDetecting, setIsDetecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  
  // Dashboard state
  const [dashboardExpanded, setDashboardExpanded] = useState(false);
  const [adviceExpanded, setAdviceExpanded] = useState(false);
  const [expandedAdviceSection, setExpandedAdviceSection] = useState(null);
  
  // Session data with localStorage persistence
  const [sessionData, setSessionData] = useState(() => {
    try {
      const saved = localStorage.getItem('drummerPostureSession');
      return saved ? JSON.parse(saved) : {
        history: [],
        startTime: null,
        avgScore: 0,
        timeInGoodPosture: 0,
        corrections: 0,
        totalSessions: 0
      };
    } catch {
      return {
        history: [],
        startTime: null,
        avgScore: 0,
        timeInGoodPosture: 0,
        corrections: 0,
        totalSessions: 0
      };
    }
  });

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const netRef = useRef(null);
  const detectionFrameRef = useRef(null);

  // Save session data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('drummerPostureSession', JSON.stringify(sessionData));
    } catch (e) {
      console.warn('Could not save session data:', e);
    }
  }, [sessionData]);

  // Calculate angle between three points
  const calculateAngle = useCallback((x1, y1, x2, y2, x3, y3) => {
    const angle1 = Math.atan2(y1 - y2, x1 - x2);
    const angle2 = Math.atan2(y3 - y2, x3 - x2);
    let angle = (angle2 - angle1) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    return angle > 180 ? 360 - angle : angle;
  }, []);

  // Mock pose detection for now (replace with real TensorFlow implementation)
  const mockPoseDetection = useCallback(() => {
    if (!isDetecting || !cameraReady) return;
    
    // Simulate realistic pose detection data
    const mockAngles = {
      leftElbow: 85 + Math.random() * 30,
      rightElbow: 88 + Math.random() * 25,
      spineAngle: 8 + Math.random() * 10,
      shoulderLevel: Math.random() * 8
    };
    
    setCurrentAngles(mockAngles);
    
    // Calculate score based on angles
    let score = 10;
    if (mockAngles.leftElbow < 80 || mockAngles.leftElbow > 110) score -= 2;
    if (mockAngles.rightElbow < 80 || mockAngles.rightElbow > 110) score -= 2;
    if (mockAngles.spineAngle < 5 || mockAngles.spineAngle > 15) score -= 1.5;
    if (mockAngles.shoulderLevel > 5) score -= 1;
    
    score = Math.max(0, score);
    setPostureScore(score);
    
    // Update session data
    const now = Date.now();
    setSessionData(prev => {
      const newHistory = [...prev.history, {
        timestamp: now,
        score,
        angles: mockAngles
      }].slice(-100);
      
      const avgScore = newHistory.reduce((sum, entry) => sum + entry.score, 0) / newHistory.length;
      const goodPostureTime = newHistory.filter(entry => entry.score >= 7).length / newHistory.length * 100;
      
      return {
        ...prev,
        history: newHistory,
        avgScore: isNaN(avgScore) ? 0 : avgScore,
        timeInGoodPosture: isNaN(goodPostureTime) ? 0 : goodPostureTime,
        startTime: prev.startTime || now
      };
    });
    
    // Update feedback
    if (score >= 8) {
      setPostureFeedback("Excellent posture! Keep it up.");
    } else if (score >= 6) {
      setPostureFeedback("Good posture with minor adjustments needed.");
    } else {
      setPostureFeedback("Posture needs attention - check your positioning.");
    }
  }, [isDetecting, cameraReady]);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        },
        audio: false
      });

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas) {
        video.srcObject = stream;
        
        video.onloadedmetadata = () => {
          video.play().then(() => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            setCameraReady(true);
            setPostureFeedback('Camera ready - click Start Analysis to begin');
          }).catch(err => {
            console.error('Error playing video:', err);
            setError('Error starting video playback');
          });
        };
      }

    } catch (error) {
      console.error('Camera initialization error:', error);
      
      if (error.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and refresh.');
      } else if (error.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera and refresh.');
      } else {
        setError(`Camera error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize on component mount
  useEffect(() => {
    initializeCamera();
  }, [initializeCamera]);

  // Mock detection interval
  useEffect(() => {
    let interval;
    if (isDetecting && cameraReady) {
      interval = setInterval(mockPoseDetection, 500);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDetecting, cameraReady, mockPoseDetection]);

  const toggleDetection = () => {
    if (!cameraReady) {
      setPostureFeedback('Please wait for camera to initialize');
      return;
    }
    
    setIsDetecting(!isDetecting);
    
    if (!isDetecting) {
      const now = Date.now();
      setSessionData(prev => ({
        ...prev,
        startTime: now,
        totalSessions: prev.totalSessions + 1
      }));
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return '#4FFFB0';
    if (score >= 6) return '#40E0D0';
    if (score >= 4) return '#FFA500';
    return '#FF6B6B';
  };

  const getAngleAdvice = (angleName, value) => {
    const advice = {
      leftElbow: {
        good: (val) => val >= 80 && val <= 110,
        title: "Left Arm Position",
        issue: value < 80 ? "Arm too tight - reduces fluidity" : "Arm too extended - may cause fatigue",
        solutions: [
          "Adjust throne height for optimal elbow angle",
          "Position snare drum at comfortable reach",
          "Practice relaxed arm drops to find natural position",
          "Check stick grip - avoid excessive tension"
        ]
      },
      rightElbow: {
        good: (val) => val >= 80 && val <= 110,
        title: "Right Arm Position",
        issue: value < 80 ? "Arm too tight - limits power and speed" : "Arm too extended - reduces control",
        solutions: [
          "Adjust cymbal heights for natural arm swing",
          "Check tom positioning relative to your reach",
          "Ensure throne allows comfortable positioning",
          "Practice coordination exercises at optimal angle"
        ]
      },
      spineAngle: {
        good: (val) => val >= 5 && val <= 15,
        title: "Spine Alignment",
        issue: value < 5 ? "Too straight - may restrict breathing and movement" : "Leaning too far forward - stress on lower back",
        solutions: [
          "Adjust throne height for natural forward lean",
          "Strengthen core muscles for better support",
          "Check drum setup height to avoid over-reaching",
          "Use back support cushion if needed"
        ]
      },
      shoulderLevel: {
        good: (val) => Math.abs(val) <= 5,
        title: "Shoulder Alignment",
        issue: "Uneven shoulders affect stick balance and timing consistency",
        solutions: [
          "Check for uneven throne or floor surface",
          "Ensure cymbal setup is symmetrical",
          "Strengthen weaker side with targeted exercises",
          "Practice playing with focus on shoulder awareness"
        ]
      }
    };
    return advice[angleName] || null;
  };

  const styles = {
    app: {
      display: 'flex',
      height: '100vh',
      background: '#0F0F0F',
      color: '#E0E0E0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden'
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    },
    header: {
      padding: '20px 30px',
      background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
      borderBottom: '1px solid #40E0D0'
    },
    headerTitle: {
      margin: '0 0 8px 0',
      fontSize: '24px',
      fontWeight: '600',
      background: 'linear-gradient(135deg, #4FFFB0 0%, #40E0D0 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    headerSubtitle: {
      margin: 0,
      color: '#888',
      fontSize: '14px'
    },
    cameraSection: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative'
    },
    cameraContainer: {
      position: 'relative',
      width: '100%',
      maxWidth: '800px',
      aspectRatio: '4/3',
      background: '#1A1A1A',
      borderRadius: '12px',
      border: '2px solid #333',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    },
    video: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      background: '#1A1A1A'
    },
    canvas: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none'
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.8)',
      color: '#40E0D0',
      fontSize: '16px'
    },
    errorMessage: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(255, 107, 107, 0.1)',
      border: '1px solid #FF6B6B',
      color: '#FF6B6B',
      padding: '20px',
      borderRadius: '8px',
      textAlign: 'center',
      maxWidth: '80%'
    },
    statusBar: {
      position: 'absolute',
      top: '20px',
      left: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      background: 'rgba(0, 0, 0, 0.8)',
      borderRadius: '20px',
      fontSize: '12px'
    },
    statusIndicator: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: isDetecting ? '#4FFFB0' : '#666'
    },
    feedbackBar: {
      position: 'absolute',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '12px 20px',
      background: 'rgba(0, 0, 0, 0.8)',
      borderRadius: '25px',
      color: getScoreColor(postureScore),
      fontSize: '14px',
      maxWidth: '80%',
      textAlign: 'center'
    },
    controls: {
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '12px'
    },
    controlButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 20px',
      background: 'linear-gradient(135deg, #4FFFB0 0%, #40E0D0 100%)',
      color: '#000',
      border: 'none',
      borderRadius: '25px',
      fontWeight: '600',
      cursor: (isLoading || !!error) ? 'not-allowed' : 'pointer',
      transition: 'all 0.3s ease',
      opacity: (isLoading || !!error) ? 0.5 : 1
    },
    dashboardPanel: {
      position: 'fixed',
      top: 0,
      right: 0,
      height: '100vh',
      width: dashboardExpanded ? '350px' : '60px',
      background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
      borderLeft: '1px solid #333',
      transition: 'all 0.3s ease',
      zIndex: 1000,
      boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.3)'
    },
    dashboardToggle: {
      position: 'absolute',
      left: '-40px',
      top: '20px',
      width: '40px',
      height: '60px',
      background: 'linear-gradient(135deg, #4FFFB0 0%, #40E0D0 100%)',
      border: 'none',
      borderRadius: '8px 0 0 8px',
      color: '#000',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      fontSize: '10px',
      fontWeight: '600',
      transition: 'all 0.3s ease'
    },
    advicePanel: {
      position: 'fixed',
      top: '50%',
      right: 0,
      height: '50vh',
      width: adviceExpanded ? '350px' : '60px',
      background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
      borderLeft: '1px solid #333',
      borderTop: '1px solid #333',
      transition: 'all 0.3s ease',
      zIndex: 1000,
      boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.3)'
    },
    adviceToggle: {
      position: 'absolute',
      left: '-40px',
      top: '50px',
      width: '40px',
      height: '60px',
      background: 'linear-gradient(135deg, #4FFFB0 0%, #40E0D0 100%)',
      border: 'none',
      borderRadius: '8px 0 0 8px',
      color: '#000',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      fontSize: '10px',
      fontWeight: '600',
      transition: 'all 0.3s ease'
    }
  };

  return (
    <div style={styles.app}>
      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>
            Drummer's Posture Analysis
          </h1>
          <p style={styles.headerSubtitle}>
            Real-time posture monitoring for better drumming performance
          </p>
        </div>
        
        {/* Camera Section */}
        <div style={styles.cameraSection}>
          <div style={styles.cameraContainer}>
            <video 
              ref={videoRef}
              autoPlay 
              muted 
              playsInline
              style={styles.video}
            />
            <canvas 
              ref={canvasRef}
              style={styles.canvas}
            />
            
            {/* Loading Overlay */}
            {isLoading && (
              <div style={styles.loadingOverlay}>
                Loading camera and pose detection...
              </div>
            )}
            
            {/* Error Message */}
            {error && (
              <div style={styles.errorMessage}>
                {error}
              </div>
            )}
            
            {/* Status Bar */}
            <div style={styles.statusBar}>
              <div style={styles.statusIndicator} />
              <span>{isDetecting ? 'Monitoring Active' : 'Monitoring Paused'}</span>
            </div>
            
            {/* Feedback Bar */}
            {postureFeedback && (
              <div style={styles.feedbackBar}>
                {postureFeedback}
              </div>
            )}
            
            {/* Controls */}
            <div style={styles.controls}>
              <button 
                onClick={toggleDetection}
                disabled={isLoading || !!error}
                style={styles.controlButton}
              >
                {isDetecting ? <Pause size={16} /> : <Play size={16} />}
                {isDetecting ? 'Pause Analysis' : 'Start Analysis'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dashboard Panel */}
      <div style={styles.dashboardPanel}>
        <button 
          onClick={() => setDashboardExpanded(!dashboardExpanded)}
          style={styles.dashboardToggle}
        >
          {dashboardExpanded ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          <span>{dashboardExpanded ? 'Hide' : 'Analytics'}</span>
        </button>
        
        {dashboardExpanded && (
          <div style={{ padding: '20px', height: '100vh', overflowY: 'auto' }}>
            {/* Score Display */}
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <div style={{
                width: '100%',
                height: '8px',
                background: '#333',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '12px'
              }}>
                <div style={{
                  height: '100%',
                  width: `${(postureScore / 10) * 100}%`,
                  backgroundColor: getScoreColor(postureScore),
                  transition: 'all 0.5s ease',
                  borderRadius: '4px'
                }} />
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                marginBottom: '4px',
                color: getScoreColor(postureScore)
              }}>
                {postureScore.toFixed(1)}/10
              </div>
              <div style={{ fontSize: '14px', color: '#888' }}>
                Posture Score
              </div>
            </div>

            {/* Session Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '12px',
              marginBottom: '24px'
            }}>
              {[
                { icon: BarChart3, label: 'Session Avg', value: sessionData.avgScore.toFixed(1), color: '#8B5CF6' },
                { icon: Clock, label: 'Good Posture', value: `${sessionData.timeInGoodPosture.toFixed(0)}%`, color: '#4CAF50' },
                { icon: Zap, label: 'Corrections', value: sessionData.corrections, color: '#FFC107' },
                { icon: Activity, label: 'Sessions', value: sessionData.totalSessions, color: '#40E0D0' }
              ].map((stat, idx) => (
                <div key={idx} style={{
                  background: `rgba(${stat.color === '#8B5CF6' ? '139, 92, 246' : stat.color === '#4CAF50' ? '76, 175, 80' : stat.color === '#FFC107' ? '255, 193, 7' : '64, 224, 208'}, 0.1)`,
                  border: `1px solid ${stat.color}40`,
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <stat.icon size={16} style={{ color: stat.color }} />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: stat.color
                    }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Current Angles */}
            {Object.keys(currentAngles).length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#40E0D0' }}>
                  Current Angles
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px'
                }}>
                  {Object.entries(currentAngles).map(([angleName, value]) => {
                    const advice = getAngleAdvice(angleName, value);
                    const isGood = advice?.good ? advice.good(value) : true;
                    
                    return (
                      <div key={angleName} style={{
                        background: '#2A2A2A',
                        borderRadius: '8px',
                        padding: '12px',
                        textAlign: 'center',
                        border: `1px solid ${isGood ? '#4FFFB0' : '#FFA500'}`,
                        backgroundColor: isGood ? 'rgba(79, 255, 176, 0.05)' : 'rgba(255, 165, 0, 0.05)'
                      }}>
                        <div style={{
                          fontSize: '10px',
                          color: '#888',
                          textTransform: 'capitalize',
                          marginBottom: '4px'
                        }}>
                          {angleName.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </div>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: isGood ? '#4FFFB0' : '#FFA500'
                        }}>
                          {typeof value === 'number' ? `${value.toFixed(0)}°` : value}
                        </div>
                        <div style={{
                          fontSize: '10px',
                          marginTop: '4px',
                          color: isGood ? '#4FFFB0' : '#FFA500'
                        }}>
                          {isGood ? 'Good' : 'Adjust'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* History Chart */}
            <div>
              <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#40E0D0' }}>
                Posture History
              </h3>
              <div style={{
                height: '100px',
                background: '#2A2A2A',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                alignItems: 'end'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'end',
                  height: '100%',
                  width: '100%',
                  gap: '2px'
                }}>
                  {sessionData.history.slice(-30).map((entry, idx) => (
                    <div 
                      key={idx}
                      style={{
                        flex: 1,
                        minHeight: '4px',
                        height: `${(entry.score / 10) * 100}%`,
                        backgroundColor: getScoreColor(entry.score),
                        borderRadius: '2px 2px 0 0',
                        transition: 'all 0.3s ease'
                      }}
                      title={`Score: ${entry.score.toFixed(1)}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Advice Panel */}
      <div style={styles.advicePanel}>
        <button 
          onClick={() => setAdviceExpanded(!adviceExpanded)}
          style={styles.adviceToggle}
        >
          {adviceExpanded ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          <span>{adviceExpanded ? 'Hide' : 'Advice'}</span>
        </button>
        
        {adviceExpanded && (
          <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#40E0D0' }}>
              Personalized Advice
            </h3>
            
            {Object.entries(currentAngles).map(([angleName, value]) => {
              const advice = getAngleAdvice(angleName, value);
              const isGood = advice?.good ? advice.good(value) : true;
              
              if (isGood || !advice) return null;
              
              return (
                <div key={angleName} style={{
                  background: 'rgba(255, 165, 0, 0.1)',
                  border: '1px solid rgba(255, 165, 0, 0.3)',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  overflow: 'hidden'
                }}>
                  <button
                    onClick={() => setExpandedAdviceSection(
                      expandedAdviceSection === angleName ? null : angleName
                    )}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      color: 'inherit',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#FFA500'
                    }}>
                      <AlertTriangle size={16} />
                      <span>{advice.title}</span>
                      <span style={{
                        background: '#FFA500',
                        color: '#000',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {value.toFixed(0)}°
                      </span>
                    </div>
                    {expandedAdviceSection === angleName ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  
                  {expandedAdviceSection === angleName && (
                    <div style={{ padding: '0 16px 16px 16px', color: '#CCC' }}>
                      <div style={{ marginBottom: '12px' }}>
                        <strong>Issue:</strong> {advice.issue}
                      </div>
                      <div>
                        <strong>Solutions:</strong>
                        <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                          {advice.solutions.map((solution, idx) => (
                            <li key={idx} style={{ marginBottom: '4px', fontSize: '14px' }}>
                              {solution}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {postureScore >= 8 && (
              <div style={{
                background: 'rgba(79, 255, 176, 0.1)',
                border: '1px solid rgba(79, 255, 176, 0.3)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                color: '#4FFFB0'
              }}>
                <CheckCircle size={16} />
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                    Excellent Posture!
                  </h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#CCC' }}>
                    Keep up the great work! Remember to take breaks every 30 minutes and stay hydrated during practice sessions.
                  </p>
                </div>
              </div>
            )}

            {Object.keys(currentAngles).length === 0 && (
              <div style={{
                background: 'rgba(64, 224, 208, 0.1)',
                border: '1px solid rgba(64, 224, 208, 0.3)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                color: '#40E0D0'
              }}>
                <Target size={16} />
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                    Position yourself in view
                  </h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#CCC' }}>
                    Make sure your upper body is clearly visible to the camera for posture analysis.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DrummerPostureApp;