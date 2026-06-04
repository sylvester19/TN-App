import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { detectDepartment, routeComplaint, DEPARTMENTS } from '../utils/nlpRouting';
import { 
  Home, Clipboard, Bot, User, Bell, ArrowLeft, Camera, 
  Check, ChevronRight, MapPin, AlertTriangle, Search, Mic, 
  Send, PhoneCall, Award, Settings, ShieldAlert, CheckCircle2, X
} from 'lucide-react';

export default function UserApp() {
  const { 
    complaints, 
    notifications, 
    addComplaint, 
    logAIQuery,
    settings
  } = useApp();

  const [activeScreen, setActiveScreen] = useState('splash');
  const [screenHistory, setScreenHistory] = useState(['splash']);
  
  // Navigation helper
  const navigate = (screen) => {
    setScreenHistory(prev => [...prev, screen]);
    setActiveScreen(screen);
  };

  const navigateBack = () => {
    if (screenHistory.length > 1) {
      const nextHistory = [...screenHistory];
      nextHistory.pop(); // remove current
      const prev = nextHistory[nextHistory.length - 1];
      setScreenHistory(nextHistory);
      setActiveScreen(prev || 'home');
    } else {
      setActiveScreen('home');
    }
  };

  // ----------------------------------------------------
  // AI CHATBOT STATE & LOGIC
  // ----------------------------------------------------
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'வணக்கம்! I am your Tamil Nadu AI Citizen Assistant. Tell me what issue you are facing or ask about government schemes. I will automatically detect the department!' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [detectedCategory, setDetectedCategory] = useState(null);
  const [voiceLang, setVoiceLang] = useState('en-IN'); // 'en-IN' or 'ta-IN'
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const micTimeoutRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping]);

  // Hook NLP detection to text input changing
  const handleChatInputChange = (e) => {
    const text = e.target.value;
    setChatInput(text);
    if (text.length > 3) {
      const detection = detectDepartment(text);
      if (detection.confidence > 15) {
        setDetectedCategory(detection);
      } else {
        setDetectedCategory(null);
      }
    } else {
      setDetectedCategory(null);
    }
  };

  const triggerAIResponse = async (userText) => {
    setIsTyping(true);
    logAIQuery(userText);

    const llmConfig = settings.llmEnabled && settings.llmApiKey ? {
      apiKey: settings.llmApiKey,
      model: settings.llmModel,
      baseUrl: settings.llmBaseUrl
    } : null;

    let detection;
    try {
      detection = await routeComplaint(userText, llmConfig, settings.llmThreshold);
    } catch (err) {
      console.warn('Routing error:', err);
      detection = detectDepartment(userText);
    }

    setIsTyping(false);
    let reply = '';
    const sourceLabel = detection.source === 'llm' ? ' (AI-enhanced)' : '';

    if (detection.confidence >= 40) {
      const reasonText = detection.reason ? `Reason: ${detection.reason}` : '';
      reply = `I've analyzed your message and auto-detected it belongs to the **${detection.name}** department${sourceLabel} (Confidence: ${detection.confidence}%).\n\n${reasonText}\n\nIf you want to file an official complaint, I can pre-fill the form. Tap "Auto-File Complaint" below!`;
    } else {
      // Low confidence — explain what happened
      const notConfigured = detection.reason && detection.reason.includes('LLM not configured');
      if (notConfigured) {
        reply = `Keyword confidence is low (${detection.confidence}%) for "${userText}".\n\n🔧 LLM fallback is not configured. Add your API key in **Admin → Settings → AI Grievance Routing** to enable AI-enhanced routing for ambiguous queries.\n\nMeanwhile, try using clearer keywords like "power cut", "water supply", or "road damage".`;
      } else if (detection.source === 'llm') {
        reply = `AI analyzed your message but confidence is still ${detection.confidence}%.\n\nPlease describe your grievance with more details (e.g. mention keywords like "water", "electricity", "road", "pothole") so I can route it to the correct department.`;
      } else {
        reply = `Keyword match is low (${detection.confidence}%). I couldn't confidently identify the department for "${userText}".\n\nPlease describe your grievance with more details (e.g. "no power for 2 days", "water pipeline burst") so I can route it correctly.`;
      }
    }

    setChatMessages(prev => [...prev, { sender: 'ai', text: reply, detection }]);
  };

  const handleSendChat = (textToSend = chatInput) => {
    if (!textToSend.trim()) return;
    
    setChatMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    setChatInput('');
    setDetectedCategory(null);
    triggerAIResponse(textToSend);
  };

  // Real Web Speech API with Tamil/English support
  const handleMicClick = () => {
    console.log('[Mic] Clicked. micActive=', micActive);

    if (micActive) {
      console.log('[Mic] Stopping...');
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (micTimeoutRef.current) {
        clearTimeout(micTimeoutRef.current);
        micTimeoutRef.current = null;
      }
      setMicActive(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    console.log('[Mic] SpeechRecognition available?', !!SpeechRecognition);

    if (!SpeechRecognition) {
      console.log('[Mic] Browser unsupported. Using fallback simulation.');
      setMicActive(true);
      micTimeoutRef.current = setTimeout(() => {
        const simulatedTranscripts = [
          "Drainage water is overflowing on Ambattur high road",
          "We have no water supply in our house since yesterday",
          "Our street light is off and there is short circuit risk in transformer",
          "There is a huge pothole in Ward 14 causing traffic issues"
        ];
        const randomText = simulatedTranscripts[Math.floor(Math.random() * simulatedTranscripts.length)];
        console.log('[Mic] Fallback transcript:', randomText);
        setChatInput(randomText);
        const detection = detectDepartment(randomText);
        if (detection.confidence > 15) setDetectedCategory(detection);
        setMicActive(false);
        micTimeoutRef.current = null;
      }, 2200);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = voiceLang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      console.log('[Mic] Recognition started. Lang:', voiceLang);
      setMicActive(true);
      // Cancel the safety timeout since it started successfully
      if (micTimeoutRef.current) {
        clearTimeout(micTimeoutRef.current);
        micTimeoutRef.current = null;
      }
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript)
        .join('');
      console.log('[Mic] Interim transcript:', transcript);
      setChatInput(transcript);
    };

    recognition.onerror = (event) => {
      console.warn('[Mic] Error:', event.error);
      setMicActive(false);
      recognitionRef.current = null;
      // Show a toast in chat so user knows what happened
      if (event.error === 'not-allowed') {
        setChatMessages(prev => [...prev, { sender: 'ai', text: '🎤 Microphone access denied. Please allow microphone permission in your browser settings, or type your complaint instead.', detection: null }]);
      } else if (event.error === 'no-speech') {
        setChatMessages(prev => [...prev, { sender: 'ai', text: '🎤 No speech detected. Please try speaking louder or closer to the microphone.', detection: null }]);
      } else {
        setChatMessages(prev => [...prev, { sender: 'ai', text: `🎤 Voice input error: ${event.error}. Please type your complaint instead.`, detection: null }]);
      }
    };

    recognition.onend = () => {
      console.log('[Mic] Recognition ended.');
      setMicActive(false);
      recognitionRef.current = null;
    };

    // Safety timeout: if onstart never fires, something blocked it
    micTimeoutRef.current = setTimeout(() => {
      console.warn('[Mic] Recognition did not start within 1s. Likely permission blocked or HTTPS required.');
      setMicActive(false);
      recognitionRef.current = null;
      setChatMessages(prev => [...prev, {
        sender: 'ai',
        text: '🎤 Voice input blocked by your browser. This usually happens when:\n• The page is not on HTTPS (except localhost)\n• Microphone permission was previously denied\n• A browser extension is interfering\n\nPlease type your complaint instead, or check your browser permissions.',
        detection: null
      }]);
    }, 1000);

    try {
      recognition.start();
    } catch (err) {
      console.warn('[Mic] Start failed:', err);
      setMicActive(false);
      if (micTimeoutRef.current) {
        clearTimeout(micTimeoutRef.current);
        micTimeoutRef.current = null;
      }
    }
  };

  // Cleanup speech recognition and timeouts on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (micTimeoutRef.current) {
        clearTimeout(micTimeoutRef.current);
      }
    };
  }, []);

  // ----------------------------------------------------
  // COMPLAINT WIZARD STATE & LOGIC
  // ----------------------------------------------------
  const [complaintStep, setComplaintStep] = useState(1);
  const [gpsCaptured, setGpsCaptured] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const locationSearchTimeout = useRef(null);

  const [complaintForm, setComplaintForm] = useState({
    title: '',
    dept: 'Municipal Corporation',
    sev: 'Medium',
    desc: '',
    location: '',
    photo: null
  });

  const handleAutoFileFromChat = (detection) => {
    setComplaintForm(prev => ({
      ...prev,
      dept: detection.name,
      title: `Auto-routed: Issue in ${detection.name}`,
      desc: chatMessages[chatMessages.length - 2]?.text || ''
    }));
    
    setComplaintStep(1);
    navigate('complaint');
  };

  // Reverse geocode lat/lng to place name using OpenStreetMap Nominatim (free, no API key)
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { 'User-Agent': 'TN-App/1.0' }
      });
      const data = await res.json();
      const address = data.display_name || data.name || `${lat}, ${lng}`;
      const shortAddress = data.address
        ? `${data.address.road || ''} ${data.address.suburb || data.address.neighbourhood || ''}, ${data.address.city || data.address.town || data.address.village || ''}, ${data.address.state || 'Tamil Nadu'}`.replace(/^\s+|\s+$/g, '').replace(/,\s*,/g, ',').replace(/^,\s*/, '')
        : address;
      return shortAddress;
    } catch (err) {
      console.warn('Reverse geocode failed:', err);
      return `${lat}, ${lng}`;
    }
  };

  const handleGPSCapture = async () => {
    setGpsCoordinates('Capturing...');
    setPlaceName('Detecting address...');
    if (!navigator.geolocation) {
      setGpsCoordinates('Geolocation not supported');
      setPlaceName('');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        setGpsCoordinates(`Lat: ${lat}, Lng: ${lng}`);

        const name = await reverseGeocode(lat, lng);
        setPlaceName(name);
        setGpsCaptured(true);
        setComplaintForm(prev => ({ ...prev, location: name }));
      },
      async () => {
        // Fallback: Chennai coordinates
        const lat = '13.0827';
        const lng = '80.2707';
        setGpsCoordinates(`Lat: ${lat}, Lng: ${lng}`);

        const name = await reverseGeocode(lat, lng);
        setPlaceName(name);
        setGpsCaptured(true);
        setComplaintForm(prev => ({ ...prev, location: name }));
      }
    );
  };

  // Search places via Nominatim autocomplete
  const searchPlaces = async (query) => {
    if (!query || query.length < 3) {
      setLocationSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Tamil Nadu, India')}&limit=5&addressdetails=1`, {
        headers: { 'User-Agent': 'TN-App/1.0' }
      });
      const data = await res.json();
      setLocationSuggestions(data.map(item => ({
        display: item.display_name,
        short: item.display_name.split(',')[0] + ', ' + (item.address?.city || item.address?.town || item.address?.village || '') + ', ' + (item.address?.state || 'Tamil Nadu'),
        lat: item.lat,
        lon: item.lon
      })));
      setShowSuggestions(true);
    } catch (err) {
      console.warn('Place search failed:', err);
    }
  };

  const handleLocationSearchChange = (e) => {
    const val = e.target.value;
    setLocationSearch(val);
    setComplaintForm(prev => ({ ...prev, location: val }));
    setPlaceName(val);

    if (locationSearchTimeout.current) clearTimeout(locationSearchTimeout.current);
    locationSearchTimeout.current = setTimeout(() => {
      searchPlaces(val);
    }, 400);
  };

  const selectPlaceSuggestion = (suggestion) => {
    setLocationSearch(suggestion.short);
    setPlaceName(suggestion.short);
    setGpsCoordinates(`Lat: ${parseFloat(suggestion.lat).toFixed(5)}, Lng: ${parseFloat(suggestion.lon).toFixed(5)}`);
    setGpsCaptured(true);
    setComplaintForm(prev => ({ ...prev, location: suggestion.short }));
    setShowSuggestions(false);
    setLocationSuggestions([]);
  };

  // Detect category automatically in step 3
  const handleDescriptionChange = (e) => {
    const val = e.target.value;
    setComplaintForm(prev => ({ ...prev, desc: val }));
    
    if (val.length > 5) {
      const detect = detectDepartment(val);
      if (detect.confidence > 25) {
        setComplaintForm(prev => ({ ...prev, dept: detect.name }));
      }
    }
  };

  const handleNextStep = () => {
    if (complaintStep < 5) setComplaintStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    if (complaintStep > 1) setComplaintStep(prev => prev - 1);
  };

  const handleSelectCategory = (deptName) => {
    setComplaintForm(prev => ({ ...prev, dept: deptName }));
  };

  const [submittedId, setSubmittedId] = useState('');

  const handleSubmitComplaint = () => {
    const newComplaint = {
      title: complaintForm.title || `Issue reported at ${complaintForm.location || 'Chennai'}`,
      dept: complaintForm.dept,
      sev: complaintForm.sev,
      description: complaintForm.desc,
      location: complaintForm.location || 'Captured Location',
      photo: 'attached_image.jpg'
    };
    
    const saved = addComplaint(newComplaint);
    setSubmittedId(saved.id);
    
    // Clear Form
    setComplaintForm({
      title: '',
      dept: 'Municipal Corporation',
      sev: 'Medium',
      desc: '',
      location: '',
      photo: null
    });
    setGpsCaptured(false);
    setGpsCoordinates('');
    setComplaintStep(1);
    
    setComplaintMessages(prev => [saved, ...prev]);
    setActiveScreen('success-screen');
  };

  // ----------------------------------------------------
  // LISTS STATE
  // ----------------------------------------------------
  const [complaintMessages, setComplaintMessages] = useState([]);
  const [schemeFilter, setSchemeFilter] = useState('All');
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    setComplaintMessages(complaints);
  }, [complaints]);

  // Schemes data
  const SCHEMES = [
    { title: 'Subsidised Power for Farmers', dept: 'TANGEDCO', cat: 'Farmers', desc: 'Free electricity up to 100 units and subvention schemes for pump sets.' },
    { title: 'Free Laptop Scheme', dept: 'Education', cat: 'Students', desc: 'Laptops distributed to Class 11 and 12 government school students.' },
    { title: 'CM Comprehensive Health Insurance', dept: 'Health', cat: 'All', desc: 'Financial coverage up to ₹5 Lakhs per family for critical care.' },
    { title: 'Pudhumai Penn Scheme', dept: 'Social Welfare', cat: 'Women', desc: '₹1,000/month for girls studying in government schools to support higher education.' }
  ];

  // ----------------------------------------------------
  // RENDERED VIEW ROUTING
  // ----------------------------------------------------
  const renderScreen = () => {
    switch (activeScreen) {
      case 'splash':
        return (
          <div className="phone-scroll" style={{ background: '#8B0000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '7px', background: 'var(--gold-bright)' }} />
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'var(--gold-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', marginBottom: '20px', border: '5px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>🏛️</div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--gold-bright)', marginBottom: '6px', lineHeight: 1.2 }}>Tamil Nadu AI<br />Citizen Platform</h2>
            <div style={{ fontFamily: 'var(--tamil)', fontSize: '14px', color: 'rgba(255,210,50,0.8)', marginBottom: '10px' }}>தமிழ்நாடு AI குடிமக்கள் தளம்</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(212,160,23,0.35)', padding: '5px 16px', borderRadius: '20px', marginBottom: '40px' }}>AI-Powered Public Grievance Routing</div>
            
            <div style={{ width: '64px', height: '3px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px', marginBottom: '40px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--gold-bright)', width: '100%', animation: 'fill 2s ease' }} />
            </div>

            <button 
              className="btn-primary" 
              onClick={() => { navigate('home'); }}
              style={{ background: 'var(--gold-bright)', color: 'var(--red-deep)', width: 'auto', padding: '15px 52px', fontSize: '16px', fontWeight: 800 }}
            >
              தொடங்கு · Get Started
            </button>
            <div style={{ position: 'absolute', bottom: '20px', fontSize: '11px', color: 'rgba(212,160,23,0.55)', fontFamily: 'var(--tamil)' }}>பிறப்போக்கும் எல்லா உயிர்க்கும்!</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '68px', background: 'var(--gold-bright)', display: 'none' }} />
          </div>
        );

      case 'home':
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="user-hdr">
              <div className="user-hdr-top">
                <div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,215,60,0.85)', fontWeight: 500 }}>வணக்கம் · Welcome</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'white' }}>Arjun Kumar</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={10} /> Chennai · Ward 14</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div className="user-hdr-bk" onClick={() => navigate('notifications')} style={{ position: 'relative' }}>
                    <Bell size={18} />
                    <div style={{ position: 'absolute', top: '8px', right: '8px', width: '7px', height: '7px', background: 'var(--gold-bright)', borderRadius: '50%', border: '1.5px solid var(--red)' }}></div>
                  </div>
                  <div className="user-hdr-bk" onClick={() => navigate('profile')}><User size={18} /></div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(0,0,0,0.22)', padding: '10px 14px', borderRadius: '11px', cursor: 'pointer' }} onClick={() => navigate('ai-screen')}>
                <Search size={14} style={{ color: 'rgba(255,215,50,0.75)' }} />
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px' }}>Ask AI or report an issue...</span>
              </div>
            </div>

            <div className="phone-scroll">
              {/* AI Banner Card */}
              <div 
                style={{ background: 'linear-gradient(135deg, var(--red) 0%, var(--red-dark) 100%)', borderRadius: '16px', padding: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', marginBottom: '13px', boxShadow: '0 4px 18px rgba(155,13,23,0.3)', position: 'relative', overflow: 'hidden' }}
                onClick={() => navigate('ai-screen')}
              >
                <div style={{ width: '46px', height: '46px', background: 'var(--gold-bright)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>🤖</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 700 }}>TN AI Grievance Assistant</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,220,50,0.8)' }}>Type or speak. AI will auto-route to correct department</div>
                </div>
                <ChevronRight size={18} style={{ color: 'var(--gold-bright)' }} />
              </div>

              {/* Quick Actions Grid */}
              <div className="sec-label">Quick Actions</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
                <div className="bnav-item" onClick={() => { setComplaintStep(1); navigate('complaint'); }} style={{ padding: '8px 4px', background: 'var(--white)', border: '1px solid var(--g200)', borderRadius: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fff0f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📝</div>
                  <div style={{ fontSize: '10px', fontWeight: 700, marginTop: '4px', textAlign: 'center' }}>File Case</div>
                </div>
                <div className="bnav-item" onClick={() => navigate('requests')} style={{ padding: '8px 4px', background: 'var(--white)', border: '1px solid var(--g200)', borderRadius: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fff8e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🔍</div>
                  <div style={{ fontSize: '10px', fontWeight: 700, marginTop: '4px', textAlign: 'center' }}>Track Case</div>
                </div>
                <div className="bnav-item" onClick={() => navigate('schemes')} style={{ padding: '8px 4px', background: 'var(--white)', border: '1px solid var(--g200)', borderRadius: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🏆</div>
                  <div style={{ fontSize: '10px', fontWeight: 700, marginTop: '4px', textAlign: 'center' }}>Schemes</div>
                </div>
                <div className="bnav-item" onClick={() => navigate('emergency')} style={{ padding: '8px 4px', background: 'var(--white)', border: '1px solid var(--g200)', borderRadius: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🆘</div>
                  <div style={{ fontSize: '10px', fontWeight: 700, marginTop: '4px', textAlign: 'center' }}>SOS Dials</div>
                </div>
              </div>

              {/* Alert box */}
              <div style={{ background: '#fff8e1', borderLeft: '4px solid var(--gold)', borderRadius: '0 12px 12px 0', padding: '12px 14px', display: 'flex', gap: '10px', marginBottom: '10px', border: '1px solid rgba(212,160,23,0.2)' }}>
                <AlertTriangle size={18} style={{ color: 'var(--gold-dark)', flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#6b4c00', marginBottom: '3px' }}>Traffic Alert</div>
                  <div style={{ fontSize: '11px', color: '#8a6200', lineHeight: 1.5 }}>Metro construction work diversion on Anna Salai starting tonight. Plan alternate routes.</div>
                </div>
              </div>

              {/* Departments Shortcut Grid */}
              <div className="sec-label">Government Departments</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {Object.values(DEPARTMENTS).slice(0, 6).map(d => (
                  <div 
                    key={d.id} 
                    onClick={() => {
                      setComplaintForm(prev => ({ ...prev, dept: d.name }));
                      setComplaintStep(1);
                      navigate('complaint');
                    }}
                    style={{ background: 'var(--white)', border: '1px solid var(--g200)', borderRadius: '12px', padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                      {d.icon === 'city' ? '🏛️' : d.icon === 'zap' ? '⚡' : d.icon === 'droplets' ? '💧' : d.icon === 'sprout' ? '🌾' : d.icon === 'heart-pulse' ? '🏥' : '🎓'}
                    </div>
                    <div style={{ fontSize: '9px', fontWeight: 700, textAlign: 'center', color: 'var(--g800)' }}>{d.name.split(' ')[0]}</div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        );

      case 'ai-screen':
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--off-white)', position: 'relative' }}>
            <div className="ai-chat-hdr">
              <div className="user-hdr-bk" onClick={navigateBack} style={{ color: 'white', background: 'rgba(255,220,50,0.18)' }}><ArrowLeft size={18} /></div>
              <div className="ai-chat-avatar">🤖</div>
              <div style={{ flex: 1 }}>
                <div className="ai-chat-name">AI Assistant Routing</div>
                <div className="ai-chat-status"><div className="ai-status-dot" /> Online & Auto-Detecting</div>
              </div>
              <button
                onClick={() => setVoiceLang(prev => prev === 'en-IN' ? 'ta-IN' : 'en-IN')}
                style={{
                  background: 'rgba(255,220,50,0.18)',
                  border: '1px solid rgba(255,220,50,0.3)',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  color: 'var(--gold-bright)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                title={`Voice input: ${voiceLang === 'en-IN' ? 'English' : 'Tamil'}`}
              >
                {voiceLang === 'en-IN' ? 'EN 🎤' : 'TA 🎤'}
              </button>
            </div>

            <div className="ai-messages">
              {chatMessages.map((m, i) => (
                <div key={i} className={m.sender === 'ai' ? 'msg-ai' : 'msg-user'}>
                  {m.sender === 'ai' && <div className="msg-ai-avatar">🤖</div>}
                  <div className={m.sender === 'ai' ? 'msg-ai-bubble' : 'msg-user-bubble'}>
                    {m.text}
                    {m.detection && m.detection.confidence > 0 && (
                      <div style={{ marginTop: '10px', background: 'var(--gold-light)', border: '1px solid var(--gold)', borderRadius: '8px', padding: '8px', fontSize: '11px', color: 'var(--gold-dark)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>🏷 Recommended Dept: <strong>{m.detection.name}</strong></span>
                          <span style={{ background: 'var(--gold)', color: 'var(--red-deep)', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>{m.detection.confidence}% Match</span>
                        </div>
                        <button 
                          className="btn-primary" 
                          onClick={() => handleAutoFileFromChat(m.detection)}
                          style={{ padding: '6px 12px', fontSize: '10px', background: 'var(--red)', width: 'auto', alignSelf: 'flex-start' }}
                        >
                          Auto-File Complaint
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="msg-ai">
                  <div className="msg-ai-avatar">🤖</div>
                  <div className="ai-typing">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Voice Listening Overlay (WhatsApp-style) */}
            {micActive && (
              <div 
                onClick={handleMicClick}
                style={{
                  position: 'absolute',
                  bottom: '70px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, var(--red) 0%, var(--red-dark) 100%)',
                  borderRadius: '28px',
                  padding: '16px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 30px rgba(200,16,46,0.35)',
                  zIndex: 100,
                  cursor: 'pointer',
                  animation: 'voicePopIn 0.3s ease',
                  minWidth: '200px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '24px' }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{
                      width: '4px',
                      background: 'white',
                      borderRadius: '2px',
                      animation: `voiceBar ${0.6 + Math.random() * 0.4}s ease-in-out infinite alternate`,
                      animationDelay: `${i * 0.1}s`,
                      height: '60%'
                    }} />
                  ))}
                </div>
                <div style={{ color: 'white', fontSize: '13px', fontWeight: 700 }}>Listening...</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px' }}>Tap to stop</div>
              </div>
            )}

            {/* AI Assist helper suggestions */}
            {chatMessages.length === 1 && (
              <div className="ai-chips-container">
                <div className="ai-chip" onClick={() => handleSendChat('Water has not been coming for 3 days')}>Water Issue 💧</div>
                <div className="ai-chip" onClick={() => handleSendChat('Pothole is dangerous near Ambattur corner')}>Road Pothole 🛣️</div>
                <div className="ai-chip" onClick={() => handleSendChat('Transformer has short circuit and sparks')}>Electricity Spark ⚡</div>
                <div className="ai-chip" onClick={() => handleSendChat('Someone stole my cycle from school parking')}>Theft / Police 👮</div>
                <div className="ai-chip" onClick={() => handleSendChat('குடிநீர் வரவில்லை மூன்று நாட்களாக')}>தண்ணீர் பிரச்சனை 💧</div>
                <div className="ai-chip" onClick={() => handleSendChat('எங்கள் தெருவில் மின்சாரம் இல்லை')}>மின்சாரம் ⚡</div>
              </div>
            )}

            {/* Auto-routed banner tip */}
            {detectedCategory && (
              <div style={{ background: 'var(--gold-light)', borderTop: '1.5px solid var(--gold)', padding: '6px 14px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--gold-dark)' }}>
                <span>🎯 Auto-detecting Category: <strong>{detectedCategory.name}</strong></span>
                <span style={{ fontWeight: 800 }}>({detectedCategory.confidence}% match)</span>
              </div>
            )}

            {/* Input Row */}
            <div className="ai-input-container">
              <input 
                className="ai-input-field" 
                value={chatInput}
                onChange={handleChatInputChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder={voiceLang === 'ta-IN' ? 'தமிழில் அல்லது ஆங்கிலத்தில் டைப் செய்யவும்...' : 'Type in English or Tamil...'}
              />
              <button className="ai-send-btn" onClick={() => handleSendChat()}><Send size={15} /></button>
              <button className="ai-mic-btn" onClick={handleMicClick}>
                <Mic size={15} />
                {micActive && <div className="mic-wave-pulse" />}
                <span style={{ fontSize: '7px', fontWeight: 700, letterSpacing: '0.3px', fontFamily: 'var(--font)' }}>{micActive ? 'Listening...' : voiceLang === 'ta-IN' ? 'TA 🎤' : 'EN 🎤'}</span>
              </button>
            </div>
          </div>
        );

      case 'complaint':
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="user-hdr" style={{ paddingBottom: '12px' }}>
              <div className="user-hdr-top">
                <div className="user-hdr-bk" onClick={navigateBack}><ArrowLeft size={18} /></div>
                <div style={{ flex: 1, marginLeft: '12px' }}>
                  <div className="user-hdr-title">File Complaint</div>
                  <div className="user-hdr-sub" id="cmp-step-label">Step {complaintStep} of 5 · {['Location','Category','Describe','Photo','Review'][complaintStep-1]}</div>
                </div>
              </div>
              
              {/* Progress bar steps */}
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map(step => (
                  <React.Fragment key={step}>
                    <div 
                      style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        background: step < complaintStep ? 'var(--gold-bright)' : step === complaintStep ? 'white' : 'rgba(255,255,255,0.2)', 
                        color: step < complaintStep ? 'var(--red-deep)' : step === complaintStep ? 'var(--red)' : 'rgba(255,255,255,0.5)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '11px', 
                        fontWeight: 700 
                      }}
                    >
                      {step < complaintStep ? '✓' : step}
                    </div>
                    {step < 5 && (
                      <div style={{ flex: 1, height: '2px', background: step < complaintStep ? 'var(--gold-bright)' : 'rgba(255,255,255,0.2)' }} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="phone-scroll">
              {complaintStep === 1 && (
                <div>
                  <div className="sec-label">Capture Grievance Location</div>

                  {/* GPS Capture Card */}
                  <div className="gps-card-btn" onClick={handleGPSCapture}>
                    <div className="gps-icon-circle">
                      {gpsCaptured ? <Check size={18} style={{ color: '#1b5e20' }} /> : <MapPin size={18} />}
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: gpsCaptured ? '#1b5e20' : 'var(--g800)' }}>
                        {gpsCaptured ? 'GPS Location Captured' : 'Use Live GPS Location'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--g600)' }}>
                        {placeName || (gpsCoordinates ? gpsCoordinates : 'Fetch coordinates & detect address automatically')}
                      </div>
                    </div>
                    {gpsCaptured && <span style={{ color: '#1b5e20', fontWeight: 800 }}>✓</span>}
                  </div>

                  {/* OR Divider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--g200)' }} />
                    <span style={{ fontSize: '11px', color: 'var(--g400)', fontWeight: 600 }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--g200)' }} />
                  </div>

                  {/* Place Search with Autocomplete */}
                  <div className="frow" style={{ position: 'relative' }}>
                    <label className="flabel">Search Location</label>
                    <input
                      className="finput"
                      value={locationSearch}
                      onChange={handleLocationSearchChange}
                      onFocus={() => { if (locationSuggestions.length > 0) setShowSuggestions(true); }}
                      placeholder="Type area name (e.g. Ambattur, T Nagar, Coimbatore)"
                    />
                    {showSuggestions && locationSuggestions.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid var(--g200)',
                        borderRadius: '10px',
                        marginTop: '4px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                        zIndex: 100,
                        maxHeight: '220px',
                        overflowY: 'auto'
                      }}>
                        {locationSuggestions.map((s, i) => (
                          <div
                            key={i}
                            onClick={() => selectPlaceSuggestion(s)}
                            style={{
                              padding: '10px 14px',
                              borderBottom: i < locationSuggestions.length - 1 ? '1px solid var(--g100)' : 'none',
                              cursor: 'pointer',
                              fontSize: '12px',
                              color: 'var(--g800)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--g100)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                          >
                            <MapPin size={14} style={{ color: 'var(--red)', flexShrink: 0 }} />
                            <span style={{ lineHeight: 1.4 }}>{s.short}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected location display */}
                  {placeName && (
                    <div style={{ marginTop: '14px', padding: '10px 12px', background: 'var(--red-light)', borderRadius: '10px', border: '1px solid var(--red)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={14} style={{ color: 'var(--red)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--red)' }}>Selected Location</div>
                        <div style={{ fontSize: '12px', color: 'var(--g800)' }}>{placeName}</div>
                        {gpsCoordinates && (
                          <div style={{ fontSize: '10px', color: 'var(--g400)', marginTop: '2px' }}>{gpsCoordinates}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {complaintStep === 2 && (
                <div>
                  <div className="sec-label">Select Government Department</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                    {Object.values(DEPARTMENTS).map(d => (
                      <div 
                        key={d.id}
                        onClick={() => handleSelectCategory(d.name)}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px', 
                          padding: '12px', 
                          borderRadius: '10px', 
                          background: complaintForm.dept === d.name ? 'var(--red-light)' : 'var(--white)', 
                          border: `1.5px solid ${complaintForm.dept === d.name ? 'var(--red)' : 'var(--g200)'}`,
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ fontSize: '20px' }}>
                          {d.icon === 'city' ? '🏛️' : d.icon === 'zap' ? '⚡' : d.icon === 'droplets' ? '💧' : d.icon === 'sprout' ? '🌾' : d.icon === 'heart-pulse' ? '🏥' : d.icon === 'graduation-cap' ? '🎓' : d.icon === 'bus' ? '🚌' : d.icon === 'shield' ? '🚔' : d.icon === 'home' ? '🏠' : d.icon === 'leaf' ? '🌱' : d.icon === 'hard-hat' ? '👷' : d.icon === 'factory' ? '🏭' : d.icon === 'package' ? '🍚' : '🏢'}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--g800)' }}>{d.name}</span>
                        {complaintForm.dept === d.name && (
                          <span style={{ marginLeft: 'auto', color: 'var(--red)', fontWeight: 800 }}>✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {complaintStep === 3 && (
                <div>
                  <div className="sec-label">Describe Grievance</div>
                  
                  {/* Dynamic Auto Routing Hint */}
                  {complaintForm.desc.length > 5 && (
                    <div style={{ background: 'var(--gold-light)', border: '1px solid var(--gold)', borderRadius: '8px', padding: '10px', marginBottom: '12px', fontSize: '11.5px', color: 'var(--gold-dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>🎯 Auto-Routing to: <strong>{complaintForm.dept}</strong></span>
                      <span style={{ fontStyle: 'italic', opacity: 0.8 }}>Keyword matched</span>
                    </div>
                  )}

                  <div className="frow">
                    <label className="flabel">Short Summary</label>
                    <input 
                      className="finput" 
                      value={complaintForm.title} 
                      onChange={(e) => setComplaintForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Transformer sparking / Pothole issue" 
                    />
                  </div>

                  <div className="frow">
                    <label className="flabel">Detailed Description</label>
                    <textarea 
                      className="ftarea" 
                      value={complaintForm.desc}
                      onChange={handleDescriptionChange}
                      placeholder="Enter description. Type keywords (like water, pipe, fuse, theft) and see the category automatically update!" 
                    />
                  </div>

                  <div className="frow">
                    <label className="flabel">Select Grievance Severity</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {['Low', 'Medium', 'High', 'SOS'].map(p => (
                        <button 
                          key={p}
                          type="button"
                          onClick={() => setComplaintForm(prev => ({ ...prev, sev: p }))}
                          style={{ 
                            flex: 1, 
                            padding: '10px 4px', 
                            fontSize: '11px', 
                            fontWeight: 700, 
                            borderRadius: '9px',
                            border: '1.5px solid transparent',
                            background: p === 'Low' ? '#e8f5e9' : p === 'Medium' ? 'var(--gold-light)' : p === 'High' ? '#ffebee' : 'var(--red-dark)',
                            color: p === 'Low' ? '#1b5e20' : p === 'Medium' ? 'var(--gold-dark)' : p === 'High' ? '#7f0000' : 'white',
                            borderColor: p === 'Low' ? '#81c784' : p === 'Medium' ? 'var(--gold)' : p === 'High' ? '#e57373' : 'var(--red-dark)',
                            boxShadow: complaintForm.sev === p ? 'inset 0 0 0 2px var(--g800)' : 'none'
                          }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {complaintStep === 4 && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div className="sec-label">Attach Photo Evidence</div>
                  <div style={{ border: '2px dashed var(--g300)', padding: '40px 20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--white)', cursor: 'pointer' }} onClick={() => setComplaintForm(prev => ({ ...prev, photo: 'attached_image.jpg' }))}>
                    <Camera size={44} style={{ color: 'var(--g400)', marginBottom: '14px' }} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--g800)' }}>
                      {complaintForm.photo ? '✓ Photo Attached' : 'Capture or Upload Photo'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--g400)', marginTop: '4px' }}>PNG, JPG, max 5MB</span>
                  </div>
                  {complaintForm.photo && (
                    <div style={{ marginTop: '14px', fontSize: '12px', color: '#1b5e20', fontWeight: 700 }}>
                      📸 photo_evidence_2026.jpg attached successfully!
                    </div>
                  )}
                </div>
              )}

              {complaintStep === 5 && (
                <div>
                  <div className="sec-label">Review Complaint Details</div>
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div>📌 Dept: <strong>{complaintForm.dept}</strong> <span style={{ color: 'var(--red)', fontStyle: 'italic' }}>(Auto-routed)</span></div>
                    <div>🏷 Title: <strong>{complaintForm.title || 'Grievance'}</strong></div>
                    <div>📍 Location: <strong>{complaintForm.location || 'Chennai Area'}</strong></div>
                    <div>⚠️ Priority: <span className={`badge badge-${complaintForm.sev === 'Low' ? 'resolved' : complaintForm.sev === 'Medium' ? 'progress' : 'critical'}`}>{complaintForm.sev}</span></div>
                    <div style={{ borderTop: '1px solid var(--g200)', paddingTop: '10px', lineHeight: 1.5 }}>
                      📝 Description:<br /><span style={{ color: 'var(--g600)' }}>{complaintForm.desc || 'No description provided.'}</span>
                    </div>
                    {complaintForm.photo && <div>📸 Evidence: <span style={{ color: '#1b5e20' }}>Attached</span></div>}
                  </div>
                </div>
              )}

              {/* Wizard Nav buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                {complaintStep > 1 && (
                  <button className="btn-secondary" style={{ flex: 1 }} onClick={handlePrevStep}>Back</button>
                )}
                {complaintStep < 5 ? (
                  <button className="btn-primary" style={{ flex: 2 }} onClick={handleNextStep}>Continue</button>
                ) : (
                  <button className="btn-primary" style={{ flex: 2 }} onClick={handleSubmitComplaint}>Submit Grievance</button>
                )}
              </div>
            </div>
          </div>
        );

      case 'success-screen':
        return (
          <div className="phone-scroll" style={{ background: 'var(--white)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '24px' }}>
            <div style={{ width: '80px', height: '80px', background: 'var(--success-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', marginBottom: '20px', color: 'var(--success-dark)' }}>✓</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--g800)', marginBottom: '8px' }}>Complaint Submitted!</div>
            <div style={{ fontSize: '13px', color: 'var(--g600)', lineHeight: 1.6, marginBottom: '14px' }}>Your complaint has been automatically routed to the correct department.</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--red)', fontFamily: 'monospace', background: 'var(--red-light)', padding: '12px 24px', borderRadius: '12px', marginBottom: '20px', letterSpacing: '0.5px' }}>{submittedId}</div>
            <div style={{ fontSize: '12px', color: 'var(--g400)', marginBottom: '32px' }}>Expected SLA Resolution: 3–5 working days</div>
            <button className="btn-primary" onClick={() => navigate('requests')} style={{ width: 'auto', padding: '13px 28px' }}>Track Your Request</button>
            <button onClick={() => navigate('home')} style={{ background: 'none', border: 'none', color: 'var(--g400)', fontSize: '13px', cursor: 'pointer', marginTop: '12px' }}>Back to Home</button>
          </div>
        );

      case 'requests':
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="user-hdr">
              <div className="user-hdr-top">
                <div className="user-hdr-bk" onClick={navigateBack}><ArrowLeft size={18} /></div>
                <div style={{ flex: 1, marginLeft: '12px' }}>
                  <div className="user-hdr-title">My Grievances</div>
                  <div className="user-hdr-sub">{complaintMessages.length} Registered cases</div>
                </div>
              </div>
            </div>

            <div className="phone-scroll">
              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
                <div style={{ background: 'white', borderRadius: '12px', padding: '11px 4px', border: '1px solid var(--g200)', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--red)' }}>{complaintMessages.length}</div>
                  <div style={{ fontSize: '8.5px', color: 'var(--g400)', textTransform: 'uppercase', marginTop: '3px' }}>Total</div>
                </div>
                <div style={{ background: 'white', borderRadius: '12px', padding: '11px 4px', border: '1px solid var(--g200)', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--info)' }}>{complaintMessages.filter(c => c.status === 'New').length}</div>
                  <div style={{ fontSize: '8.5px', color: 'var(--g400)', textTransform: 'uppercase', marginTop: '3px' }}>New</div>
                </div>
                <div style={{ background: 'white', borderRadius: '12px', padding: '11px 4px', border: '1px solid var(--g200)', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--warning)' }}>{complaintMessages.filter(c => c.status === 'In Progress' || c.status === 'Escalated').length}</div>
                  <div style={{ fontSize: '8.5px', color: 'var(--g400)', textTransform: 'uppercase', marginTop: '3px' }}>Active</div>
                </div>
                <div style={{ background: 'white', borderRadius: '12px', padding: '11px 4px', border: '1px solid var(--g200)', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--success)' }}>{complaintMessages.filter(c => c.status === 'Resolved').length}</div>
                  <div style={{ fontSize: '8.5px', color: 'var(--g400)', textTransform: 'uppercase', marginTop: '3px' }}>Closed</div>
                </div>
              </div>

              {/* Case tracking list */}
              {complaintMessages.map(c => {
                const progressPct = c.status === 'New' ? 25 : c.status === 'In Progress' ? 60 : c.status === 'Escalated' ? 75 : c.status === 'Resolved' ? 100 : 0;
                const statusColor = c.status === 'Resolved' ? 'var(--success)' : c.status === 'Escalated' ? 'var(--warning)' : c.status === 'New' ? 'var(--info)' : 'var(--red)';
                return (
                  <div key={c.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelectedRequest(c)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '7px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--red)', fontFamily: 'monospace', background: 'var(--red-light)', padding: '2px 8px', borderRadius: '6px' }}>{c.id}</span>
                      <span className={`badge badge-${c.status === 'Resolved' ? 'resolved' : c.status === 'New' ? 'new' : 'progress'}`}>{c.status}</span>
                    </div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--g800)', marginBottom: '3px' }}>{c.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--g400)' }}>Dept: {c.dept} · Filed: {c.date}</div>

                    {/* Mini progress bar */}
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--g400)', fontWeight: 600 }}>Progress</span>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: statusColor }}>{progressPct}%</span>
                      </div>
                      <div style={{ height: '5px', background: 'var(--g100)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          borderRadius: '3px',
                          background: c.status === 'Resolved' ? 'var(--success)' : 'linear-gradient(90deg, var(--red) 0%, var(--gold) 100%)',
                          width: `${progressPct}%`,
                          transition: 'width 0.6s ease'
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Complaint Detail Modal */}
            {selectedRequest && (
              <div className="admin-modal-overlay" style={{ zIndex: 1010 }} onClick={() => setSelectedRequest(null)}>
                <div className="admin-modal" style={{ borderRadius: '24px 24px 0 0' }} onClick={(e) => e.stopPropagation()}>
                  <div className="admin-modal-handle" />
                  <div className="admin-modal-hdr">
                    <h3 className="admin-modal-title">Grievance Status: {selectedRequest.id}</h3>
                    <div className="admin-modal-close" onClick={() => setSelectedRequest(null)}><X size={15} /></div>
                  </div>
                  <div className="admin-modal-body">
                    <div style={{ background: 'var(--g100)', padding: '14px', borderRadius: '12px', marginBottom: '14px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '6px' }}>{selectedRequest.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--g600)' }}>Dept: <strong>{selectedRequest.dept}</strong></div>
                      <div style={{ fontSize: '12px', color: 'var(--g600)', marginTop: '2px' }}>Area: {selectedRequest.location || 'Chennai'}</div>
                      <div style={{ fontSize: '12.5px', color: 'var(--g600)', marginTop: '8px', lineHeight: 1.5 }}>
                        <strong>Description:</strong><br />{selectedRequest.description || selectedRequest.desc || ''}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--g600)' }}>Resolution Progress</span>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--red)' }}>
                          {selectedRequest.status === 'New' ? '25%' : selectedRequest.status === 'In Progress' ? '60%' : selectedRequest.status === 'Escalated' ? '75%' : selectedRequest.status === 'Resolved' ? '100%' : '0%'}
                        </span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--g200)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          borderRadius: '4px',
                          background: selectedRequest.status === 'Resolved' ? 'var(--success)' : 'linear-gradient(90deg, var(--red) 0%, var(--gold) 100%)',
                          width: selectedRequest.status === 'New' ? '25%' : selectedRequest.status === 'In Progress' ? '60%' : selectedRequest.status === 'Escalated' ? '75%' : selectedRequest.status === 'Resolved' ? '100%' : '0%',
                          transition: 'width 0.6s ease'
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--g400)' }}>New</span>
                        <span style={{ fontSize: '10px', color: 'var(--g400)' }}>In Progress</span>
                        <span style={{ fontSize: '10px', color: 'var(--g400)' }}>Resolved</span>
                      </div>
                    </div>

                    <div className="sec-label" style={{ margin: '0 0 10px' }}>Resolution Timeline</div>
                    <div className="admin-timeline">
                      <div className="admin-tl-item">
                        <div className="admin-tl-dot">1</div>
                        <div className="admin-tl-content">
                          <div className="admin-tl-title">Grievance Registered</div>
                          <div className="admin-tl-time">{selectedRequest.date} · Auto-routed to {selectedRequest.dept}</div>
                        </div>
                      </div>
                      <div className="admin-tl-item">
                        <div className="admin-tl-dot" style={{ background: selectedRequest.status !== 'New' ? 'var(--red)' : 'var(--g200)' }}>2</div>
                        <div className="admin-tl-content">
                          <div className="admin-tl-title">Department Review</div>
                          <div className="admin-tl-time">{selectedRequest.status !== 'New' ? 'Reviewed by department supervisor' : 'Pending review'}</div>
                        </div>
                      </div>
                      <div className="admin-tl-item">
                        <div className="admin-tl-dot" style={{ background: (selectedRequest.status === 'In Progress' || selectedRequest.status === 'Resolved' || selectedRequest.status === 'Escalated') ? 'var(--red)' : 'var(--g200)' }}>3</div>
                        <div className="admin-tl-content">
                          <div className="admin-tl-title">Officer Assigned</div>
                          <div className="admin-tl-time">
                            {selectedRequest.officer ? `Assigned to ${selectedRequest.officer}` : 'Awaiting officer dispatch'}
                          </div>
                        </div>
                      </div>
                      <div className="admin-tl-item">
                        <div className="admin-tl-dot" style={{ background: selectedRequest.status === 'Resolved' ? 'var(--success)' : 'var(--g200)' }}>4</div>
                        <div className="admin-tl-content">
                          <div className="admin-tl-title">Resolution Outcome</div>
                          <div className="admin-tl-time">{selectedRequest.status === 'Resolved' ? '✅ Resolved successfully. Closed.' : selectedRequest.status === 'Escalated' ? '⚠️ Escalated to senior authorities' : 'Awaiting action completion'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'schemes':
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="user-hdr">
              <div className="user-hdr-top">
                <div className="user-hdr-bk" onClick={navigateBack}><ArrowLeft size={18} /></div>
                <div style={{ flex: 1, marginLeft: '12px' }}>
                  <div className="user-hdr-title">Welfare Schemes</div>
                  <div className="user-hdr-sub">Apply online digitally</div>
                </div>
              </div>
            </div>

            <div className="phone-scroll">
              <div className="admin-filter-bar" style={{ gap: '0', background: 'var(--g100)', borderRadius: '10px', padding: '3px' }}>
                {['All', 'Farmers', 'Students', 'Women'].map(cat => (
                  <div 
                    key={cat}
                    onClick={() => setSchemeFilter(cat)}
                    className={`bnav-lbl ${schemeFilter === cat ? 'active' : ''}`}
                    style={{ 
                      flex: 1, 
                      textAlign: 'center', 
                      padding: '7px 4px', 
                      borderRadius: '8px', 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      cursor: 'pointer',
                      background: schemeFilter === cat ? 'white' : 'transparent',
                      color: schemeFilter === cat ? 'var(--red)' : 'var(--g400)',
                      boxShadow: schemeFilter === cat ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
                    }}
                  >
                    {cat}
                  </div>
                ))}
              </div>

              {SCHEMES.filter(s => schemeFilter === 'All' || s.cat === schemeFilter).map((s, idx) => (
                <div key={idx} className="card" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--g800)', marginBottom: '4px' }}>{s.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--g600)', marginBottom: '7px', lineHeight: 1.4 }}>{s.desc}</div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <span style={{ fontSize: '9px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', background: 'var(--gold-light)', color: 'var(--gold-dark)', border: '1px solid rgba(212,160,23,0.3)' }}>{s.cat}</span>
                      <span style={{ fontSize: '9px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', background: 'var(--g100)', color: 'var(--g600)' }}>{s.dept}</span>
                    </div>
                  </div>
                  <button 
                    className="btn-primary" 
                    onClick={() => alert(`Applying for ${s.title}... Aadhaar verified.`)}
                    style={{ width: 'auto', padding: '6px 12px', fontSize: '11px', alignSelf: 'center', flexShrink: 0 }}
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'emergency':
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="user-hdr">
              <div className="user-hdr-top">
                <div className="user-hdr-bk" onClick={navigateBack}><ArrowLeft size={18} /></div>
                <div style={{ flex: 1, marginLeft: '12px' }}>
                  <div className="user-hdr-title">Emergency Dials</div>
                  <div className="user-hdr-sub">Instant Helpline calls</div>
                </div>
              </div>
            </div>

            <div className="phone-scroll">
              <div style={{ background: '#ffebee', borderLeft: '4px solid var(--red-dark)', padding: '12px 14px', borderRadius: '0 12px 12px 0', marginBottom: '14px', display: 'flex', gap: '10px' }}>
                <ShieldAlert size={20} style={{ color: 'var(--red-dark)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--red-dark)' }}>24/7 National Emergency</div>
                  <div style={{ fontSize: '11px', color: 'var(--red-dark)', marginTop: '2px' }}>Calls Police, Fire & Ambulance simultaneously.</div>
                  <button className="btn-primary" onClick={() => alert('Calling 112...')} style={{ background: 'var(--red-dark)', padding: '8px 12px', fontSize: '12px', width: 'auto', marginTop: '10px' }}>Call National SOS (112)</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {[
                  { name: 'Police Helpline', num: '100', emoji: '👮' },
                  { name: 'Ambulance Call', num: '108', emoji: '🚑' },
                  { name: 'Fire & Rescue', num: '101', emoji: '🔥' },
                  { name: 'Women Safety', num: '181', emoji: '👩' },
                  { name: 'Cyber Crime', num: '1930', emoji: '💻' },
                  { name: 'Disaster Support', num: '1077', emoji: '🌊' }
                ].map(item => (
                  <div 
                    key={item.num}
                    onClick={() => alert(`Calling ${item.num}...`)}
                    style={{ background: 'white', border: '1px solid var(--g200)', borderRadius: '14px', padding: '16px 12px', textAlign: 'center', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>{item.emoji}</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--g800)' }}>{item.name}</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--red)', fontFamily: 'monospace', marginTop: '4px' }}>{item.num}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="user-hdr">
              <div className="user-hdr-top">
                <div className="user-hdr-bk" onClick={navigateBack}><ArrowLeft size={18} /></div>
                <div style={{ flex: 1, marginLeft: '12px' }}>
                  <div className="user-hdr-title">Notifications</div>
                  <div className="user-hdr-sub">{notifications.filter(n => n.unread).length} unread alerts</div>
                </div>
              </div>
            </div>

            <div className="phone-scroll">
              {notifications.map((n, idx) => (
                <div key={idx} className="card" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', borderLeft: n.unread ? '3px solid var(--red)' : '1px solid var(--g200)' }}>
                  <div style={{ fontSize: '20px' }}>
                    {n.icon === 'siren' ? '🚨' : n.icon === 'alert-triangle' ? '⚠️' : n.icon === 'check-circle' ? '✅' : '📋'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--g800)' }}>{n.title}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--g600)', marginTop: '2px', lineHeight: 1.4 }}>{n.body}</div>
                    <div style={{ fontSize: '10px', color: 'var(--g400)', marginTop: '6px' }}>{n.time}</div>
                  </div>
                  {n.unread && <div style={{ width: '8px', height: '8px', background: 'var(--red)', borderRadius: '50%' }} />}
                </div>
              ))}
            </div>
          </div>
        );

      case 'profile':
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: 'linear-gradient(180deg, var(--red) 0%, var(--red-dark) 100%)', padding: '24px 20px 32px', textAlign: 'center', color: 'white', flexShrink: 0 }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'var(--gold-bright)', border: '3px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', margin: '0 auto 12px' }}>👤</div>
              <div style={{ fontSize: '20px', fontWeight: 800 }}>Arjun Kumar</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,215,50,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px' }}><MapPin size={12} /> Chennai · Ward 14</div>
              
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--gold-bright)' }}>{complaints.length}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Complaints</div>
                </div>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--gold-bright)' }}>{complaints.filter(c => c.status === 'Resolved').length}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Resolved</div>
                </div>
              </div>
            </div>

            <div className="phone-scroll">
              <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--g200)', overflow: 'hidden', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderBottom: '1px solid var(--g100)' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--red-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}><User size={18} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>Arjun Kumar</div>
                    <div style={{ fontSize: '11px', color: 'var(--g400)' }}>+91 9876543210</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1b5e20' }}><Award size={18} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>Aadhaar Status</div>
                    <div style={{ fontSize: '11px', color: 'var(--g400)' }}>XXXX-XXXX-7890</div>
                  </div>
                  <span className="badge badge-resolved" style={{ fontSize: '9px' }}>Verified</span>
                </div>
              </div>

              <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--g200)', overflow: 'hidden', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderBottom: '1px solid var(--g100)', cursor: 'pointer' }} onClick={() => navigate('settings')}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--g100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--g600)' }}><Settings size={18} /></div>
                  <div style={{ flex: 1, fontSize: '13px', fontWeight: 700 }}>App Settings</div>
                  <ChevronRight size={16} style={{ color: 'var(--g300)' }} />
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="user-hdr">
              <div className="user-hdr-top">
                <div className="user-hdr-bk" onClick={navigateBack}><ArrowLeft size={18} /></div>
                <div style={{ flex: 1, marginLeft: '12px' }}>
                  <div className="user-hdr-title">Settings</div>
                  <div className="user-hdr-sub">Customize preferences</div>
                </div>
              </div>
            </div>

            <div className="phone-scroll">
              <div className="sec-label">Grievance Settings</div>
              <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--g200)', overflow: 'hidden', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>GPS Auto-Tagging</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--g400)' }}>Attach coordinates to complaints</div>
                  </div>
                  <div className="toggle on" style={{ background: 'var(--red)' }}><div style={{ transform: 'translateX(20px)' }} /></div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="phone-shell-container">
      <div className="phone-device">
        {/* Status Bar */}
        <div className="phone-sbar">
          <span>9:41</span>
          <div className="phone-sbar-right">
            <span style={{ fontSize: '12px' }}>🔋</span>
            <span style={{ fontSize: '12px' }}>📶</span>
          </div>
        </div>

        {/* Screen */}
        <div className={`phone-screen ${activeScreen === 'splash' || activeScreen === 'ai-screen' || activeScreen === 'success-screen' ? 'no-nav' : ''}`}>
          {renderScreen()}
        </div>

        {/* Bottom Navigation */}
        {activeScreen !== 'splash' && activeScreen !== 'ai-screen' && activeScreen !== 'success-screen' && (
          <div className="phone-bnav">
            <div className={`bnav-item ${activeScreen === 'home' ? 'active' : ''}`} onClick={() => { setActiveScreen('home'); setScreenHistory(['home']); }}>
              <div className="bnav-icon"><Home size={20} /></div>
              <div className="bnav-lbl">Home</div>
              <div className="bnav-tamil">முகப்பு</div>
            </div>
            <div className={`bnav-item ${activeScreen === 'requests' ? 'active' : ''}`} onClick={() => navigate('requests')}>
              <div className="bnav-icon"><Clipboard size={20} /></div>
              <div className="bnav-lbl">Requests</div>
              <div className="bnav-tamil">புகார்கள்</div>
              {complaintMessages.filter(c=>c.status === 'New').length > 0 && (
                <div className="bnav-badge">{complaintMessages.filter(c=>c.status === 'New').length}</div>
              )}
            </div>

            {/* AI Floating Center Button */}
            <div className={`bnav-center ${activeScreen === 'ai-screen' ? 'active' : ''}`} onClick={() => navigate('ai-screen')}>
              <div className="bnav-center-pill">
                <div className="bnav-center-icon">🤖</div>
              </div>
              <div className="bnav-center-lbl">AI Voice</div>
              <div className="bnav-center-tamil">AI உதவி</div>
            </div>

            <div className={`bnav-item ${activeScreen === 'schemes' ? 'active' : ''}`} onClick={() => navigate('schemes')}>
              <div className="bnav-icon"><Award size={20} /></div>
              <div className="bnav-lbl">Schemes</div>
              <div className="bnav-tamil">திட்டங்கள்</div>
            </div>
            <div className={`bnav-item ${activeScreen === 'profile' ? 'active' : ''}`} onClick={() => navigate('profile')}>
              <div className="bnav-icon"><User size={20} /></div>
              <div className="bnav-lbl">Profile</div>
              <div className="bnav-tamil">சுயவிவரம்</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
