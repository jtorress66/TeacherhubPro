import React, { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import { useAuth } from '../contexts/AuthContext';

const WelcomeTour = ({ language, run, onClose }) => {
  const { user } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);

  // Bilingual tour content
  const tourContent = {
    en: {
      welcome: {
        title: "👋 Welcome to TeacherHubPro!",
        content: "Let's take a quick tour to help you get started. We'll show you the key features that will make your teaching life easier!"
      },
      dashboard: {
        title: "📊 Your Dashboard",
        content: "This is your command center! See your classes at a glance, quick stats, and easy navigation to all features."
      },
      classes: {
        title: "📚 Manage Your Classes",
        content: "Create and organize your classes here. Add students, set grade levels, and keep everything organized by semester."
      },
      lessonPlanner: {
        title: "📝 Lesson Planner",
        content: "Plan your week with ease! Create detailed lesson plans with objectives, activities, and notes for each day."
      },
      attendance: {
        title: "✅ Quick Attendance",
        content: "Take attendance in seconds! Mark students present, absent, or tardy with just one click."
      },
      gradebook: {
        title: "📈 Gradebook & Reports",
        content: "Track student progress with our powerful gradebook. Add assignments, record grades, and generate beautiful reports."
      },
      parentEmail: {
        title: "📧 Parent Communication",
        content: "Send secure portal links to parents so they can view their child's grades and attendance anytime!"
      },
      subPacket: {
        title: "📋 Substitute Packets",
        content: "Going to be absent? Generate comprehensive substitute teacher packets with all the info they need."
      },
      finish: {
        title: "🎉 You're All Set!",
        content: "That's it! You're ready to start using TeacherHubPro. Remember, you can restart this tour anytime from the menu. Happy teaching!"
      }
    },
    es: {
      welcome: {
        title: "👋 ¡Bienvenido a TeacherHubPro!",
        content: "Hagamos un recorrido rápido para ayudarte a comenzar. ¡Te mostraremos las funciones clave que harán tu vida docente más fácil!"
      },
      dashboard: {
        title: "📊 Tu Panel de Control",
        content: "¡Este es tu centro de comando! Ve tus clases de un vistazo, estadísticas rápidas y navegación fácil a todas las funciones."
      },
      classes: {
        title: "📚 Administra tus Clases",
        content: "Crea y organiza tus clases aquí. Agrega estudiantes, establece niveles de grado y mantén todo organizado por semestre."
      },
      lessonPlanner: {
        title: "📝 Planificador de Lecciones",
        content: "¡Planifica tu semana con facilidad! Crea planes de lecciones detallados con objetivos, actividades y notas para cada día."
      },
      attendance: {
        title: "✅ Asistencia Rápida",
        content: "¡Toma asistencia en segundos! Marca a los estudiantes como presentes, ausentes o tardíos con un solo clic."
      },
      gradebook: {
        title: "📈 Libro de Calificaciones e Informes",
        content: "Sigue el progreso de los estudiantes con nuestro poderoso libro de calificaciones. Agrega tareas, registra calificaciones y genera hermosos informes."
      },
      parentEmail: {
        title: "📧 Comunicación con Padres",
        content: "¡Envía enlaces seguros del portal a los padres para que puedan ver las calificaciones y asistencia de sus hijos en cualquier momento!"
      },
      subPacket: {
        title: "📋 Paquetes para Sustitutos",
        content: "¿Vas a estar ausente? Genera paquetes completos para maestros sustitutos con toda la información que necesitan."
      },
      finish: {
        title: "🎉 ¡Todo Listo!",
        content: "¡Eso es todo! Estás listo para comenzar a usar TeacherHubPro. Recuerda, puedes reiniciar este recorrido en cualquier momento desde el menú. ¡Feliz enseñanza!"
      }
    }
  };

  const content = tourContent[language] || tourContent.en;

  const steps = [
    {
      target: 'body',
      content: (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-lime-600 mb-3">{content.welcome.title}</h2>
          <p className="text-gray-600 text-lg">{content.welcome.content}</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-testid="dashboard-link"], [data-testid="nav-dashboard"]',
      content: (
        <div>
          <h3 className="text-xl font-bold text-lime-600 mb-2">{content.dashboard.title}</h3>
          <p className="text-gray-600">{content.dashboard.content}</p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-testid="classes-link"], [data-testid="nav-classes"]',
      content: (
        <div>
          <h3 className="text-xl font-bold text-lime-600 mb-2">{content.classes.title}</h3>
          <p className="text-gray-600">{content.classes.content}</p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-testid="planner-link"], [data-testid="nav-planner"]',
      content: (
        <div>
          <h3 className="text-xl font-bold text-lime-600 mb-2">{content.lessonPlanner.title}</h3>
          <p className="text-gray-600">{content.lessonPlanner.content}</p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-testid="attendance-link"], [data-testid="nav-attendance"]',
      content: (
        <div>
          <h3 className="text-xl font-bold text-lime-600 mb-2">{content.attendance.title}</h3>
          <p className="text-gray-600">{content.attendance.content}</p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-testid="gradebook-link"], [data-testid="nav-gradebook"]',
      content: (
        <div>
          <h3 className="text-xl font-bold text-lime-600 mb-2">{content.gradebook.title}</h3>
          <p className="text-gray-600">{content.gradebook.content}</p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-testid="send-portal-link-btn"], [data-testid="classes-link"]',
      content: (
        <div>
          <h3 className="text-xl font-bold text-lime-600 mb-2">{content.parentEmail.title}</h3>
          <p className="text-gray-600">{content.parentEmail.content}</p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-testid="sub-packet-link"], [data-testid="nav-sub-packet"]',
      content: (
        <div>
          <h3 className="text-xl font-bold text-lime-600 mb-2">{content.subPacket.title}</h3>
          <p className="text-gray-600">{content.subPacket.content}</p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: 'body',
      content: (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-lime-600 mb-3">{content.finish.title}</h2>
          <p className="text-gray-600 text-lg">{content.finish.content}</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
  ];

  const handleJoyrideCallback = (data) => {
    const { status, index, type } = data;
    
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Mark tour as completed
      localStorage.setItem('teacherhubpro_tour_completed', 'true');
      onClose();
    }
  };

  // Custom styles for attention-grabbing look
  const customStyles = {
    options: {
      primaryColor: '#65A30D', // Lime green
      backgroundColor: '#ffffff',
      textColor: '#374151',
      arrowColor: '#ffffff',
      overlayColor: 'rgba(0, 0, 0, 0.6)',
      zIndex: 10000,
    },
    tooltip: {
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 10px 40px rgba(101, 163, 13, 0.3)',
    },
    tooltipContainer: {
      textAlign: 'left',
    },
    tooltipTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
    },
    tooltipContent: {
      fontSize: '15px',
      lineHeight: '1.6',
    },
    buttonNext: {
      backgroundColor: '#65A30D',
      borderRadius: '8px',
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: '600',
    },
    buttonBack: {
      color: '#65A30D',
      marginRight: '10px',
    },
    buttonSkip: {
      color: '#9CA3AF',
    },
    beacon: {
      display: 'none',
    },
    spotlight: {
      borderRadius: '8px',
    },
  };

  const locale = language === 'es' ? {
    back: 'Atrás',
    close: 'Cerrar',
    last: '¡Empezar!',
    next: 'Siguiente',
    skip: 'Saltar',
  } : {
    back: 'Back',
    close: 'Close',
    last: "Let's Go!",
    next: 'Next',
    skip: 'Skip',
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      showSkipButton={true}
      showProgress={true}
      scrollToFirstStep={true}
      disableOverlayClose={false}
      disableCloseOnEsc={false}
      callback={handleJoyrideCallback}
      styles={customStyles}
      locale={locale}
      floaterProps={{
        disableAnimation: false,
      }}
    />
  );
};

export default WelcomeTour;
