import React, { useEffect, useRef, useState } from 'react';
import * as posenet from '@tensorflow-models/posenet';
import * as tf from '@tensorflow/tfjs';

const PoseTracking = () => {
  const videoRef = useRef(null);
  const [poses, setPoses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPoseNet = async () => {
      await tf.setBackend('webgl'); //optionally set backend
      const net = await posenet.load();
      setLoading(false);
      detectPose(net);
    };

    loadPoseNet();
  }, []);

  const detectPose = async (net) => {
    const video = videoRef.current;

    const detect = async () => {
      if (video && video.readyState === 4) {
        const pose = await net.estimateSinglePose(video, {
          flipHorizontal: false,
        });
        setPoses(pose.keypoints); // store pose data
      }
      requestAnimationFrame(detect); // keep detecting
    };

    detect();
  };

  const startVideo = () => {
    const video = videoRef.current;
    navigator.mediaDevices
      .getUserMedia({
        video: true,
      })
      .then((stream) => {
        video.srcObject = stream;
      })
      .catch((err) => {
        console.error("Error accessing webcam:", err);
      });
  };

  useEffect(() => {
    startVideo();
  }, []);

  return (
    <div>
      <h1>PoseNet Body Pose Tracking</h1>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        width="640"
        height="480"
        style={{ border: '1px solid black' }}
      />
      {loading ? (
        <p>Loading PoseNet model...</p>
      ) : (
        <div>
          <h3>Detected Poses:</h3>
          <ul>
            {poses.map((point, index) => (
              <li key={index}>
                {point.part}: ({point.position.x.toFixed(2)}, {point.position.y.toFixed(2)})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PoseTracking;

// Video Element: Creates a video element that connects to the webcam (videoRef).
// PoseNet Setup: PoseNet is loaded asynchronously, and once loaded, it continuously estimates the poses on each video frame.
// Keypoint Detection: Use net.estimateSinglePose to get the positions of various body parts, and store those keypoints in the poses state.
// Rendering Pose Data: The detected keypoints (e.g., wrist, elbow, nose) are displayed in the component's UI.
