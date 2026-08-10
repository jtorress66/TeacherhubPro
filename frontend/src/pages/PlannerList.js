import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Calendar, Plus, ChevronRight, Folder, FolderOpen, FolderPlus, MoreVertical, Edit, Trash2, MoveRight, ChevronDown, ChevronUp } from 'lucide-react';

const API = `${window.location.origin}/api`;

const FOLDER_COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Slate', value: '#64748b' },
];

const PlannerList = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [classes, setClasses] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null); // null = show all, 'unfiled' = unfiled only, folder_id = specific folder
  const [expandedFolders, setExpandedFolders] = useState({});
  
  // Folder dialog state
  const [folderDialog, setFolderDialog] = useState({ open: false, mode: 'create', folder: null });
  const [folderForm, setFolderForm] = useState({ name: '', color: '#6366f1' });
  
  // Move to folder dialog
  const [moveDialog, setMoveDialog] = useState({ open: false, plan: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, classesRes, foldersRes] = await Promise.all([
        axios.get(`${API}/plans`, { withCredentials: true }),
        axios.get(`${API}/classes`, { withCredentials: true }),
        axios.get(`${API}/plan-folders`, { withCredentials: true })
      ]);
      setPlans(plansRes.data.filter(p => !p.is_template));
      setClasses(classesRes.data);
      setFolders(foldersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClassName = (classId) => {
    const cls = classes.find(c => c.class_id === classId);
    return cls ? `${cls.name} (${cls.grade}-${cls.section})` : 'Unknown';
  };

  const getPlanTitle = (plan) => {
    if (plan.plan_type === 'conversational_english') {
      return plan.title || plan.lesson_topic || plan.unit || 'Untitled';
    }
    return plan.unit || plan.story || 'Untitled';
  };

  const getPlanSubtitle = (plan) => {
    if (plan.plan_type === 'conversational_english') {
      return plan.lesson_topic || plan.story || '';
    }
    return plan.story || '';
  };

  const getFilteredPlans = () => {
    if (selectedFolder === null) {
      return plans; // Show all
    } else if (selectedFolder === 'unfiled') {
      return plans.filter(p => !p.folder_id);
    } else {
      return plans.filter(p => p.folder_id === selectedFolder);
    }
  };

  const getUnfiledCount = () => {
    return plans.filter(p => !p.folder_id).length;
  };

  // Folder CRUD
  const handleCreateFolder = async () => {
    if (!folderForm.name.trim()) {
      toast.error(language === 'es' ? 'El nombre es requerido' : 'Name is required');
      return;
    }
    
    try {
      const res = await axios.post(`${API}/plan-folders`, folderForm, { withCredentials: true });
      setFolders(prev => [...prev, res.data]);
      setFolderDialog({ open: false, mode: 'create', folder: null });
      setFolderForm({ name: '', color: '#6366f1' });
      toast.success(language === 'es' ? 'Carpeta creada' : 'Folder created');
    } catch (error) {
      toast.error(language === 'es' ? 'Error al crear carpeta' : 'Error creating folder');
    }
  };

  const handleUpdateFolder = async () => {
    if (!folderForm.name.trim()) {
      toast.error(language === 'es' ? 'El nombre es requerido' : 'Name is required');
      return;
    }
    
    try {
      const res = await axios.put(`${API}/plan-folders/${folderDialog.folder.folder_id}`, folderForm, { withCredentials: true });
      setFolders(prev => prev.map(f => f.folder_id === res.data.folder_id ? res.data : f));
      setFolderDialog({ open: false, mode: 'create', folder: null });
      setFolderForm({ name: '', color: '#6366f1' });
      toast.success(language === 'es' ? 'Carpeta actualizada' : 'Folder updated');
    } catch (error) {
      toast.error(language === 'es' ? 'Error al actualizar carpeta' : 'Error updating folder');
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!confirm(language === 'es' ? '¿Eliminar esta carpeta? Los planes se moverán a "Sin carpeta"' : 'Delete this folder? Plans will be moved to "Unfiled"')) {
      return;
    }
    
    try {
      await axios.delete(`${API}/plan-folders/${folderId}`, { withCredentials: true });
      setFolders(prev => prev.filter(f => f.folder_id !== folderId));
      // Update local plans to remove folder_id
      setPlans(prev => prev.map(p => p.folder_id === folderId ? { ...p, folder_id: null } : p));
      if (selectedFolder === folderId) {
        setSelectedFolder(null);
      }
      toast.success(language === 'es' ? 'Carpeta eliminada' : 'Folder deleted');
    } catch (error) {
      toast.error(language === 'es' ? 'Error al eliminar carpeta' : 'Error deleting folder');
    }
  };

  const handleMovePlan = async (folderId) => {
    if (!moveDialog.plan) return;
    
    try {
      await axios.put(`${API}/plans/${moveDialog.plan.plan_id}/folder`, { folder_id: folderId }, { withCredentials: true });
      setPlans(prev => prev.map(p => p.plan_id === moveDialog.plan.plan_id ? { ...p, folder_id: folderId } : p));
      // Update folder counts
      setFolders(prev => prev.map(f => {
        if (f.folder_id === moveDialog.plan.folder_id) {
          return { ...f, plan_count: Math.max(0, (f.plan_count || 0) - 1) };
        }
        if (f.folder_id === folderId) {
          return { ...f, plan_count: (f.plan_count || 0) + 1 };
        }
        return f;
      }));
      setMoveDialog({ open: false, plan: null });
      toast.success(language === 'es' ? 'Plan movido' : 'Plan moved');
    } catch (error) {
      toast.error(language === 'es' ? 'Error al mover plan' : 'Error moving plan');
    }
  };

  const openEditFolder = (folder) => {
    setFolderForm({ name: folder.name, color: folder.color || '#6366f1' });
    setFolderDialog({ open: true, mode: 'edit', folder });
  };

  const openCreateFolder = () => {
    setFolderForm({ name: '', color: '#6366f1' });
    setFolderDialog({ open: true, mode: 'create', folder: null });
  };

  const toggleFolderExpand = (folderId) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const filteredPlans = getFilteredPlans();

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-slate-800">{t('planner')}</h1>
            <p className="text-slate-500">{language === 'es' ? 'Tus planes de lección' : 'Your lesson plans'}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={openCreateFolder} data-testid="new-folder-btn">
              <FolderPlus className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Nueva Carpeta' : 'New Folder'}
            </Button>
            <Button onClick={() => navigate('/planner/new')} data-testid="new-plan-btn">
              <Plus className="h-4 w-4 mr-2" />
              {t('createPlan')}
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Folders Sidebar */}
          <div className="lg:w-64 flex-shrink-0 space-y-2">
            <h3 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
              <Folder className="h-4 w-4" />
              {language === 'es' ? 'Carpetas' : 'Folders'}
            </h3>
            
            {/* All Plans */}
            <button
              onClick={() => setSelectedFolder(null)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                selectedFolder === null ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:bg-slate-50'
              }`}
              data-testid="folder-all"
            >
              <span className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                {language === 'es' ? 'Todos los planes' : 'All Plans'}
              </span>
              <Badge variant="secondary" className="text-xs">{plans.length}</Badge>
            </button>

            {/* Unfiled */}
            <button
              onClick={() => setSelectedFolder('unfiled')}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                selectedFolder === 'unfiled' ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:bg-slate-50'
              }`}
              data-testid="folder-unfiled"
            >
              <span className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-slate-400" />
                {language === 'es' ? 'Sin carpeta' : 'Unfiled'}
              </span>
              <Badge variant="secondary" className="text-xs">{getUnfiledCount()}</Badge>
            </button>

            {/* User Folders */}
            {folders.map(folder => (
              <div key={folder.folder_id} className="group">
                <button
                  onClick={() => setSelectedFolder(folder.folder_id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                    selectedFolder === folder.folder_id ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  data-testid={`folder-${folder.folder_id}`}
                >
                  <span className="flex items-center gap-2">
                    <Folder className="h-4 w-4" style={{ color: folder.color }} />
                    <span className="truncate max-w-[120px]">{folder.name}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">{folder.plan_count || 0}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded">
                          <MoreVertical className="h-3 w-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditFolder(folder); }}>
                          <Edit className="h-4 w-4 mr-2" />
                          {language === 'es' ? 'Editar' : 'Edit'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.folder_id); }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {language === 'es' ? 'Eliminar' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </button>
              </div>
            ))}
          </div>

          {/* Plans Grid */}
          <div className="flex-1">
            {filteredPlans.length === 0 ? (
              <Card className="bg-white border-slate-100">
                <CardContent className="py-20 text-center">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 text-lg mb-4">
                    {selectedFolder === 'unfiled' 
                      ? (language === 'es' ? 'No hay planes sin carpeta' : 'No unfiled plans')
                      : selectedFolder
                        ? (language === 'es' ? 'Esta carpeta está vacía' : 'This folder is empty')
                        : (language === 'es' ? 'No tienes planes de lección' : "You don't have any lesson plans")
                    }
                  </p>
                  <Button onClick={() => navigate('/planner/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('createPlan')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredPlans.map(plan => (
                  <Card 
                    key={plan.plan_id}
                    className="bg-white border-slate-100 cursor-pointer hover:shadow-md transition-shadow group"
                    onClick={() => navigate(`/planner/${plan.plan_id}`)}
                    data-testid={`plan-card-${plan.plan_id}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading font-semibold text-slate-800 truncate">{getPlanTitle(plan)}</h3>
                          <p className="text-sm text-slate-500 truncate">{getPlanSubtitle(plan)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {(plan.week_start || plan.lesson_date)?.slice(5, 10)}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded">
                                <MoreVertical className="h-4 w-4 text-slate-400" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setMoveDialog({ open: true, plan }); }}>
                                <MoveRight className="h-4 w-4 mr-2" />
                                {language === 'es' ? 'Mover a carpeta' : 'Move to folder'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                        {plan.objective || plan.learning_objectives || (language === 'es' ? 'Sin objetivo definido' : 'No objective defined')}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          {getClassName(plan.class_id)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Folder Dialog */}
      <Dialog open={folderDialog.open} onOpenChange={(open) => !open && setFolderDialog({ open: false, mode: 'create', folder: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {folderDialog.mode === 'create' 
                ? (language === 'es' ? 'Nueva Carpeta' : 'New Folder')
                : (language === 'es' ? 'Editar Carpeta' : 'Edit Folder')
              }
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{language === 'es' ? 'Nombre de la carpeta' : 'Folder name'}</Label>
              <Input
                value={folderForm.name}
                onChange={(e) => setFolderForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder={language === 'es' ? 'Ej: Matemáticas 5to Grado' : 'Ex: Math 5th Grade'}
                data-testid="folder-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label>{language === 'es' ? 'Color' : 'Color'}</Label>
              <div className="flex flex-wrap gap-2">
                {FOLDER_COLORS.map(color => (
                  <button
                    key={color.value}
                    onClick={() => setFolderForm(prev => ({ ...prev, color: color.value }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      folderForm.color === color.value ? 'border-slate-800 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderDialog({ open: false, mode: 'create', folder: null })}>
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button 
              onClick={folderDialog.mode === 'create' ? handleCreateFolder : handleUpdateFolder}
              data-testid="save-folder-btn"
            >
              {language === 'es' ? 'Guardar' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move to Folder Dialog */}
      <Dialog open={moveDialog.open} onOpenChange={(open) => !open && setMoveDialog({ open: false, plan: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'es' ? 'Mover a carpeta' : 'Move to folder'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <button
              onClick={() => handleMovePlan(null)}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 flex items-center gap-3 border border-slate-100"
            >
              <Folder className="h-5 w-5 text-slate-400" />
              <span>{language === 'es' ? 'Sin carpeta' : 'Unfiled'}</span>
            </button>
            {folders.map(folder => (
              <button
                key={folder.folder_id}
                onClick={() => handleMovePlan(folder.folder_id)}
                className={`w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 flex items-center gap-3 border ${
                  moveDialog.plan?.folder_id === folder.folder_id ? 'border-slate-400 bg-slate-50' : 'border-slate-100'
                }`}
              >
                <Folder className="h-5 w-5" style={{ color: folder.color }} />
                <span>{folder.name}</span>
                {moveDialog.plan?.folder_id === folder.folder_id && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {language === 'es' ? 'Actual' : 'Current'}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default PlannerList;
