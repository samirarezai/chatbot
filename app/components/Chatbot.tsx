'use client';

import { useState, useEffect, useRef } from 'react';
import chatbotFlowData from '../data/chatbot-flow.json';

const chatbotFlow = chatbotFlowData as typeof chatbotFlowData;

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  options?: string[];
  type?: 'text' | 'date' | 'rating' | 'boolean';
  showCalendar?: boolean;
}

type ConversationState = 
  | 'initial'
  | 'urgent_auth_email'
  | 'urgent_auth_dob'
  | 'urgent_topic'
  | 'urgent_registration_option'
  | 'urgent_unavailable'
  | 'urgent_email_composition'
  | 'urgent_email_confirmation'
  | 'urgent_email_sent'
  | 'urgent_followup'
  | 'other_topic'
  | 'survey_intro'
  | 'survey_satisfaction'
  | 'survey_resolved'
  | 'survey_comments'
  | 'survey_complete'
  | 'conversation_end';

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationState, setConversationState] = useState<ConversationState>('initial');
  const [userData, setUserData] = useState<{
    email?: string;
    dob?: string;
    name?: string;
    emailContent?: string;
    surveyData?: {
      satisfaction?: number;
      resolved?: string;
      comments?: string;
    };
  }>({});
  const [inputValue, setInputValue] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messageIdCounter = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = () => {
    const greeting: Message = {
      id: '1',
      text: chatbotFlow.initial.greeting,
      sender: 'bot',
      timestamp: new Date(),
    };
    const question: Message = {
      id: '2',
      text: chatbotFlow.initial.question,
      sender: 'bot',
      timestamp: new Date(),
      options: chatbotFlow.initial.options,
    };
    setMessages([greeting, question]);
  };

  const addMessage = (text: string, sender: 'bot' | 'user', options?: string[], type?: 'text' | 'date' | 'rating' | 'boolean', showCalendar?: boolean) => {
    messageIdCounter.current += 1;
    const message: Message = {
      id: messageIdCounter.current.toString(),
      text,
      sender,
      timestamp: new Date(),
      options,
      type,
      showCalendar,
    };
    setMessages((prev) => [...prev, message]);
  };

  useEffect(() => {
    if (messages.length === 0) {
      initializeChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const extractNameFromEmail = (email: string): string => {
    const namePart = email.split('@')[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1).split(/[._-]/)[0];
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleOptionClick = (option: string) => {
    addMessage(option, 'user');
    handleUserInput(option);
  };

  const handleUserInput = (input: string) => {
    if (input.toLowerCase() === 'skip' && conversationState.startsWith('survey_')) {
      setConversationState('conversation_end');
      addMessage(chatbotFlow.conversationEnd.message, 'bot');
      return;
    }

    switch (conversationState) {
      case 'initial':
        handleInitialOption(input);
        break;
      case 'urgent_auth_email':
        handleEmailInput(input);
        break;
      case 'urgent_auth_dob':
        handleDOBInput(input);
        break;
      case 'urgent_topic':
        handleTopicSelection(input);
        break;
      case 'urgent_registration_option':
        handleRegistrationOption();
        break;
      case 'urgent_unavailable':
        handleUnavailableResponse(input);
        break;
      case 'urgent_email_composition':
        handleEmailContent(input);
        break;
      case 'urgent_email_confirmation':
        handleEmailConfirmation(input);
        break;
      case 'urgent_followup':
        handleFollowup(input);
        break;
      case 'other_topic':
        handleOtherTopicResponse(input);
        break;
      case 'survey_satisfaction':
        handleSurveySatisfaction(input);
        break;
      case 'survey_resolved':
        handleSurveyResolved(input);
        break;
      case 'survey_comments':
        handleSurveyComments(input);
        break;
      default:
        addMessage(chatbotFlow.responses.invalidInput, 'bot');
    }
  };

  const handleInitialOption = (option: string) => {
    if (option === 'Urgent Assistance') {
      setConversationState('urgent_auth_email');
      addMessage(chatbotFlow.urgentAssistance.authQuestions[0].question, 'bot');
    } else {
      const topicKey = option.toLowerCase().replace(/\s+/g, '');
      let topicData;
      
      if (topicKey.includes('registration')) {
        topicData = chatbotFlow.otherTopics.courseRegistration;
      } else if (topicKey.includes('fees') || topicKey.includes('financial')) {
        topicData = chatbotFlow.otherTopics.feesFinancialAid;
      } else if (topicKey.includes('assignments') || topicKey.includes('exams')) {
        topicData = chatbotFlow.otherTopics.assignmentsExams;
      } else if (topicKey.includes('instructor')) {
        topicData = chatbotFlow.otherTopics.courseInstructor;
      }

      if (topicData) {
        addMessage(topicData.message, 'bot', topicData.options);
        setConversationState('other_topic');
      }
    }
  };

  const handleEmailInput = (email: string) => {
    if (validateEmail(email)) {
      setUserData({ ...userData, email });
      setConversationState('urgent_auth_dob');
      addMessage(chatbotFlow.urgentAssistance.authQuestions[1].question, 'bot', undefined, 'date', true);
    } else {
      addMessage('Please enter a valid email address.', 'bot');
    }
  };

  const handleDOBInput = (dob: string) => {
    const name = extractNameFromEmail(userData.email || '');
    setUserData({ ...userData, dob, name });
    setShowDatePicker(false);
    setConversationState('urgent_topic');
    addMessage(chatbotFlow.urgentAssistance.topicQuestion, 'bot', chatbotFlow.urgentAssistance.topics);
  };

  const handleTopicSelection = (topic: string) => {
    if (topic === 'Registration') {
      setConversationState('urgent_registration_option');
      addMessage(
        chatbotFlow.urgentAssistance.registrationOptions.question,
        'bot',
        chatbotFlow.urgentAssistance.registrationOptions.options
      );
    } else {
      setConversationState('urgent_unavailable');
      addMessage(
        chatbotFlow.urgentAssistance.unavailable.message,
        'bot',
        chatbotFlow.urgentAssistance.unavailable.options
      );
    }
  };

  const handleRegistrationOption = () => {
    setConversationState('urgent_unavailable');
    addMessage(
      chatbotFlow.urgentAssistance.unavailable.message,
      'bot',
      chatbotFlow.urgentAssistance.unavailable.options
    );
  };

  const handleUnavailableResponse = (response: string) => {
    if (response === 'Yes') {
      setConversationState('urgent_email_composition');
      const greeting = chatbotFlow.urgentAssistance.emailComposition.greeting.replace(
        '{name}',
        userData.name || 'there'
      );
      addMessage(greeting, 'bot');
      addMessage(chatbotFlow.urgentAssistance.emailComposition.question, 'bot');
    } else {
      addMessage(chatbotFlow.responses.goodbye, 'bot');
      startSurvey();
    }
  };

  const handleEmailContent = (content: string) => {
    setUserData({ ...userData, emailContent: content });
    setConversationState('urgent_email_confirmation');
    addMessage(
      chatbotFlow.urgentAssistance.emailComposition.confirmation,
      'bot',
      chatbotFlow.urgentAssistance.emailComposition.confirmationOptions
    );
  };

  const handleEmailConfirmation = (response: string) => {
    if (response === 'Yes, send my email') {
      addMessage(chatbotFlow.urgentAssistance.emailComposition.sending, 'bot');
      setTimeout(() => {
        addMessage(chatbotFlow.urgentAssistance.emailComposition.sent, 'bot');
        setConversationState('urgent_followup');
        addMessage(chatbotFlow.urgentAssistance.emailComposition.followUp, 'bot');
      }, 1000);
    } else {
      addMessage(chatbotFlow.responses.goodbye, 'bot');
      startSurvey();
    }
  };

  const handleFollowup = (response: string) => {
    if (response === 'No') {
      startSurvey();
    } else {
      initializeChat();
      setConversationState('initial');
      setUserData({});
    }
  };

  const handleOtherTopicResponse = (response: string) => {
    if (response === 'Back to Menu') {
      initializeChat();
      setConversationState('initial');
    } else {
      addMessage(chatbotFlow.responses.goodbye, 'bot');
      startSurvey();
    }
  };

  const startSurvey = () => {
    if (chatbotFlow.survey.enabled) {
      setTimeout(() => {
        setConversationState('survey_intro');
        addMessage(chatbotFlow.survey.intro, 'bot');
        setTimeout(() => {
          setConversationState('survey_satisfaction');
          addMessage(chatbotFlow.survey.questions[0].question, 'bot', undefined, 'rating');
        }, 500);
      }, 1000);
    } else {
      setConversationState('conversation_end');
      addMessage(chatbotFlow.conversationEnd.message, 'bot');
    }
  };

  const handleSurveySatisfaction = (rating: string) => {
    const ratingNum = parseInt(rating);
    if (ratingNum >= 1 && ratingNum <= 5) {
      setUserData({
        ...userData,
        surveyData: { ...userData.surveyData, satisfaction: ratingNum },
      });
      setConversationState('survey_resolved');
      addMessage(chatbotFlow.survey.questions[1].question, 'bot', chatbotFlow.survey.questions[1].options, 'boolean');
    }
  };

  const handleSurveyResolved = (response: string) => {
    setUserData({
      ...userData,
      surveyData: { ...userData.surveyData, resolved: response },
    });
    setConversationState('survey_comments');
    addMessage(chatbotFlow.survey.questions[2].question, 'bot', undefined, 'text');
  };

  const handleSurveyComments = (comments: string) => {
    setUserData({
      ...userData,
      surveyData: { ...userData.surveyData, comments },
    });
    setConversationState('survey_complete');
    addMessage(chatbotFlow.survey.thankYou, 'bot');
    setTimeout(() => {
      setConversationState('conversation_end');
      addMessage(chatbotFlow.conversationEnd.message, 'bot');
    }, 1000);
  };

  const handleDateSelect = (date: string) => {
    handleDOBInput(date);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatMessageDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      handleUserInput(inputValue.trim());
      setInputValue('');
    }
  };

  const handleRestart = () => {
    setMessages([]);
    setConversationState('initial');
    setUserData({});
    setShowDatePicker(false);
    initializeChat();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-xl font-semibold">UoPeople Portal Chat</h1>
        <p className="text-sm opacity-90">Chat with Michelle</p>
      </div>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-800 shadow-sm'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              {message.showCalendar && (
                <div className="mt-3">
                  <input
                    type="date"
                    className="w-full p-2 border border-gray-300 rounded text-gray-800"
                    onChange={(e) => {
                      if (e.target.value) {
                        const date = new Date(e.target.value + 'T00:00:00');
                        handleDateSelect(formatDate(date));
                      }
                    }}
                    autoFocus
                  />
                </div>
              )}
              {message.options && (
                <div className="mt-3 space-y-2">
                  {message.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleOptionClick(option)}
                      className={`block w-full text-left p-2 rounded transition-colors ${
                        message.sender === 'user'
                          ? 'bg-blue-700 hover:bg-blue-800'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
              {message.type === 'rating' && (
                <div className="mt-3 flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleOptionClick(num.toString())}
                      className="w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold transition-colors"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs mt-2 opacity-70">
                {formatMessageDate(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {conversationState === 'conversation_end' && (
        <div className="p-4 border-t bg-white">
          <button
            onClick={handleRestart}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {chatbotFlow.conversationEnd.restartText}
          </button>
        </div>
      )}

      {conversationState !== 'conversation_end' && (
        <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={conversationState === 'urgent_auth_dob' && showDatePicker}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!inputValue.trim()}
            >
              Send
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

