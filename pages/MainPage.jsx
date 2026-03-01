"use client";

import React, { useState } from 'react';
import AudioBubble from '../components/AudioBubble.jsx';
import ConnectionStatus from '../components/ConnectionStatus.jsx';
import GraphPanel from '../components/GraphPanel.jsx';
import TranscriptPanel from '../components/TranscriptPanel.jsx';
import VoicePanel from '../components/VoicePanel.jsx';

function MainPage() {
  // --- UI State ---
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'graph'

  // --- Mock Data (To be replaced by useSession/useGraphState hooks later) ---
  const mockConnection = { backend: "connected", evi: "connected", lastError: null };
  
  const mockTranscript = [
    { messageId: "1", role: "user", text: "Hello world now what your session?", interim: false },
    { messageId: "2", role: "assistant", text: "What is the orb visualizer?", interim: false },
    { messageId: "3", role: "user", text: "Hey, what's your session?", interim: false },
    { messageId: "4", role: "assistant", text: "How would you talk about help?", interim: false },
    { messageId: "5", role: "user", text: "I'm thinking about...", interim: true },
  ];
  
  const mockGraph = {
    nodes: [
      { id: "n1", label: "PERSON", canonical: "User" },
      { id: "n2", label: "EMOTION", canonical: "Curiosity" },
      { id: "n3", label: "TOPIC", canonical: "Orb Visualizer" }
    ],
    edges: [
      { id: "e1", sourceId: "n1", targetId: "n2", type: "FEELS" },
      { id: "e2", sourceId: "n1", targetId: "n3", type: "ASKED_ABOUT" }
    ]
  };

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      
      {/* 1. LEFT SIDEBAR */}
      <div className="w-64 bg-[#FAFAFA] flex flex-col h-full border-r border-gray-100 p-5 shrink-0">
        
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 px-1">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#4E9F76] to-[#2D6A4B]"></div>
          <span className="font-bold text-xl text-gray-800">Orbital</span>
        </div>

        {/* New Session Button */}
        <button className="w-full bg-[#5BA87F] text-white rounded-full py-2.5 mb-6 font-medium shadow-sm hover:bg-[#4d916d] transition-colors flex items-center justify-center gap-2">
          <span className="text-lg font-light">+</span> New Session
        </button>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
          {[19, 18, 17, 16, 15, 14, 13, 12, 11].map((num) => (
            <div 
              key={num} 
              className={`flex items-center justify-between px-4 py-2.5 rounded-2xl cursor-pointer transition-colors ${
                num === 19 
                  ? 'bg-[#E5EFE9] text-[#2C5F43] font-medium' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <span className="text-sm">Session {num}</span>
              <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          ))}
        </div>

        {/* Connection Status Panel */}
        <div className="mt-4 shrink-0">
          <ConnectionStatus connection={mockConnection} />
        </div>

        {/* Footer (Logout) */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between px-2 text-gray-500 shrink-0">
          <button className="flex items-center gap-2 hover:text-gray-800 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="text-sm font-medium underline underline-offset-2">log out</span>
          </button>
          <button className="hover:text-gray-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>
      </div>

      {/* 2. CENTER AREA (Visualizer & Voice Controls) */}
      <div className="flex-1 flex flex-col items-center justify-between relative bg-white overflow-hidden pb-12">
        
        {/* The 3D Orb (Now stacked above) */}
        <div className="w-full flex-1 flex items-center justify-center pt-10 min-h-[400px]">
          <div className="w-full max-w-2xl h-[600px]">
            <AudioBubble />
          </div>
        </div>

        {/* Voice Control Panel (Now sitting beneath the orb) */}
        <div className="w-full max-w-xl px-8 z-10 shrink-0">
          <VoicePanel sessionId="sess_12345abcde" />
        </div>

      </div>

      {/* 3. RIGHT SIDEBAR (Dynamic Tab Interface) */}
      <div className="w-[420px] bg-[#FAFAFA] flex flex-col h-full border-l border-gray-100 p-6 shrink-0">
        
        {/* Chat / Graph Toggle */}
        <div className="flex bg-[#EFEFEF] p-1.5 rounded-full mb-6 shrink-0 relative">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'chat' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Chat
          </button>
          <button 
            onClick={() => setActiveTab('graph')}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'graph' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Knowledge Graph
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-4">
          
          {activeTab === 'chat' && (
            <div className="flex-1 min-h-0">
              <TranscriptPanel entries={mockTranscript} showInterim={true} />
            </div>
          )}

          {activeTab === 'graph' && (
            <div className="flex-1 min-h-0">
              {/* Passed null to selectedReceiptId since we removed the receipts panel */}
              <GraphPanel graph={mockGraph} selectedReceiptId={null} />
            </div>
          )}

        </div>
      </div>

    </div>
  );
}

export default MainPage;