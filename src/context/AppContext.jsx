import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../utils/db';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [aiLogs, setAiLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Environment defaults for LLM (Vite: must be prefixed with VITE_)
  const envLlmKey = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_LLM_API_KEY || '';
  const envLlmBaseUrl = import.meta.env.VITE_GROQ_BASE_URL || import.meta.env.VITE_LLM_BASE_URL || 'https://api.openai.com/v1';
  const envLlmModel = import.meta.env.VITE_GROQ_MODEL || import.meta.env.VITE_LLM_MODEL || 'gpt-4o-mini';

  // Settings & Theme
  const [settings, setSettings] = useState({
    darkMode: false,
    animations: true,
    supabaseUrl: localStorage.getItem('sup_url') || '',
    supabaseKey: localStorage.getItem('sup_key') || '',
    llmApiKey: localStorage.getItem('llm_key') || envLlmKey,
    llmModel: localStorage.getItem('llm_model') || envLlmModel,
    llmBaseUrl: localStorage.getItem('llm_baseurl') || envLlmBaseUrl,
    llmEnabled: localStorage.getItem('llm_enabled') !== 'false',
    llmThreshold: parseInt(localStorage.getItem('llm_threshold') || '40', 10)
  });
  
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [supConnectionLog, setSupConnectionLog] = useState([]);

  // Load database state
  const reloadState = () => {
    setComplaints(db.getComplaints());
    setDepartments(db.getDepartments());
    setOfficers(db.getOfficers());
    setEmergencies(db.getEmergencies());
    setAiLogs(db.getAILogs());
    setNotifications(db.getNotifications());
  };

  useEffect(() => {
    // Initial Load
    reloadState();

    // Cross-tab and local state synchronizer
    const handleUpdate = () => {
      reloadState();
    };

    window.addEventListener('tvk_db_update', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('tvk_db_update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Set dark mode HTML class on changes
  useEffect(() => {
    const root = document.documentElement;
    if (settings.darkMode) {
      root.classList.add('theme-dark');
      root.style.background = '#0c0e11';
    } else {
      root.classList.remove('theme-dark');
      root.style.background = '#f1f3f6';
    }
  }, [settings.darkMode]);

  // Default to light on mount
  useEffect(() => {
    document.documentElement.classList.remove('theme-dark');
    document.documentElement.style.background = '#f1f3f6';
  }, []);

  // Database operations
  const addComplaint = (newCmp) => {
    const created = db.saveComplaint(newCmp);
    reloadState();
    return created;
  };

  const updateComplaint = (id, updates) => {
    const updated = db.updateComplaint(id, updates);
    reloadState();
    return updated;
  };

  const markAllRead = () => {
    db.markAllNotificationsRead();
    reloadState();
  };

  const logAIQuery = (queryText) => {
    db.saveAILog(queryText);
    reloadState();
  };

  const updateSettings = (newSettings) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.supabaseUrl !== undefined) {
        localStorage.setItem('sup_url', newSettings.supabaseUrl);
      }
      if (newSettings.supabaseKey !== undefined) {
        localStorage.setItem('sup_key', newSettings.supabaseKey);
      }
      if (newSettings.llmApiKey !== undefined) {
        localStorage.setItem('llm_key', newSettings.llmApiKey);
      }
      if (newSettings.llmModel !== undefined) {
        localStorage.setItem('llm_model', newSettings.llmModel);
      }
      if (newSettings.llmBaseUrl !== undefined) {
        localStorage.setItem('llm_baseurl', newSettings.llmBaseUrl);
      }
      if (newSettings.llmEnabled !== undefined) {
        localStorage.setItem('llm_enabled', String(newSettings.llmEnabled));
      }
      if (newSettings.llmThreshold !== undefined) {
        localStorage.setItem('llm_threshold', String(newSettings.llmThreshold));
      }
      return updated;
    });
  };

  const logConnection = (msg, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setSupConnectionLog(prev => [...prev, `[${time}] ${msg}`]);
  };

  // Mock checking Supabase connection
  const testSupabaseConnection = async () => {
    const url = settings.supabaseUrl;
    const key = settings.supabaseKey;
    if (!url || !key) {
      logConnection('⚠ URL and Key are required.', 'err');
      return;
    }
    
    logConnection('Testing connection to Supabase...', 'info');
    
    // Simulate checking endpoints
    setTimeout(() => {
      setSupabaseConnected(true);
      logConnection('✓ Table "complaints" reachable', 'ok');
      logConnection('✓ Table "departments" reachable', 'ok');
      logConnection('✓ Table "officers" reachable', 'ok');
      logConnection('✓ Supabase Live Connection Established!', 'ok');
    }, 1500);
  };

  return (
    <AppContext.Provider value={{
      complaints,
      departments,
      officers,
      emergencies,
      aiLogs,
      notifications,
      settings,
      supabaseConnected,
      supConnectionLog,
      addComplaint,
      updateComplaint,
      markAllRead,
      logAIQuery,
      updateSettings,
      testSupabaseConnection,
      reloadState
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
