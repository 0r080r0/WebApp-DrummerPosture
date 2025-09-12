// PostureDashboard.js

import React from 'react';
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
  Target,
  Activity
} from 'lucide-react';

const PostureDashboard = ({ 
  dashboardExpanded, 
  setDashboardExpanded,
  adviceExpanded,
  setAdviceExpanded,
  expandedAdviceSection,
  setExpandedAdviceSection,
  postureScore,
  sessionData,
  currentAngles,
  isDetecting 
}) => {

  const getScoreColor = (score) => {
    if (score >= 8) return '#4FFFB0';
    if (score >= 6) return '#40E0D0';
    if (score >= 4) return '#FFA500';
    return '#FF6B6B';
  };

  const getAngleAdvice = (angleName, value) => {
    const advice = {
      leftElbow: {
        good: (val) => val >= 70 && val <= 120,
        title: "Left Arm Position",
        issue: value < 70 ? "Arm too tight - reduces fluidity and power" : "Arm too extended - may cause fatigue",
        solutions: [
          "Adjust throne height to achieve 90-110° elbow angle",
          "Position snare drum at comfortable reach distance",
          "Practice relaxed arm drops to find natural position",
          "Check stick grip - avoid death grip tension"
        ]
      },
      rightElbow: {
        good: (val) => val >= 70 && val <= 120,
        title: "Right Arm Position",
        issue: value < 70 ? "Arm too tight - limits power and speed" : "Arm too extended - reduces control",
        solutions: [
          "Adjust hi-hat and ride cymbal heights appropriately",
          "Check tom positioning for natural arm swing",
          "Ensure throne height allows comfortable reach",
          "Practice coordination exercises at optimal angles"
        ]
      },
      spineAngle: {
        good: (val) => val >= 3 && val <= 20,
        title: "Spine Alignment",
        issue: value < 3 ? "Too upright - may restrict breathing and movement" : "Leaning too far forward - stress on lower back",
        solutions: [
          "Adjust throne height for natural 10-15° forward lean",
          "Strengthen core muscles for better spinal support",
          "Position drum kit to avoid over-reaching",
          "Take regular breaks to reset posture"
        ]
      },
      shoulderLevel: {
        good: (val) => val <= 30,
        title: "Shoulder Alignment", 
        issue: "Uneven shoulders affect stick balance and timing consistency",
        solutions: [
          "Check throne and floor surface for levelness",
          "Ensure cymbal setup is symmetrical",
          "Strengthen weaker side with targeted exercises",
          "Practice with awareness of shoulder position"
        ]
      },
      headForward: {
        good: (val) => val <= 50,
        title: "Head Position",
        issue: "Forward head posture strains neck and affects breathing",
        solutions: [
          "Keep chin tucked slightly, ears over shoulders",
          "Adjust music stand height to reduce neck strain",
          "Strengthen deep neck flexors",
          "Be conscious of head position during practice"
        ]
      }
    };
    return advice[angleName] || null;
  };

  const styles = {
    dashboardPanel: {
      position: 'fixed',
      top: 0,
      right: 0,
      height: '50vh',
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
    <>
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
          <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
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
                          {typeof value === 'number' ? `${value.toFixed(0)}°` : value.toFixed(0)}
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

            {Object.keys(currentAngles).length === 0 && !isDetecting && (
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
                    Start Analysis
                  </h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#CCC' }}>
                    Click "Start Analysis" and position yourself in view for real-time posture feedback.
                  </p>
                </div>
              </div>
            )}

            {Object.keys(currentAngles).length === 0 && isDetecting && (
              <div style={{
                background: 'rgba(255, 165, 0, 0.1)',
                border: '1px solid rgba(255, 165, 0, 0.3)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                color: '#FFA500'
              }}>
                <AlertTriangle size={16} />
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                    Position Yourself
                  </h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#CCC' }}>
                    Make sure your upper body is clearly visible to the camera for accurate posture tracking.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default PostureDashboard;