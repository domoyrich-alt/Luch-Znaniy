import React from 'react';
import ChatList from '../Chat/ChatList';
import ChatWindow from '../Chat/ChatWindow';
import './MainLayout.css';

const MainLayout = () => {
  return (
    <div className="main-layout">
      <div className="main-layout-sidebar">
        <ChatList />
      </div>
      <div className="main-layout-content">
        <ChatWindow />
      </div>
    </div>
  );
};

export default MainLayout;
