import React, { useState, useRef, useEffect, useCallback } from 'react';
import PostureDashboard from './PostureDashboard';
import './App.css';

// import TensorFlow.js and PoseNet
import * as tf from '@tensorflow/tfjs';
import { load } from '@tensorflow-models/posenet';

function App() {
  const [postureFeedback, setPostureFeedback] = useState('Analysing your drumming posture...');
  const [postureScore, setPostureScore] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const netRef = useRef(null);

  // calculate angle between three points
  const calculateAngle = useCallback((x1, y1, x2, y2, x3, y3) => {
    const angle1 = Math.atan2(y1 - y2, x1 - x2);
    const angle2 = Math.atan2(y3 - y2, x3 - x2);
    let angle = (angle2 - angle1) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    return angle > 180 ? 360 - angle : angle;
  }, []);

  // draw pose keypoints and skeleton on canvas
  const drawPose = useCallback((pose, canvas, ctx) => {
    if (!canvas || !ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // make canvas transparent to show video underneath
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, width, height);

    // draw keypoints
    pose.keypoints.forEach((keypoint) => {
      if (keypoint.score > 0.5) {
        const { x, y } = keypoint.position;
        
        // draw dot
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        
        // colour important points for drumming posture
        if (keypoint.part.includes('shoulder') || keypoint.part === 'nose') {
          ctx.fillStyle = '#FF0000'; // red for upper body alignment
        } else if (keypoint.part.includes('wrist') || keypoint.part.includes('elbow')) {
          ctx.fillStyle = '#00FF00'; // green for arms/stick control
        } else if (keypoint.part.includes('hip') || keypoint.part.includes('knee') || keypoint.part.includes('ankle')) {
          ctx.fillStyle = '#0000FF'; // blue for lower body/pedal control
        } else {
          ctx.fillStyle = '#FFFF00'; // yellow for other points
        }
        ctx.fill();
        
        // label key points for drummers
        if (['leftShoulder', 'rightShoulder', 'leftWrist', 'rightWrist', 'leftElbow', 'rightElbow',
             'leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle', 'nose'].includes(keypoint.part)) {
          ctx.fillStyle = 'white';
          ctx.font = '12px Arial';
          ctx.fillText(keypoint.part, x + 10, y);
        }
      }
    });

    // define skeleton connections relevant for drummers
    const skeleton = [
      ['leftShoulder', 'rightShoulder'], // upper torso alignment
      ['leftShoulder', 'leftElbow'],     // left arm
      ['leftElbow', 'leftWrist'],        // left forearm (stick control)
      ['rightShoulder', 'rightElbow'],   // right arm
      ['rightElbow', 'rightWrist'],      // right forearm (stick control)
      ['leftShoulder', 'leftHip'],       // left torso
      ['rightShoulder', 'rightHip'],     // right torso
      ['leftHip', 'rightHip'],           // hip alignment
      ['leftHip', 'leftKnee'],           // left thigh (for hi-hat/bass pedal)
      ['rightHip', 'rightKnee'],         // right thigh (for hi-hat/bass pedal)
      ['leftKnee', 'leftAnkle'],         // left shin (foot control)
      ['rightKnee', 'rightAnkle'],       // right shin (foot control)
      ['nose', 'leftShoulder'],          // head position left
      ['nose', 'rightShoulder']          // head position right
    ];

    // draw skeleton
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;

    skeleton.forEach(([startPoint, endPoint]) => {
      const start = pose.keypoints.find(kp => kp.part === startPoint);
      const end = pose.keypoints.find(kp => kp.part === endPoint);

      if (start && end && start.score > 0.5 && end.score > 0.5) {
        ctx.beginPath();
        ctx.moveTo(start.position.x, start.position.y);
        ctx.lineTo(end.position.x, end.position.y);
        ctx.stroke();
      }
    });

    // draw spine (vertical line connecting midpoints)
    const leftShoulder = pose.keypoints.find(kp => kp.part === 'leftShoulder');
    const rightShoulder = pose.keypoints.find(kp => kp.part === 'rightShoulder');
    const leftHip = pose.keypoints.find(kp => kp.part === 'leftHip');
    const rightHip = pose.keypoints.find(kp => kp.part === 'rightHip');

    if (leftShoulder && rightShoulder && leftHip && rightHip &&
        leftShoulder.score > 0.5 && rightShoulder.score > 0.5 &&
        leftHip.score > 0.5 && rightHip.score > 0.5) {
      
      // calculate midpoints
      const shoulderMidX = (leftShoulder.position.x + rightShoulder.position.x) / 2;
      const shoulderMidY = (leftShoulder.position.y + rightShoulder.position.y) / 2;
      const hipMidX = (leftHip.position.x + rightHip.position.x) / 2;
      const hipMidY = (leftHip.position.y + rightHip.position.y) / 2;

      // draw spine line
      ctx.beginPath();
      ctx.strokeStyle = '#FF00FF'; // magenta for spine
      ctx.lineWidth = 3;
      ctx.moveTo(shoulderMidX, shoulderMidY);
      ctx.lineTo(hipMidX, hipMidY);
      ctx.stroke();
      
      // label spine
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.fillText('Spine', (shoulderMidX + hipMidX) / 2 + 10, (shoulderMidY + hipMidY) / 2);
    }

    // draw arm angles (important for drummers)
    const drawAngle = (joint1, joint2, joint3, label) => {
      const j1 = pose.keypoints.find(kp => kp.part === joint1);
      const j2 = pose.keypoints.find(kp => kp.part === joint2);
      const j3 = pose.keypoints.find(kp => kp.part === joint3);
      
      if (j1 && j2 && j3 && j1.score > 0.5 && j2.score > 0.5 && j3.score > 0.5) {
        // calculate angle
        const angle = calculateAngle(
          j1.position.x, j1.position.y,
          j2.position.x, j2.position.y,
          j3.position.x, j3.position.y
        );
        
        // draw angle arc
        ctx.beginPath();
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 1;
        ctx.arc(j2.position.x, j2.position.y, 20, 
          Math.atan2(j1.position.y - j2.position.y, j1.position.x - j2.position.x),
          Math.atan2(j3.position.y - j2.position.y, j3.position.x - j2.position.x)
        );
        ctx.stroke();
        
        // label angle
        ctx.fillStyle = 'yellow';
        ctx.font = '12px Arial';
        ctx.fillText(`${label}: ${angle.toFixed(0)}°`, j2.position.x + 25, j2.position.y);
      }
    };
    
    // draw important angles for drummers
    drawAngle('leftShoulder', 'leftElbow', 'leftWrist', 'L-Arm');
    drawAngle('rightShoulder', 'rightElbow', 'rightWrist', 'R-Arm');
    drawAngle('leftHip', 'leftKnee', 'leftAnkle', 'L-Leg');
    drawAngle('rightHip', 'rightKnee', 'rightAnkle', 'R-Leg');

    // draw calibration reference if available
    if (calibrationPoints) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      
      // draw reference lines for key points
      if (calibrationPoints.shoulderLevel) {
        ctx.beginPath();
        ctx.moveTo(0, calibrationPoints.shoulderLevel);
        ctx.lineTo(width, calibrationPoints.shoulderLevel);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText("Ideal Shoulder Level", 10, calibrationPoints.shoulderLevel - 5);
      }
      
      if (calibrationPoints.seatLevel) {
        ctx.beginPath();
        ctx.moveTo(0, calibrationPoints.seatLevel);
        ctx.lineTo(width, calibrationPoints.seatLevel);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText("Ideal Seat Level", 10, calibrationPoints.seatLevel - 5);
      }
      
      ctx.setLineDash([]);
    }
  }, [calibrationPoints, calculateAngle]);

  // calculate drummer's posture score
  const calculateDrummerPostureScore = useCallback((pose) => {
    const leftShoulder = pose.keypoints.find((point) => point.part === 'leftShoulder');
    const rightShoulder = pose.keypoints.find((point) => point.part === 'rightShoulder');
    const leftHip = pose.keypoints.find((point) => point.part === 'leftHip');
    const rightHip = pose.keypoints.find((point) => point.part === 'rightHip');
    const leftElbow = pose.keypoints.find((point) => point.part === 'leftElbow');
    const rightElbow = pose.keypoints.find((point) => point.part === 'rightElbow');
    const leftWrist = pose.keypoints.find((point) => point.part === 'leftWrist');
    const rightWrist = pose.keypoints.find((point) => point.part === 'rightWrist');
    const leftKnee = pose.keypoints.find((point) => point.part === 'leftKnee');
    const rightKnee = pose.keypoints.find((point) => point.part === 'rightKnee');
    const nose = pose.keypoints.find((point) => point.part === 'nose');

    let score = 5; // default middle score
    let feedback = [];

    // check if key points are detected with sufficient confidence
    if (leftShoulder && rightShoulder && leftHip && rightHip && 
        leftShoulder.score > 0.6 && rightShoulder.score > 0.6 && 
        leftHip.score > 0.6 && rightHip.score > 0.6) {
      
      // start with perfect score and deduct based on issues
      score = 10;
      
      // 1. check shoulder alignment (horizontal) (important for balanced playing)
      const shoulderSlope = Math.abs(
        (rightShoulder.position.y - leftShoulder.position.y) / 
        Math.max(1, Math.abs(rightShoulder.position.x - leftShoulder.position.x))
      );
      
      if (shoulderSlope > 0.1) {
        score -= 2 * shoulderSlope;
        feedback.push("Uneven shoulders - affects consistent stick height");
      }
      
      // 2. calculate spine angle (slightly forward but not too much)
      const shoulderMidX = (leftShoulder.position.x + rightShoulder.position.x) / 2;
      const shoulderMidY = (leftShoulder.position.y + rightShoulder.position.y) / 2;
      const hipMidX = (leftHip.position.x + rightHip.position.x) / 2;
      const hipMidY = (leftHip.position.y + rightHip.position.y) / 2;
      
      const spineAngle = Math.atan2(
        hipMidX - shoulderMidX,
        shoulderMidY - hipMidY
      ) * (180 / Math.PI);
      
      // for drummers, a slight forward lean (5-15 degrees) is ideal 
      if (spineAngle < -15 || spineAngle > 25) {
        score -= 1.5;
        if (spineAngle < 0) {
          feedback.push("Leaning too far back - restricts arm movement");
        } else {
          feedback.push("Leaning too far forward - may cause back strain");
        }
      }
      
      // 3. check head position relative to shoulders (avoid craning neck)
      if (nose && nose.score > 0.6) {
        const headForwardPosition = nose.position.x - shoulderMidX;
        if (headForwardPosition > 50) {
          score -= 1;
          feedback.push("Head too far forward - may cause neck strain");
        }
      }
    }
    
    // 4. check arm positioning and angles for drumming
    if (leftElbow && rightElbow && leftWrist && rightWrist && leftShoulder && rightShoulder &&
        leftElbow.score > 0.6 && rightElbow.score > 0.6 &&
        leftWrist.score > 0.6 && rightWrist.score > 0.6 &&
        leftShoulder.score > 0.6 && rightShoulder.score > 0.6) {
        
      // calculate elbow angles (should be around 90 degrees while at rest)
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
      
      // ideal drumming arm angle range (70-110 degrees for most playing positions)
      if (leftElbowAngle < 70 || leftElbowAngle > 110) {
        score -= 1;
        feedback.push("Left arm angle suboptimal for stick control");
      }
      
      if (rightElbowAngle < 70 || rightElbowAngle > 110) {
        score -= 1;
        feedback.push("Right arm angle suboptimal for stick control");
      }
      
      // check if elbows are too close or too far from body
      const leftElbowDistance = Math.abs(leftElbow.position.x - leftShoulder.position.x);
      const rightElbowDistance = Math.abs(rightElbow.position.x - rightShoulder.position.x);
      
      if (leftElbowDistance < 30 || leftElbowDistance > 120) {
        score -= 1;
        feedback.push(leftElbowDistance < 30 ? 
                     "Left elbow too close to body - restricts movement" : 
                     "Left elbow too far from body - reduces power");
      }
      
      if (rightElbowDistance < 30 || rightElbowDistance > 120) {
        score -= 1;
        feedback.push(rightElbowDistance < 30 ? 
                     "Right elbow too close to body - restricts movement" : 
                     "Right elbow too far from body - reduces power");
      }
    }
    
    // 5. check leg position for pedal control (if visible)
    if (leftHip && leftKnee && rightHip && rightKnee &&
        leftHip.score > 0.6 && leftKnee.score > 0.6 &&
        rightHip.score > 0.6 && rightKnee.score > 0.6) {
      
      // calculate hip-knee angles (should be approximately 90 degrees when seated)
      const leftHipAngle = calculateAngle(
        leftShoulder.position.x, leftShoulder.position.y,
        leftHip.position.x, leftHip.position.y,
        leftKnee.position.x, leftKnee.position.y
      );
      
      const rightHipAngle = calculateAngle(
        rightShoulder.position.x, rightShoulder.position.y,
        rightHip.position.x, rightHip.position.y,
        rightKnee.position.x, rightKnee.position.y
      );
      
      // ideal seated drumming position (80-100 degrees)
      if (leftHipAngle < 80 || leftHipAngle > 110) {
        score -= 0.75;
        feedback.push("Left leg position may affect pedal control");
      }
      
      if (rightHipAngle < 80 || rightHipAngle > 110) {
        score -= 0.75;
        feedback.push("Right leg position may affect pedal control");
      }
    }
    
    // ensure score is within bounds
    score = Math.max(0, Math.min(10, score));
    
    // add drumming-specific posture advice
    if (score >= 8) {
      feedback.unshift("Good drumming posture");
    } else if (score >= 5) {
      feedback.unshift("Moderate drumming posture issues");
    } else {
      feedback.unshift("Significant drumming posture issues");
    }
    
    return {
      score: score.toFixed(1),
      feedback: feedback.length > 0 ? feedback.join(". ") : "Good drumming posture!"
    };
  }, [calculateAngle]);

  // continuous detection loop
  const detectPoseFrame = useCallback(async () => {
    if (!netRef.current || !videoRef.current || !canvasRef.current || !isDetecting) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // estimate pose
      const pose = await netRef.current.estimateSinglePose(video, {
        flipHorizontal: false,
      });

      // draw pose on canvas
      drawPose(pose, canvas, ctx);

      // only calculate and update posture metrics if not in calibration mode
      if (!calibrationMode) {
        // calculate drummer-specific posture metrics
        const postureResults = calculateDrummerPostureScore(pose);
        setPostureScore(Number(postureResults.score));
        setPostureFeedback(postureResults.feedback);
      }

      // continue the detection loop
      requestRef.current = requestAnimationFrame(detectPoseFrame);
    } catch (error) {
      console.error('Error in pose detection frame:', error);
    }
  }, [isDetecting, calibrationMode, drawPose, calculateDrummerPostureScore]);

  // start video stream
  const startVideoStream = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) {
      console.error('Video or canvas element is null');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      // adjust canvas to match video dimensions
      video.srcObject = stream;
      
      // listen for the 'loadedmetadata' event to set up canvas and start detection
      video.onloadedmetadata = () => {
        console.log('Video metadata loaded');
        
        video.play();
        
        // set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        setIsLoading(false);
        setIsDetecting(true);
      };
    } catch (error) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        console.error('Permission denied to access webcam:', error);
        setPostureFeedback('Please allow access to the webcam to analyse your drumming posture.');
      } else {
        console.error('Error accessing webcam:', error);
        setPostureFeedback('Error accessing webcam. Please check your camera.');
      }
      setIsLoading(false);
    }
  }, []);

  // initialise PoseNet and start detection
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        await tf.ready();
        
        // configure PoseNet for better accuracy
        netRef.current = await load({
          architecture: 'MobileNetV1',
          outputStride: 16,
          inputResolution: { width: 640, height: 480 },
          multiplier: 0.75,
          quantBytes: 2
        });
        
        console.log('PoseNet model loaded');
        await startVideoStream();
      } catch (error) {
        console.error('Error initializing:', error);
        setPostureFeedback('Error loading posture detection. Please refresh the page.');
        setIsLoading(false);
      }
    };

    initialize();

    // clean up function
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      
      // stop all video tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const videoTracks = videoRef.current.srcObject.getTracks();
        if (videoTracks) {
          videoTracks.forEach(track => track.stop());
        }
      }
    };
  }, [startVideoStream]);

  // start/stop detection loop when isDetecting changes
  useEffect(() => {
    if (isDetecting) {
      requestRef.current = requestAnimationFrame(detectPoseFrame);
    } else if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isDetecting, detectPoseFrame]);

  // calibrate ideal posture for the current setup
  const calibratePosture = () => {
    if (!isDetecting || !netRef.current || !videoRef.current) {
      setPostureFeedback("Please start detection first before calibrating");
      return;
    }
    
    setCalibrationMode(true);
    setPostureFeedback("Please sit in your ideal drumming position, then click 'Save Calibration'");
  };

  // save the current posture as the calibration reference
  const saveCalibration = async () => {
    if (!netRef.current || !videoRef.current) return;
    
    try {
      const pose = await netRef.current.estimateSinglePose(videoRef.current, {
        flipHorizontal: false,
      });
      
      // extract key reference points
      const leftShoulder = pose.keypoints.find(point => point.part === 'leftShoulder');
      const rightShoulder = pose.keypoints.find(point => point.part === 'rightShoulder');
      const leftHip = pose.keypoints.find(point => point.part === 'leftHip');
      const rightHip = pose.keypoints.find(point => point.part === 'rightHip');
      
      if (leftShoulder && rightShoulder && leftHip && rightHip &&
          leftShoulder.score > 0.6 && rightShoulder.score > 0.6 &&
          leftHip.score > 0.6 && rightHip.score > 0.6) {
        
        // calculate reference levels
        const shoulderLevel = (leftShoulder.position.y + rightShoulder.position.y) / 2;
        const seatLevel = (leftHip.position.y + rightHip.position.y) / 2;
        
        setCalibrationPoints({
          shoulderLevel,
          seatLevel,
          shoulderWidth: Math.abs(rightShoulder.position.x - leftShoulder.position.x),
          hipWidth: Math.abs(rightHip.position.x - leftHip.position.x)
        });
        
        setPostureFeedback("Calibration saved! This is now your reference posture.");
      } else {
        setPostureFeedback("Couldn't detect all required points. Please try again.");
      }
    } catch (error) {
      console.error("Calibration error:", error);
      setPostureFeedback("Error during calibration. Please try again.");
    }
    
    setCalibrationMode(false);
  };

  // toggle detection on/off
  const toggleDetection = () => {
    setIsDetecting(prev => !prev);
  };

  // get colour based on posture score
  const getPostureScoreColor = () => {
    const score = Number(postureScore);
    if (score >= 8) return '#00FF00'; // good - green
    if (score >= 5) return '#FFFF00'; // okay - yellow
    return '#FF0000'; // poor - red
  };

  return (
    <div className="App">
      <div className="dashboard-container">
        <div className="header">
          <h1>Drummer's Posture Analysis</h1>
          <p>Analyse your drumming posture in real-time</p>
        </div>
        
        <PostureDashboard score={postureScore} />
        
        <div className="video-container">
          {isLoading && <div className="loading-overlay">Loading drumming posture detection...</div>}

          <div className="video-wrapper" style={{ position: 'relative', maxWidth: '500px', margin: '0 auto' }}>
            {/* video element with constrained size */}
  <         video
              ref={videoRef}
              width="640"
              height="480"
              autoPlay
              muted
              style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'contain' }}
            />
  
            {/* canvas for drawing pose (positioned over video) */}
            <canvas 
              ref={canvasRef}
              width="640"
              height="480"
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                border: '2px solid black'
              }}
            />
          </div>
          
          <div className="controls">
            <button onClick={toggleDetection} className="control-button">
              {isDetecting ? 'Pause Detection' : 'Start Detection'}
            </button>
            
            {!calibrationMode ? (
              <button onClick={calibratePosture} className="control-button calibrate-button">
                Calibrate Ideal Posture
              </button>
            ) : (
              <button onClick={saveCalibration} className="control-button save-button">
                Save Calibration
              </button>
            )}
          </div>
        </div>
        
        <div className="posture-feedback" style={{ backgroundColor: getPostureScoreColor() }}>
          <h3>Drumming Posture Score: {postureScore}/10</h3>
          <p>{postureFeedback}</p>
        </div>
      </div>
    </div>
  );
}

export default App;
