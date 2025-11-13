'use client';

import { useState, useEffect, useRef } from 'react';
import chatbotFlowData from '../data/chatbot-flow-fa.json';

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
  | 'course_registration_problems'
  | 'course_registration_close'
  | 'fees_financial_aid_problems'
  | 'fees_financial_aid_close'
  | 'assignments_exams_problems'
  | 'assignments_exams_close'
  | 'course_instructor_problems'
  | 'course_instructor_close'
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
  const [hasSentFirstMessage, setHasSentFirstMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messageIdCounter = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = () => {
    messageIdCounter.current = 0;
    messageIdCounter.current += 1;
    const greeting: Message = {
      id: messageIdCounter.current.toString(),
      text: chatbotFlow.initial.greeting,
      sender: 'bot',
      timestamp: new Date(),
    };
    messageIdCounter.current += 1;
    const question: Message = {
      id: messageIdCounter.current.toString(),
      text: chatbotFlow.initial.question,
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages([greeting, question]);
    setHasSentFirstMessage(false);
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
      case 'course_registration_problems':
        handleCourseRegistrationProblem(input);
        break;
      case 'course_registration_close':
        handleCourseRegistrationClose(input);
        break;
      case 'fees_financial_aid_problems':
        handleFeesFinancialAidProblem(input);
        break;
      case 'fees_financial_aid_close':
        handleFeesFinancialAidClose(input);
        break;
      case 'assignments_exams_problems':
        handleAssignmentsExamsProblem(input);
        break;
      case 'assignments_exams_close':
        handleAssignmentsExamsClose(input);
        break;
      case 'course_instructor_problems':
        handleCourseInstructorProblem(input);
        break;
      case 'course_instructor_close':
        handleCourseInstructorClose(input);
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
    // Show options after first message if not matched
    if (!hasSentFirstMessage) {
      setHasSentFirstMessage(true);
      // Check if input matches any option
      const normalizedOption = option.toLowerCase().trim();
      const matchesOption = chatbotFlow.initial.options.some(
        opt => opt.toLowerCase() === normalizedOption || normalizedOption.includes(opt.toLowerCase())
      );
      
      if (!matchesOption) {
        // Show options if input doesn't match
        addMessage(chatbotFlow.initial.question, 'bot', chatbotFlow.initial.options);
        return;
      }
    }

    // Find which option index was selected
    const optionIndex = chatbotFlow.initial.options.findIndex(
      opt => opt === option || option.includes(opt) || opt.includes(option)
    );

    // Check for urgent assistance (index 4 or contains urgent/کمک فوری)
    if (optionIndex === 4 || option === 'Urgent Assistance' || option.toLowerCase().includes('urgent') || option.includes('کمک فوری')) {
      setConversationState('urgent_auth_email');
      addMessage(chatbotFlow.urgentAssistance.authQuestions[0].question, 'bot');
    } else {
      let topicData;
      
      // Determine topic based on option index or content
      if (optionIndex === 0 || option.includes('ثبت‌نام') || option.toLowerCase().includes('registration')) {
        topicData = chatbotFlow.otherTopics.courseRegistration;
      } else if (optionIndex === 1 || option.includes('هزینه') || option.includes('کمک مالی') || option.toLowerCase().includes('fees') || option.toLowerCase().includes('financial')) {
        topicData = chatbotFlow.otherTopics.feesFinancialAid;
      } else if (optionIndex === 2 || option.includes('تکالیف') || option.includes('امتحانات') || option.toLowerCase().includes('assignments') || option.toLowerCase().includes('exams')) {
        topicData = chatbotFlow.otherTopics.assignmentsExams;
      } else if (optionIndex === 3 || option.includes('استاد') || option.toLowerCase().includes('instructor')) {
        topicData = chatbotFlow.otherTopics.courseInstructor;
      }

      if (topicData) {
        // Special handling for topics with problems lists
        if (optionIndex === 0 || option.includes('ثبت‌نام') || option.toLowerCase().includes('registration')) {
          setConversationState('course_registration_problems');
          const registrationData = chatbotFlow.otherTopics.courseRegistration;
          if (registrationData.problems && registrationData.problems.length > 0) {
            addMessage(
              registrationData.question || 'What course registration problem are you experiencing?',
              'bot',
              registrationData.problems
            );
          } else {
            addMessage(topicData.message, 'bot', topicData.options);
            setConversationState('other_topic');
          }
        } else if (optionIndex === 1 || option.includes('هزینه') || option.includes('کمک مالی') || option.toLowerCase().includes('fees') || option.toLowerCase().includes('financial')) {
          setConversationState('fees_financial_aid_problems');
          const feesData = chatbotFlow.otherTopics.feesFinancialAid;
          if (feesData.problems && feesData.problems.length > 0) {
            addMessage(
              feesData.question || 'What fees or financial aid issue are you experiencing?',
              'bot',
              feesData.problems
            );
          } else {
            addMessage(topicData.message, 'bot', topicData.options);
            setConversationState('other_topic');
          }
        } else if (optionIndex === 2 || option.includes('تکالیف') || option.includes('امتحانات') || option.toLowerCase().includes('assignments') || option.toLowerCase().includes('exams')) {
          setConversationState('assignments_exams_problems');
          const assignmentsData = chatbotFlow.otherTopics.assignmentsExams;
          if (assignmentsData.problems && assignmentsData.problems.length > 0) {
            addMessage(
              assignmentsData.question || 'What assignment or exam issue are you experiencing?',
              'bot',
              assignmentsData.problems
            );
          } else {
            addMessage(topicData.message, 'bot', topicData.options);
            setConversationState('other_topic');
          }
        } else if (optionIndex === 3 || option.includes('استاد') || option.toLowerCase().includes('instructor')) {
          setConversationState('course_instructor_problems');
          const instructorData = chatbotFlow.otherTopics.courseInstructor;
          if (instructorData.problems && instructorData.problems.length > 0) {
            addMessage(
              instructorData.question || 'What issue do you have with your course instructor?',
              'bot',
              instructorData.problems
            );
          } else {
            addMessage(topicData.message, 'bot', topicData.options);
            setConversationState('other_topic');
          }
        } else {
          addMessage(topicData.message, 'bot', topicData.options);
          setConversationState('other_topic');
        }
      } else {
        // If no match, show options with invalid input message
        addMessage(chatbotFlow.responses.invalidInput, 'bot', chatbotFlow.initial.options);
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
      messageIdCounter.current = 0;
      messageIdCounter.current += 1;
      const greeting: Message = {
        id: messageIdCounter.current.toString(),
        text: chatbotFlow.initial.greeting,
        sender: 'bot',
        timestamp: new Date(),
      };
      messageIdCounter.current += 1;
      const question: Message = {
        id: messageIdCounter.current.toString(),
        text: chatbotFlow.initial.question,
        sender: 'bot',
        timestamp: new Date(),
        options: chatbotFlow.initial.options, // Show options when going back to menu
      };
      setMessages([greeting, question]);
      setConversationState('initial');
      setUserData({});
      setShowDatePicker(false);
      setHasSentFirstMessage(true); // Set to true so options are visible
    }
  };

  const handleCourseRegistrationProblem = (problem: string) => {
    // Show the description for the selected problem
    const registrationData = chatbotFlow.otherTopics.courseRegistration;
    const problemDescriptions = registrationData.problemDescriptions as Record<string, string>;
    
    // Find the English key by matching the problem text with the problems array
    const problemIndex = registrationData.problems?.findIndex(p => p === problem) ?? -1;
    const englishKeys = [
      'Cannot register for a course',
      'Course is full',
      'Prerequisites not met',
      'Registration deadline passed',
      'Technical error during registration',
      'Other registration issue'
    ];
    const englishKey = problemIndex >= 0 ? englishKeys[problemIndex] : problem;
    
    const description = problemDescriptions[englishKey] || problemDescriptions[problem] || registrationData.message;
    
    // Show the description
    addMessage(description, 'bot');
    
    // Then ask if they want to close the conversation
    setTimeout(() => {
      setConversationState('course_registration_close');
      addMessage(
        registrationData.closeConversationQuestion || 'Would you like to close this conversation?',
        'bot',
        registrationData.closeOptions || ['Yes, close conversation', 'No, I need more help']
      );
    }, 500);
  };

  const goBackToMenu = () => {
    messageIdCounter.current = 0;
    messageIdCounter.current += 1;
    const greeting: Message = {
      id: messageIdCounter.current.toString(),
      text: chatbotFlow.initial.greeting,
      sender: 'bot',
      timestamp: new Date(),
    };
    messageIdCounter.current += 1;
    const question: Message = {
      id: messageIdCounter.current.toString(),
      text: chatbotFlow.initial.question,
      sender: 'bot',
      timestamp: new Date(),
      options: chatbotFlow.initial.options, // Show options when going back to menu
    };
    setMessages([greeting, question]);
    setConversationState('initial');
    setUserData({});
    setShowDatePicker(false);
    setHasSentFirstMessage(true); // Set to true so options are visible
  };

  const displayContactInfo = (contactKey: string) => {
    const contacts = chatbotFlow.contacts as Record<string, { name: string; title: string; email: string; phone: string }>;
    const contact = contacts[contactKey];
    
    if (contact) {
      const contactInfo = `Contact Information:\n\n${contact.name}\n${contact.title}\n\nEmail: ${contact.email}\nPhone: ${contact.phone}`;
      addMessage(contactInfo, 'bot');
      setTimeout(() => {
        addMessage(chatbotFlow.responses.goodbye, 'bot');
        startSurvey();
      }, 1000);
    } else {
      addMessage(chatbotFlow.responses.goodbye, 'bot');
      startSurvey();
    }
  };

  const handleCourseRegistrationClose = (response: string) => {
    if (response === 'Yes, close conversation' || response.toLowerCase().includes('yes') || response.includes('بله، گفتگو را ببند')) {
      addMessage(chatbotFlow.responses.goodbye, 'bot');
      startSurvey();
    } else if (response === 'Back to Menu' || response === 'بازگشت به منو') {
      goBackToMenu();
    } else if (response === 'Contact Advisor' || response === 'تماس با مشاور') {
      displayContactInfo('Contact Advisor');
    } else {
      // If they need more help, show the original options
      const registrationData = chatbotFlow.otherTopics.courseRegistration;
      addMessage(registrationData.message, 'bot', registrationData.options);
      setConversationState('other_topic');
    }
  };

  const handleFeesFinancialAidProblem = (problem: string) => {
    const feesData = chatbotFlow.otherTopics.feesFinancialAid;
    const problemDescriptions = feesData.problemDescriptions as Record<string, string>;
    
    // Find the English key by matching the problem text with the problems array
    const problemIndex = feesData.problems?.findIndex(p => p === problem) ?? -1;
    const englishKeys = [
      'Payment issues',
      'Financial aid application',
      'Scholarship questions',
      'Tuition fee inquiry',
      'Payment deadline concerns',
      'Other financial aid issue'
    ];
    const englishKey = problemIndex >= 0 ? englishKeys[problemIndex] : problem;
    
    const description = problemDescriptions[englishKey] || problemDescriptions[problem] || feesData.message;
    
    addMessage(description, 'bot');
    
    setTimeout(() => {
      setConversationState('fees_financial_aid_close');
      addMessage(
        feesData.closeConversationQuestion || 'Would you like to close this conversation?',
        'bot',
        feesData.closeOptions || ['Yes, close conversation', 'No, I need more help']
      );
    }, 500);
  };

  const handleFeesFinancialAidClose = (response: string) => {
    if (response === 'Yes, close conversation' || response.toLowerCase().includes('yes') || response.includes('بله، گفتگو را ببند')) {
      addMessage(chatbotFlow.responses.goodbye, 'bot');
      startSurvey();
    } else if (response === 'Back to Menu' || response === 'بازگشت به منو') {
      goBackToMenu();
    } else if (response === 'Contact Financial Aid' || response === 'تماس با کمک مالی') {
      displayContactInfo('Contact Financial Aid');
    } else {
      const feesData = chatbotFlow.otherTopics.feesFinancialAid;
      addMessage(feesData.message, 'bot', feesData.options);
      setConversationState('other_topic');
    }
  };

  const handleAssignmentsExamsProblem = (problem: string) => {
    const assignmentsData = chatbotFlow.otherTopics.assignmentsExams;
    const problemDescriptions = assignmentsData.problemDescriptions as Record<string, string>;
    
    // Find the English key by matching the problem text with the problems array
    const problemIndex = assignmentsData.problems?.findIndex(p => p === problem) ?? -1;
    const englishKeys = [
      'Assignment submission problem',
      'Exam access issues',
      'Grading concerns',
      'Deadline extension request',
      'Technical issues with assignments',
      'Other assignment/exam issue'
    ];
    const englishKey = problemIndex >= 0 ? englishKeys[problemIndex] : problem;
    
    const description = problemDescriptions[englishKey] || problemDescriptions[problem] || assignmentsData.message;
    
    addMessage(description, 'bot');
    
    setTimeout(() => {
      setConversationState('assignments_exams_close');
      addMessage(
        assignmentsData.closeConversationQuestion || 'Would you like to close this conversation?',
        'bot',
        assignmentsData.closeOptions || ['Yes, close conversation', 'No, I need more help']
      );
    }, 500);
  };

  const handleAssignmentsExamsClose = (response: string) => {
    if (response === 'Yes, close conversation' || response.toLowerCase().includes('yes') || response.includes('بله، گفتگو را ببند')) {
      addMessage(chatbotFlow.responses.goodbye, 'bot');
      startSurvey();
    } else if (response === 'Back to Menu' || response === 'بازگشت به منو') {
      goBackToMenu();
    } else if (response === 'Contact Instructor' || response === 'تماس با استاد') {
      displayContactInfo('Contact Instructor');
    } else {
      const assignmentsData = chatbotFlow.otherTopics.assignmentsExams;
      addMessage(assignmentsData.message, 'bot', assignmentsData.options);
      setConversationState('other_topic');
    }
  };

  const handleCourseInstructorProblem = (problem: string) => {
    const instructorData = chatbotFlow.otherTopics.courseInstructor;
    const problemDescriptions = instructorData.problemDescriptions as Record<string, string>;
    
    // Find the English key by matching the problem text with the problems array
    const problemIndex = instructorData.problems?.findIndex(p => p === problem) ?? -1;
    const englishKeys = [
      'Cannot contact instructor',
      'Instructor not responding',
      'Need clarification on course material',
      'Schedule a meeting',
      'Communication preferences',
      'Other instructor issue'
    ];
    const englishKey = problemIndex >= 0 ? englishKeys[problemIndex] : problem;
    
    const description = problemDescriptions[englishKey] || problemDescriptions[problem] || instructorData.message;
    
    addMessage(description, 'bot');
    
    setTimeout(() => {
      setConversationState('course_instructor_close');
      addMessage(
        instructorData.closeConversationQuestion || 'Would you like to close this conversation?',
        'bot',
        instructorData.closeOptions || ['Yes, close conversation', 'No, I need more help']
      );
    }, 500);
  };

  const handleCourseInstructorClose = (response: string) => {
    if (response === 'Yes, close conversation' || response.toLowerCase().includes('yes') || response.includes('بله، گفتگو را ببند')) {
      addMessage(chatbotFlow.responses.goodbye, 'bot');
      startSurvey();
    } else if (response === 'Back to Menu' || response === 'بازگشت به منو') {
      goBackToMenu();
    } else if (response === 'Go to Portal' || response === 'رفتن به پورتال') {
      displayContactInfo('Go to Portal');
    } else {
      const instructorData = chatbotFlow.otherTopics.courseInstructor;
      addMessage(instructorData.message, 'bot', instructorData.options);
      setConversationState('other_topic');
    }
  };

  const handleOtherTopicResponse = (response: string) => {
    if (response === 'Back to Menu' || response === 'بازگشت به منو') {
      goBackToMenu();
    } else if (response === 'Contact Advisor' || response === 'تماس با مشاور') {
      displayContactInfo('Contact Advisor');
    } else if (response === 'Contact Financial Aid' || response === 'تماس با کمک مالی') {
      displayContactInfo('Contact Financial Aid');
    } else if (response === 'Contact Instructor' || response === 'تماس با استاد') {
      displayContactInfo('Contact Instructor');
    } else if (response === 'Go to Portal' || response === 'رفتن به پورتال') {
      displayContactInfo('Go to Portal');
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
    
    if (minutes < 1) return 'همین الان';
    if (minutes < 60) return `${minutes} دقیقه قبل`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ساعت قبل`;
    
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
      const trimmedInput = inputValue.trim();
      addMessage(trimmedInput, 'user');
      handleUserInput(trimmedInput);
      setInputValue('');
    }
  };

  const handleRestart = () => {
    setMessages([]);
    setConversationState('initial');
    setUserData({});
    setShowDatePicker(false);
    setHasSentFirstMessage(false);
    initializeChat();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-xl">چت بات دانشگاه پیام نور</h1>
        <p className="text-sm opacity-90">صحبت با مریم</p>
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
                      className={`block w-full text-right p-2 rounded transition-colors cursor-pointer ${
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
              placeholder="متن پیام خود را وارد کنید..."
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right text-gray-600"
              disabled={conversationState === 'urgent_auth_dob' && showDatePicker}
            />
              <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!inputValue.trim()}
            >
              ارسال
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

