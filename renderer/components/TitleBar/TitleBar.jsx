import React from 'react';
import { IoRemoveOutline, IoSquareOutline, IoCloseOutline } from "react-icons/io5"; 
import './TitleBar.css'; 

export default function TitleBar() {  
  const handleMinimize = () => {
    window.api?.send("window:minimize");
  };

  const handleMaximize = () => {
    window.api?.send("window:maximize");
  };

  const handleClose = () => {
    window.api?.send("window:close");
  };

  return (
    <div className="titlebar-container">
      <div className="drag-region">
        <span className="title-text">Zenith Stream</span>
      </div>
      <div className="controls">
        <button onClick={handleMinimize} className="control-btn" title="Küçült">
           <IoRemoveOutline size={18} />
        </button>
        
        <button onClick={handleMaximize} className="control-btn" title="Büyüt">
           <IoSquareOutline size={16} />
        </button>
        
        <button onClick={handleClose} className="control-btn close-btn" title="Kapat">
           <IoCloseOutline size={20} />
        </button>
      </div>
    </div>
  );
}