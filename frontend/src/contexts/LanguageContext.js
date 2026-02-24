import { createContext, useContext, useState, useEffect } from 'react';

// Available languages with their display names and flags
export const availableLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷', nativeName: 'Português' },
  { code: 'de', name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳', nativeName: '中文' },
];

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
    selectLanguage: 'Select Language',
    
    // Days
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    
    // Games
    educationalGames: 'Educational Games',
    myGames: 'My Games',
    createGame: 'Create Game',
    play: 'Play',
    copyLink: 'Copy Link',
    shareToClassroom: 'Share to Classroom',
    deleteGame: 'Delete Game',
    questions: 'Questions',
    gameType: 'Game Type',
    gradeLevel: 'Grade Level',
    
    // Landing Page
    landingHeroTitle: 'Your complete classroom in one platform',
    landingHeroSubtitle: 'Lesson planning, attendance, gradebook, and AI assistant. Everything a teacher needs, in one place.',
    landingBuiltForTeachers: 'Built for teachers',
    landingStartFree: 'Start free',
    landingViewPricing: 'View pricing',
    landingUsedBySchools: 'Used by schools in Puerto Rico and beyond',
    landingEverythingYouNeed: 'Everything you need',
    landingEverythingDesc: 'A complete platform designed specifically for teachers.',
    landingFeatures: 'Features',
    landingAiAssistant: 'AI Assistant',
    landingHomeschool: 'Homeschool',
    landingIntegrations: 'Integrations',
    landingCustomization: 'Customization',
    landingPricing: 'Pricing',
    landingGetStarted: 'Get Started - Log In',
    landingStart: 'Start',
    landingAiLessonPlan: 'AI Lesson Plan',
    landingPresentations: 'Presentations',
    landingGrades: 'Grades',
    landingPlanFaster: 'Plan faster',
    landingPlanFasterDesc: 'Create weekly lesson plans in seconds with our intuitive format.',
    landingWeek1: 'Week 1',
    landingYourBrand: 'Your brand, your style',
    landingYourBrandDesc: "Customize with your school's logo and colors on all documents.",
    landingYourSchool: 'Your School',
    landingCustomBranding: 'Custom branding',
    landingExportPro: 'Export professionally',
    landingExportProDesc: 'Generate PDFs ready to print: plans, report cards, substitute packets.',
    landingDownloadPdf: 'Download PDF',
    landingAiAssistantTitle: 'AI Assistant',
    landingAiAssistantDesc: 'Generate lesson plans, activities, questions and more with AI.',
    landingLessonPlans: 'Lesson plans',
    landingQuizzesTests: 'Quizzes & tests',
    landingDigitalClassroom: 'Your digital classroom',
    landingTryFree: 'Try free for 30 days',
    landingNoCard: 'No credit card required',
    landingFullName: 'Full Name',
    landingCreateAccount: 'Create Free Account',
    landingOrLoginWith: 'Or login with',
    landingHaveAccount: 'Have an account?',
    landingLoginHere: 'Login here',
    landingNeedAccount: 'Need account?',
    landingRegisterHere: 'Register here'
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
    selectLanguage: 'Seleccionar Idioma',
    
    // Days
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    
    // Games
    educationalGames: 'Juegos Educativos',
    myGames: 'Mis Juegos',
    createGame: 'Crear Juego',
    play: 'Jugar',
    copyLink: 'Copiar Enlace',
    shareToClassroom: 'Compartir en Classroom',
    deleteGame: 'Eliminar Juego',
    questions: 'Preguntas',
    gameType: 'Tipo de Juego',
    gradeLevel: 'Nivel de Grado'
  },
  fr: {
    // Navigation
    dashboard: 'Tableau de Bord',
    planner: 'Planificateur',
    attendance: 'Présence',
    gradebook: 'Carnet de Notes',
    classes: 'Classes',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    
    // Auth
    login: 'Connexion',
    register: "S'inscrire",
    email: 'Email',
    password: 'Mot de Passe',
    name: 'Nom',
    signInWithGoogle: 'Se connecter avec Google',
    orContinueWith: 'ou continuer avec',
    dontHaveAccount: "Pas de compte?",
    alreadyHaveAccount: 'Déjà un compte?',
    
    // Dashboard
    welcome: 'Bienvenue',
    todayOverview: "Aperçu d'Aujourd'hui",
    quickActions: 'Actions Rapides',
    attendancePending: 'Présence en Attente',
    upcomingAssignments: 'Devoirs à Venir',
    recentPlans: 'Plans Récents',
    totalClasses: 'Total des Classes',
    totalStudents: 'Total des Élèves',
    totalPlans: 'Total des Plans',
    
    // Classes
    addClass: 'Ajouter Classe',
    className: 'Nom de Classe',
    grade: 'Niveau',
    section: 'Section',
    subject: 'Matière',
    yearTerm: 'Année/Période',
    students: 'Élèves',
    addStudent: 'Ajouter Élève',
    firstName: 'Prénom',
    lastName: 'Nom',
    studentNumber: "Numéro d'Élève",
    parentEmail: 'Email du Parent',
    notes: 'Notes',
    accommodations: 'Aménagements',
    
    // Planner
    weeklyPlan: 'Plan Hebdomadaire',
    createPlan: 'Créer Plan',
    weekOf: 'Semaine du',
    unit: 'Unité',
    story: 'Histoire/Titre',
    objectiveOfWeek: 'Objectif de la Semaine',
    skillsOfWeek: 'Compétences de la Semaine',
    dayTheme: 'Thème du Jour',
    activities: 'Activités',
    materials: 'Matériels',
    standards: 'Standards',
    expectations: 'Attentes',
    firstWeek: 'Première Semaine',
    secondWeek: 'Deuxième Semaine',
    saveAsTemplate: 'Enregistrer comme Modèle',
    duplicateLastWeek: 'Dupliquer Semaine Précédente',
    exportPdf: 'Exporter PDF',
    
    // Common
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    view: 'Voir',
    search: 'Rechercher',
    filter: 'Filtrer',
    loading: 'Chargement...',
    noData: 'Aucune donnée disponible',
    confirmDelete: 'Êtes-vous sûr de vouloir supprimer?',
    success: 'Succès',
    error: 'Erreur',
    from: 'De',
    to: 'À',
    date: 'Date',
    teacher: 'Enseignant',
    selectLanguage: 'Sélectionner la Langue',
    
    // Days
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    
    // Attendance
    takeAttendance: 'Prendre la Présence',
    present: 'Présent',
    absent: 'Absent',
    tardy: 'En Retard',
    excused: 'Excusé',
    markAllPresent: 'Marquer Tous Présents',
    submitAttendance: 'Soumettre Présence',
    
    // Gradebook
    assignments: 'Devoirs',
    createAssignment: 'Créer Devoir',
    title: 'Titre',
    description: 'Description',
    points: 'Points',
    dueDate: 'Date Limite',
    category: 'Catégorie',
    homework: 'Devoir',
    quiz: 'Quiz',
    test: 'Examen',
    project: 'Projet',
    
    // Games
    educationalGames: 'Jeux Éducatifs',
    myGames: 'Mes Jeux',
    createGame: 'Créer Jeu',
    play: 'Jouer',
    copyLink: 'Copier Lien',
    shareToClassroom: 'Partager sur Classroom',
    deleteGame: 'Supprimer Jeu',
    questions: 'Questions',
    gameType: 'Type de Jeu',
    gradeLevel: 'Niveau Scolaire'
  },
  pt: {
    // Navigation
    dashboard: 'Painel',
    planner: 'Planejador',
    attendance: 'Presença',
    gradebook: 'Boletim',
    classes: 'Turmas',
    settings: 'Configurações',
    logout: 'Sair',
    
    // Auth
    login: 'Entrar',
    register: 'Cadastrar',
    email: 'Email',
    password: 'Senha',
    name: 'Nome',
    signInWithGoogle: 'Entrar com Google',
    orContinueWith: 'ou continuar com',
    dontHaveAccount: 'Não tem conta?',
    alreadyHaveAccount: 'Já tem conta?',
    
    // Dashboard
    welcome: 'Bem-vindo',
    todayOverview: 'Resumo de Hoje',
    quickActions: 'Ações Rápidas',
    attendancePending: 'Presença Pendente',
    upcomingAssignments: 'Próximas Tarefas',
    recentPlans: 'Planos Recentes',
    totalClasses: 'Total de Turmas',
    totalStudents: 'Total de Alunos',
    totalPlans: 'Total de Planos',
    
    // Classes
    addClass: 'Adicionar Turma',
    className: 'Nome da Turma',
    grade: 'Série',
    section: 'Seção',
    subject: 'Matéria',
    yearTerm: 'Ano/Período',
    students: 'Alunos',
    addStudent: 'Adicionar Aluno',
    firstName: 'Nome',
    lastName: 'Sobrenome',
    studentNumber: 'Número do Aluno',
    parentEmail: 'Email do Responsável',
    notes: 'Notas',
    accommodations: 'Adaptações',
    
    // Common
    save: 'Salvar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    edit: 'Editar',
    view: 'Ver',
    search: 'Buscar',
    filter: 'Filtrar',
    loading: 'Carregando...',
    noData: 'Nenhum dado disponível',
    confirmDelete: 'Tem certeza que deseja excluir?',
    success: 'Sucesso',
    error: 'Erro',
    from: 'De',
    to: 'Até',
    date: 'Data',
    teacher: 'Professor',
    selectLanguage: 'Selecionar Idioma',
    
    // Days
    monday: 'Segunda',
    tuesday: 'Terça',
    wednesday: 'Quarta',
    thursday: 'Quinta',
    friday: 'Sexta',
    
    // Games
    educationalGames: 'Jogos Educativos',
    myGames: 'Meus Jogos',
    createGame: 'Criar Jogo',
    play: 'Jogar',
    copyLink: 'Copiar Link',
    shareToClassroom: 'Compartilhar no Classroom',
    deleteGame: 'Excluir Jogo',
    questions: 'Perguntas',
    gameType: 'Tipo de Jogo',
    gradeLevel: 'Nível Escolar'
  },
  de: {
    // Navigation
    dashboard: 'Übersicht',
    planner: 'Unterrichtsplaner',
    attendance: 'Anwesenheit',
    gradebook: 'Notenbuch',
    classes: 'Klassen',
    settings: 'Einstellungen',
    logout: 'Abmelden',
    
    // Auth
    login: 'Anmelden',
    register: 'Registrieren',
    email: 'E-Mail',
    password: 'Passwort',
    name: 'Name',
    signInWithGoogle: 'Mit Google anmelden',
    orContinueWith: 'oder weiter mit',
    dontHaveAccount: 'Kein Konto?',
    alreadyHaveAccount: 'Bereits ein Konto?',
    
    // Dashboard
    welcome: 'Willkommen',
    todayOverview: 'Heutige Übersicht',
    quickActions: 'Schnellaktionen',
    attendancePending: 'Anwesenheit ausstehend',
    upcomingAssignments: 'Anstehende Aufgaben',
    recentPlans: 'Aktuelle Pläne',
    totalClasses: 'Gesamtklassen',
    totalStudents: 'Gesamtschüler',
    totalPlans: 'Gesamtpläne',
    
    // Classes
    addClass: 'Klasse hinzufügen',
    className: 'Klassenname',
    grade: 'Klassenstufe',
    section: 'Abschnitt',
    subject: 'Fach',
    yearTerm: 'Jahr/Semester',
    students: 'Schüler',
    addStudent: 'Schüler hinzufügen',
    firstName: 'Vorname',
    lastName: 'Nachname',
    studentNumber: 'Schülernummer',
    parentEmail: 'Eltern-E-Mail',
    notes: 'Notizen',
    accommodations: 'Anpassungen',
    
    // Common
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    view: 'Ansehen',
    search: 'Suchen',
    filter: 'Filtern',
    loading: 'Laden...',
    noData: 'Keine Daten verfügbar',
    confirmDelete: 'Möchten Sie dies wirklich löschen?',
    success: 'Erfolg',
    error: 'Fehler',
    from: 'Von',
    to: 'Bis',
    date: 'Datum',
    teacher: 'Lehrer',
    selectLanguage: 'Sprache auswählen',
    
    // Days
    monday: 'Montag',
    tuesday: 'Dienstag',
    wednesday: 'Mittwoch',
    thursday: 'Donnerstag',
    friday: 'Freitag',
    
    // Games
    educationalGames: 'Lernspiele',
    myGames: 'Meine Spiele',
    createGame: 'Spiel erstellen',
    play: 'Spielen',
    copyLink: 'Link kopieren',
    shareToClassroom: 'Im Classroom teilen',
    deleteGame: 'Spiel löschen',
    questions: 'Fragen',
    gameType: 'Spieltyp',
    gradeLevel: 'Klassenstufe'
  },
  it: {
    // Navigation
    dashboard: 'Pannello',
    planner: 'Pianificatore',
    attendance: 'Presenze',
    gradebook: 'Registro Voti',
    classes: 'Classi',
    settings: 'Impostazioni',
    logout: 'Esci',
    
    // Auth
    login: 'Accedi',
    register: 'Registrati',
    email: 'Email',
    password: 'Password',
    name: 'Nome',
    signInWithGoogle: 'Accedi con Google',
    orContinueWith: 'o continua con',
    dontHaveAccount: 'Non hai un account?',
    alreadyHaveAccount: 'Hai già un account?',
    
    // Dashboard
    welcome: 'Benvenuto',
    todayOverview: 'Panoramica di Oggi',
    quickActions: 'Azioni Rapide',
    attendancePending: 'Presenze in Sospeso',
    upcomingAssignments: 'Compiti in Arrivo',
    recentPlans: 'Piani Recenti',
    totalClasses: 'Totale Classi',
    totalStudents: 'Totale Studenti',
    totalPlans: 'Totale Piani',
    
    // Classes
    addClass: 'Aggiungi Classe',
    className: 'Nome Classe',
    grade: 'Anno',
    section: 'Sezione',
    subject: 'Materia',
    yearTerm: 'Anno/Periodo',
    students: 'Studenti',
    addStudent: 'Aggiungi Studente',
    firstName: 'Nome',
    lastName: 'Cognome',
    studentNumber: 'Numero Studente',
    parentEmail: 'Email Genitore',
    notes: 'Note',
    accommodations: 'Adattamenti',
    
    // Common
    save: 'Salva',
    cancel: 'Annulla',
    delete: 'Elimina',
    edit: 'Modifica',
    view: 'Visualizza',
    search: 'Cerca',
    filter: 'Filtra',
    loading: 'Caricamento...',
    noData: 'Nessun dato disponibile',
    confirmDelete: 'Sei sicuro di voler eliminare?',
    success: 'Successo',
    error: 'Errore',
    from: 'Da',
    to: 'A',
    date: 'Data',
    teacher: 'Insegnante',
    selectLanguage: 'Seleziona Lingua',
    
    // Days
    monday: 'Lunedì',
    tuesday: 'Martedì',
    wednesday: 'Mercoledì',
    thursday: 'Giovedì',
    friday: 'Venerdì',
    
    // Games
    educationalGames: 'Giochi Educativi',
    myGames: 'I Miei Giochi',
    createGame: 'Crea Gioco',
    play: 'Gioca',
    copyLink: 'Copia Link',
    shareToClassroom: 'Condividi su Classroom',
    deleteGame: 'Elimina Gioco',
    questions: 'Domande',
    gameType: 'Tipo di Gioco',
    gradeLevel: 'Livello Scolastico'
  },
  zh: {
    // Navigation
    dashboard: '仪表板',
    planner: '课程计划',
    attendance: '考勤',
    gradebook: '成绩册',
    classes: '班级',
    settings: '设置',
    logout: '退出',
    
    // Auth
    login: '登录',
    register: '注册',
    email: '邮箱',
    password: '密码',
    name: '姓名',
    signInWithGoogle: '使用Google登录',
    orContinueWith: '或使用',
    dontHaveAccount: '没有账户？',
    alreadyHaveAccount: '已有账户？',
    
    // Dashboard
    welcome: '欢迎',
    todayOverview: '今日概览',
    quickActions: '快捷操作',
    attendancePending: '待处理考勤',
    upcomingAssignments: '即将到期作业',
    recentPlans: '最近计划',
    totalClasses: '班级总数',
    totalStudents: '学生总数',
    totalPlans: '计划总数',
    
    // Classes
    addClass: '添加班级',
    className: '班级名称',
    grade: '年级',
    section: '班组',
    subject: '科目',
    yearTerm: '学年/学期',
    students: '学生',
    addStudent: '添加学生',
    firstName: '名',
    lastName: '姓',
    studentNumber: '学号',
    parentEmail: '家长邮箱',
    notes: '备注',
    accommodations: '特殊安排',
    
    // Common
    save: '保存',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    view: '查看',
    search: '搜索',
    filter: '筛选',
    loading: '加载中...',
    noData: '暂无数据',
    confirmDelete: '确定要删除吗？',
    success: '成功',
    error: '错误',
    from: '从',
    to: '到',
    date: '日期',
    teacher: '教师',
    selectLanguage: '选择语言',
    
    // Days
    monday: '星期一',
    tuesday: '星期二',
    wednesday: '星期三',
    thursday: '星期四',
    friday: '星期五',
    
    // Games
    educationalGames: '教育游戏',
    myGames: '我的游戏',
    createGame: '创建游戏',
    play: '开始',
    copyLink: '复制链接',
    shareToClassroom: '分享到Classroom',
    deleteGame: '删除游戏',
    questions: '问题',
    gameType: '游戏类型',
    gradeLevel: '年级水平'
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
    // Cycle through languages
    const codes = availableLanguages.map(l => l.code);
    const currentIndex = codes.indexOf(language);
    const nextIndex = (currentIndex + 1) % codes.length;
    setLanguage(codes[nextIndex]);
  };

  const getCurrentLanguage = () => {
    return availableLanguages.find(l => l.code === language) || availableLanguages[0];
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t, 
      toggleLanguage, 
      getCurrentLanguage,
      availableLanguages 
    }}>
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
