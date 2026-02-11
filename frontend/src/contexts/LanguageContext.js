import { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    planner: 'Lesson Planner',
    attendance: 'Attendance',
    gradebook: 'Gradebook',
    classes: 'Classes',
    settings: 'Settings',
    logout: 'Logout',
    
    // Auth
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    signInWithGoogle: 'Sign in with Google',
    orContinueWith: 'or continue with',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    
    // Dashboard
    welcome: 'Welcome',
    todayOverview: "Today's Overview",
    quickActions: 'Quick Actions',
    attendancePending: 'Attendance Pending',
    upcomingAssignments: 'Upcoming Assignments',
    recentPlans: 'Recent Plans',
    totalClasses: 'Total Classes',
    totalStudents: 'Total Students',
    totalPlans: 'Total Plans',
    
    // Classes
    addClass: 'Add Class',
    className: 'Class Name',
    grade: 'Grade',
    section: 'Section',
    subject: 'Subject',
    yearTerm: 'Year/Term',
    students: 'Students',
    addStudent: 'Add Student',
    firstName: 'First Name',
    lastName: 'Last Name',
    studentNumber: 'Student Number',
    parentEmail: 'Parent Email',
    notes: 'Notes',
    accommodations: 'Accommodations',
    
    // Planner
    weeklyPlan: 'Weekly Plan',
    createPlan: 'Create Plan',
    weekOf: 'Week of',
    unit: 'Unit',
    story: 'Story/Title',
    objectiveOfWeek: 'Objective of the Week',
    skillsOfWeek: 'Skills of the Week',
    dayTheme: 'Day Theme',
    activities: 'Activities',
    materials: 'Materials',
    standards: 'Standards',
    expectations: 'Expectations',
    firstWeek: 'First Week',
    secondWeek: 'Second Week',
    saveAsTemplate: 'Save as Template',
    duplicateLastWeek: 'Duplicate Last Week',
    exportPdf: 'Export PDF',
    
    // Taxonomy levels
    level1Memory: 'Level 1: Memory',
    level2Processing: 'Level 2: Processing',
    level3Strategic: 'Level 3: Strategic Thinking',
    level4Extended: 'Level 4: Extended Thinking',
    
    // Activities
    brainstorming: 'Brainstorming',
    buildingBackground: 'Building Background',
    vocabularyDevelopment: 'Vocabulary Development',
    readPages: 'Read Pages',
    guidedReading: 'Guided & Choral Reading',
    oralQuestions: 'Oral Questions',
    comprehensionQuestions: 'Comprehension Questions',
    exercisePractice: 'Exercise Practice',
    other: 'Other',
    
    // Materials
    book: 'Book',
    notebook: 'Notebook',
    teachersGuide: "Teacher's Guide",
    testQuiz: 'Test/Quiz',
    dictionary: 'Dictionary',
    handouts: 'Handouts',
    
    // Standards domains
    listeningAndSpeaking: 'Listening/Speaking',
    foundationalSkills: 'Foundational Skills',
    reading: 'Reading',
    writing: 'Writing',
    language: 'Language',
    
    // Subject integration
    mathematics: 'Mathematics',
    spanish: 'Spanish',
    socialStudies: 'Social Studies',
    science: 'Science',
    health: 'Health',
    art: 'Art',
    physicalEducation: 'Physical Education',
    religion: 'Religion',
    
    // Attendance
    takeAttendance: 'Take Attendance',
    present: 'Present',
    absent: 'Absent',
    tardy: 'Tardy',
    excused: 'Excused',
    markAllPresent: 'Mark All Present',
    submitAttendance: 'Submit Attendance',
    attendanceReport: 'Attendance Report',
    
    // Gradebook
    assignments: 'Assignments',
    createAssignment: 'Create Assignment',
    title: 'Title',
    description: 'Description',
    points: 'Points',
    dueDate: 'Due Date',
    category: 'Category',
    homework: 'Homework',
    quiz: 'Quiz',
    test: 'Test',
    project: 'Project',
    gradeEntry: 'Grade Entry',
    missing: 'Missing',
    late: 'Late',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    search: 'Search',
    filter: 'Filter',
    loading: 'Loading...',
    noData: 'No data available',
    confirmDelete: 'Are you sure you want to delete this?',
    success: 'Success',
    error: 'Error',
    from: 'From',
    to: 'To',
    date: 'Date',
    teacher: 'Teacher',
    
    // Days
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday'
  },
  es: {
    // Navigation
    dashboard: 'Panel',
    planner: 'Planificador',
    attendance: 'Asistencia',
    gradebook: 'Notas',
    classes: 'Clases',
    settings: 'Configuración',
    logout: 'Cerrar Sesión',
    
    // Auth
    login: 'Iniciar Sesión',
    register: 'Registrarse',
    email: 'Correo Electrónico',
    password: 'Contraseña',
    name: 'Nombre',
    signInWithGoogle: 'Iniciar sesión con Google',
    orContinueWith: 'o continuar con',
    dontHaveAccount: '¿No tienes cuenta?',
    alreadyHaveAccount: '¿Ya tienes cuenta?',
    
    // Dashboard
    welcome: 'Bienvenido',
    todayOverview: 'Resumen de Hoy',
    quickActions: 'Acciones Rápidas',
    attendancePending: 'Asistencia Pendiente',
    upcomingAssignments: 'Próximas Tareas',
    recentPlans: 'Planes Recientes',
    totalClasses: 'Total de Clases',
    totalStudents: 'Total de Estudiantes',
    totalPlans: 'Total de Planes',
    
    // Classes
    addClass: 'Agregar Clase',
    className: 'Nombre de Clase',
    grade: 'Grado',
    section: 'Sección',
    subject: 'Materia',
    yearTerm: 'Año/Período',
    students: 'Estudiantes',
    addStudent: 'Agregar Estudiante',
    firstName: 'Nombre',
    lastName: 'Apellido',
    studentNumber: 'Número de Estudiante',
    parentEmail: 'Correo del Padre',
    notes: 'Notas',
    accommodations: 'Acomodaciones',
    
    // Planner
    weeklyPlan: 'Plan Semanal',
    createPlan: 'Crear Plan',
    weekOf: 'Semana del',
    unit: 'Unidad',
    story: 'Historia/Título',
    objectiveOfWeek: 'Objetivo de la Semana',
    skillsOfWeek: 'Destrezas de la Semana',
    dayTheme: 'Tema del Día',
    activities: 'Actividades',
    materials: 'Materiales',
    standards: 'Estándares',
    expectations: 'Expectativas',
    firstWeek: 'Primera Semana',
    secondWeek: 'Segunda Semana',
    saveAsTemplate: 'Guardar como Plantilla',
    duplicateLastWeek: 'Duplicar Última Semana',
    exportPdf: 'Exportar PDF',
    
    // Taxonomy levels
    level1Memory: 'Nivel 1: Memoria',
    level2Processing: 'Nivel 2: Procesamiento',
    level3Strategic: 'Nivel 3: Pensamiento Estratégico',
    level4Extended: 'Nivel 4: Pensamiento Extendido',
    
    // Activities
    brainstorming: 'Lluvia de Ideas',
    buildingBackground: 'Construir Conocimiento Previo',
    vocabularyDevelopment: 'Desarrollo de Vocabulario',
    readPages: 'Leer Páginas',
    guidedReading: 'Lectura Guiada y Coral',
    oralQuestions: 'Preguntas Orales',
    comprehensionQuestions: 'Preguntas de Comprensión',
    exercisePractice: 'Práctica de Ejercicios',
    other: 'Otro',
    
    // Materials
    book: 'Libro',
    notebook: 'Cuaderno',
    teachersGuide: 'Guía del Maestro',
    testQuiz: 'Prueba/Examen',
    dictionary: 'Diccionario',
    handouts: 'Hojas de Trabajo',
    
    // Standards domains
    listeningAndSpeaking: 'Escuchar/Hablar',
    foundationalSkills: 'Destrezas Fundamentales',
    reading: 'Lectura',
    writing: 'Escritura',
    language: 'Lenguaje',
    
    // Subject integration
    mathematics: 'Matemáticas',
    spanish: 'Español',
    socialStudies: 'Estudios Sociales',
    science: 'Ciencias',
    health: 'Salud',
    art: 'Arte',
    physicalEducation: 'Educación Física',
    religion: 'Religión',
    
    // Attendance
    takeAttendance: 'Tomar Asistencia',
    present: 'Presente',
    absent: 'Ausente',
    tardy: 'Tardanza',
    excused: 'Excusado',
    markAllPresent: 'Marcar Todos Presente',
    submitAttendance: 'Enviar Asistencia',
    attendanceReport: 'Reporte de Asistencia',
    
    // Gradebook
    assignments: 'Tareas',
    createAssignment: 'Crear Tarea',
    title: 'Título',
    description: 'Descripción',
    points: 'Puntos',
    dueDate: 'Fecha de Entrega',
    category: 'Categoría',
    homework: 'Tarea',
    quiz: 'Prueba Corta',
    test: 'Examen',
    project: 'Proyecto',
    gradeEntry: 'Entrada de Notas',
    missing: 'Falta',
    late: 'Tarde',
    
    // Common
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    view: 'Ver',
    search: 'Buscar',
    filter: 'Filtrar',
    loading: 'Cargando...',
    noData: 'No hay datos disponibles',
    confirmDelete: '¿Estás seguro de que deseas eliminar esto?',
    success: 'Éxito',
    error: 'Error',
    from: 'Desde',
    to: 'Hasta',
    date: 'Fecha',
    teacher: 'Maestro',
    
    // Days
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes'
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('teacherhub_language') || 'es';
  });

  useEffect(() => {
    localStorage.setItem('teacherhub_language', language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'es' : 'en');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
