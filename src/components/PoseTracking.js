import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as posenet from '@tensorflow-models/posenet';
import * as tf from '@tensorflow/tfjs';

const PoseTracking = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [poses, setPoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [postureScore, setPostureScore] = useState(0);
  const [postureQuality, setPostureQuality] = useState('Good');
  const [angles, setAngles] = useState({});
  const [showAdvice, setShowAdvice] = useState(false);
  const [advice, setAdvice] = useState([]);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [calibrationData, setCalibrationData] = useState(null);
  const netRef = useRef(null);

  // Initialise PoseNet
  useEffect(() => {
    const loadPoseNet = async () => {
      await tf.setBackend('webgl');
      const net = await posenet.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: { width: 640, height: 480 },
        multiplier: 0.75,
      });
      netRef.current = net;
      setLoading(false);
    };
    loadPoseNet();
  }, []);

  // Calculate angle between three points
  const calculateAngle = (pointA, pointB, pointC) => {
    const radians = Math.atan2(pointC.y - pointB.y, pointC.x - pointB.x) - 
                   Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x);
    let angle = Math.abs(radians * 180 / Math.PI);
    if (angle > 180) angle = 360 - angle;
    return angle;
  };

  // Calculate posture metrics
  const analyzePosture = useCallback((keypoints) => {
    if (keypoints.length < 17) return;

    const getKeypoint = (name) => keypoints.find(kp => kp.part === name);
    
    const nose = getKeypoint('nose');
    const leftShoulder = getKeypoint('leftShoulder');
    const rightShoulder = getKeypoint('rightShoulder');
    const leftElbow = getKeypoint('leftElbow');
    const rightElbow = getKeypoint('rightElbow');
    const leftWrist = getKeypoint('leftWrist');
    const rightWrist = getKeypoint('rightWrist');
    const leftHip = getKeypoint('leftHip');
    const rightHip = getKeypoint('rightHip');

    if (!nose || !leftShoulder || !rightShoulder || !leftHip || !rightHip) return;

    // Calculate key angles for drumming posture
    const newAngles = {};
    
    if (leftShoulder && leftElbow && leftWrist) {
      newAngles.leftElbow = calculateAngle(leftShoulder.position, leftElbow.position, leftWrist.position);
    }
    
    if (rightShoulder && rightElbow && rightWrist) {
      newAngles.rightElbow = calculateAngle(rightShoulder.position, rightElbow.position, rightWrist.position);
    }

    // Shoulder alignment
    const shoulderSlope = Math.abs(leftShoulder.position.y - rightShoulder.position.y);
    newAngles.shoulderAlignment = shoulderSlope < 20 ? 100 : Math.max(0, 100 - shoulderSlope);

    // Head position
    const shoulderMidpoint = {
      x: (leftShoulder.position.x + rightShoulder.position.x) / 2,
      y: (leftShoulder.position.y + rightShoulder.position.y) / 2
    };
    const headForward = Math.abs(nose.position.x - shoulderMidpoint.x);
    newAngles.headAlignment = headForward < 30 ? 100 : Math.max(0, 100 - headForward);

    // Spine alignment
    const hipMidpoint = {
      x: (leftHip.position.x + rightHip.position.x) / 2,
      y: (leftHip.position.y + rightHip.position.y) / 2
    };
    const spineDeviation = Math.abs(shoulderMidpoint.x - hipMidpoint.x);
    newAngles.spineAlignment = spineDeviation < 25 ? 100 : Math.max(0, 100 - spineDeviation);

    setAngles(newAngles);

    // Calculate overall posture score
    const scores = Object.values(newAngles).filter(val => !isNaN(val));
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    setPostureScore(Math.round(avgScore));

    // Determine posture quality
    if (avgScore >= 80) setPostureQuality('Good');
    else if (avgScore >= 60) setPostureQuality('Okay');
    else setPostureQuality('Poor');

    // Generate advice
    generateAdvice(newAngles);
  }, []);

  // Generate posture improvement advice
  const generateAdvice = (angles) => {
    const newAdvice = [];
    
    if (angles.shoulderAlignment < 80) {
      newAdvice.push('• Keep your shoulders level and relaxed');
    }
    if (angles.headAlignment < 80) {
      newAdvice.push('• Bring your head back over your shoulders');
    }
    if (angles.spineAlignment < 80) {
      newAdvice.push('• Straighten your spine and engage your core');
    }
    if (angles.leftElbow && angles.leftElbow < 90) {
      newAdvice.push('• Relax your left arm, avoid hunching');
    }
    if (angles.rightElbow && angles.rightElbow < 90) {
      newAdvice.push('• Relax your right arm, avoid hunching');
    }
    if (newAdvice.length === 0) {
      newAdvice.push('• Great posture! Keep it up!');
    }
    
    setAdvice(newAdvice);
  };

  // Optimised pose detection with minimal delay
  const detectPose = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || !netRef.current || !isDetecting) return;

    if (video.readyState === 4) {
      const pose = await netRef.current.estimateSinglePose(video, {
        flipHorizontal: false,
      });
      
      setPoses(pose.keypoints);
      analyzePosture(pose.keypoints);
      
      // Draw pose on canvas
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw keypoints
      pose.keypoints.forEach(keypoint => {
        if (keypoint.score > 0.5) {
          ctx.beginPath();
          ctx.arc(keypoint.position.x, keypoint.position.y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = '#00d4aa';
          ctx.fill();
        }
      });
    }
    
    // Use setTimeout for better performance
    setTimeout(detectPose, 50); // ~20 FPS for optimal performance
  }, [isDetecting, analyzePosture]);

  // Start webcam
  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Error accessing webcam:", err);
    }
  };

  // Control functions
  const startDetection = () => {
    setIsDetecting(true);
    detectPose();
  };

  const pauseDetection = () => {
    setIsDetecting(false);
  };

  const calibrate = () => {
    if (poses.length > 0) {
      setCalibrationData(poses);
      setIsCalibrated(true);
      alert('Calibration complete! Sit in this position for optimal posture tracking.');
    }
  };

  useEffect(() => {
    startVideo();
  }, []);

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif', 
      padding: '20px', 
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '10px', 
        padding: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          color: '#333', 
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          Advanced Posture Tracking Dashboard
        </h1>

        {/* Posture Metrics Dashboard */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div style={{
            backgroundColor: postureQuality === 'Good' ? '#4CAF50' : 
                           postureQuality === 'Okay' ? '#FF9800' : '#F44336',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3>Overall Score</h3>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{postureScore}%</div>
            <div>{postureQuality}</div>
          </div>
          
          <div style={{
            backgroundColor: '#2196F3',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3>Shoulder Alignment</h3>
            <div style={{ fontSize: '20px' }}>
              {angles.shoulderAlignment ? `${Math.round(angles.shoulderAlignment)}%` : 'N/A'}
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#9C27B0',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3>Head Position</h3>
            <div style={{ fontSize: '20px' }}>
              {angles.headAlignment ? `${Math.round(angles.headAlignment)}%` : 'N/A'}
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#FF5722',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3>Spine Alignment</h3>
            <div style={{ fontSize: '20px' }}>
              {angles.spineAlignment ? `${Math.round(angles.spineAlignment)}%` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <button
            onClick={startDetection}
            disabled={loading || isDetecting}
            style={{
              backgroundColor: '#00d4aa',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Loading...' : 'Start Detection'}
          </button>
          
          <button
            onClick={pauseDetection}
            disabled={!isDetecting}
            style={{
              backgroundColor: '#ff6b6b',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Pause
          </button>
          
          <button
            onClick={calibrate}
            disabled={!isDetecting}
            style={{
              backgroundColor: '#ffd93d',
              color: '#333',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Calibrate
          </button>
          
          <button
            onClick={() => setShowAdvice(!showAdvice)}
            style={{
              backgroundColor: '#6c5ce7',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {showAdvice ? 'Hide Advice' : 'Get Advice'}
          </button>
        </div>

        {/* Video and Canvas Container */}
        <div style={{ 
          position: 'relative', 
          display: 'flex', 
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            width="640"
            height="480"
            style={{ 
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}
          />
          <canvas
            ref={canvasRef}
            width="640"
            height="480"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none',
              borderRadius: '8px'
            }}
          />
        </div>

        {/* Advice Section */}
        {showAdvice && (
          <div style={{
            backgroundColor: '#e8f5e8',
            border: '1px solid #4CAF50',
            borderRadius: '8px',
            padding: '20px',
            marginTop: '20px'
          }}>
            <h3 style={{ color: '#2E7D32', marginBottom: '15px' }}>
              Posture Improvement Advice:
            </h3>
            <div style={{ color: '#2E7D32', lineHeight: '1.6' }}>
              {advice.map((tip, index) => (
                <div key={index}>{tip}</div>
              ))}
            </div>
          </div>
        )}

        {/* Drumming-specific angles */}
        {isDetecting && (
          <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '15px',
            marginTop: '20px'
          }}>
            <h3 style={{ color: '#333', marginBottom: '10px' }}>
              Drumming Posture Angles:
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
              {angles.leftElbow && (
                <div>Left Elbow: {Math.round(angles.leftElbow)}°</div>
              )}
              {angles.rightElbow && (
                <div>Right Elbow: {Math.round(angles.rightElbow)}°</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PoseTracking;

// Video Element: Creates a video element that connects to the webcam (videoRef).
// PoseNet Setup: PoseNet is loaded asynchronously, and once loaded, it continuously estimates the poses on each video frame.
// Keypoint Detection: Use net.estimateSinglePose to get the positions of various body parts, and store those keypoints in the poses state.
// Rendering Pose Data: The detected keypoints (e.g., wrist, elbow, nose) are displayed in the component's UI.