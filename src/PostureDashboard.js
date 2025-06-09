import React from 'react';
import './PostureDashboard.css';

const PostureDashboard = ({ score }) => {
  const normalizedScore = Math.min(10, Math.max(0, parseFloat(score) || 0));
  const rotation = (normalizedScore / 10) * 180 - 90; // map 0-10 to -90 to 90 degrees
  
  // define colour based on score
  const getColor = () => {
    if (normalizedScore >= 8) return '#4CAF50'; // green
    if (normalizedScore >= 5) return '#FFC107'; // yellow/amber
    return '#F44336'; // red
  };

  return (
    <div className="posture-dashboard">
      <div className="meter-container">
        <div className="meter">
          <div className="meter-scale">
            <div className="poor">Poor</div>
            <div className="moderate">Moderate</div>
            <div className="good">Good</div>
          </div>
          <div className="needle" style={{ transform: `rotate(${rotation}deg)`, backgroundColor: getColor() }}></div>
          <div className="meter-center"></div>
        </div>
        <div className="score-display">{normalizedScore.toFixed(1)}</div>
        <div className="score-label">Posture Score</div>
      </div>
    </div>
  );
};

export default PostureDashboard;
