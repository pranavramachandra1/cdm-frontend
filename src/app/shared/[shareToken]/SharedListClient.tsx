'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ListResponse } from '@/lib/lists';
import { TaskCreate, TaskUpdate } from '@/lib/tasks';
import MarkdownEditor from '@/components/MarkdownEditor';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { useResizablePanel } from '@/hooks/useResizablePanel';

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
}

interface User {
  user_id?: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  google_id: string;
}

interface SessionData {
  google: GoogleUserInfo;
  user: User;
  isNewUser: boolean;
}

interface Task {
  task_id: string;
  user_id: string;
  task_name: string;
  reminders: string[];
  isComplete: boolean;
  isPriority: boolean;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
  list_id: string;
  description?: string;
}

interface SharedListClientProps {
  sharedList: ListResponse;
  userSessionData: SessionData;
  shareToken: string;
}

export default function SharedListClient({ sharedList, userSessionData }: SharedListClientProps) {
  const { user, google } = userSessionData;

  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Task creation form state
  const [showCreateTaskForm, setShowCreateTaskForm] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskReminders, setNewTaskReminders] = useState<string[]>([]);
  const [newTaskIsPriority, setNewTaskIsPriority] = useState(false);
  const [newTaskIsRecurring, setNewTaskIsRecurring] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Mobile UI state
  const [activePanel, setActivePanel] = useState<'tasks' | 'details'>('tasks');
  
  // Resizable panel hook
  const { width: rightPanelWidth, isResizing, handleMouseDown } = useResizablePanel(
    400, // default width
    300, // min width  
    600, // max width
    'shared-taskable-right-panel-width'
  );
  
  // Task editing form state:
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [showEditTaskForm, setShowEditTaskForm] = useState(false);
  const [currentEditTask, setCurrentEditTask] = useState<Task | null>(null);
  const [editTaskName, setEditTaskName] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskReminders, setEditTaskReminders] = useState<string[]>([]);
  const [editTaskIsPriority, setEditTaskIsPriority] = useState(false);
  const [editTaskIsRecurring, setEditTaskIsRecurring] = useState(false);
  
  // Task viewing state:
  const [showViewTaskForm, setShowViewTaskForm] = useState(false);
  const [currentViewTask, setCurrentViewTask] = useState<Task | null>(null);
  
  // Right panel visibility state
  const [showRightPanel, setShowRightPanel] = useState(false);

  // Priority filter state
  const [showPriorityOnly, setShowPriorityOnly] = useState(false);

  // Toggle right panel visibility
  const toggleRightPanel = () => {
    setShowRightPanel(!showRightPanel);
  };

  // Fetch tasks for the shared list on component mount
  useEffect(() => {
    const fetchSharedListTasks = async () => {
      try {
        console.log('✅ Fetching current tasks for shared list:', sharedList.list_id);
        const response = await fetch(`/api/tasks/list/${sharedList.list_id}/current`);
        console.log(`📨 Response status: ${response.status}`);
        
        if (response.ok) {
          const currentTasks = await response.json();
          console.log(`✅ Successfully loaded ${currentTasks.length} current tasks`);
          setTasks(currentTasks);
          if (currentTasks.length > 0) {
            setSelectedTask(currentTasks[0]);
          }
        } else {
          const errorData = await response.json();
          console.error(`❌ Failed to fetch current tasks. Status: ${response.status}`);
          console.error('❌ Error details:', errorData);
        }
      } catch (error) {
        console.error('Error fetching current tasks:', error);
      }
    };

    fetchSharedListTasks();
  }, [sharedList]);

  // Handle task creation
  const handleCreateTask = async () => {
    console.log('🎯 handleCreateTask called');
    if (!newTaskName.trim()) {
      console.log('❌ No task name');
      return;
    }
    
    const userId = user.user_id || user.google_id;
    if (!userId) {
      console.log('❌ No user ID available');
      return;
    }
    
    console.log('✅ Creating task for shared list:', { 
      newTaskName, 
      sharedList: sharedList.list_id,
      userId,
      sharedListFull: sharedList 
    });
    setIsCreatingTask(true);
    
    try {
      const taskData: TaskCreate = {
        user_id: userId,
        list_id: sharedList.list_id,
        task_name: newTaskName.trim(),
        reminders: newTaskReminders,
        isPriority: newTaskIsPriority,
        isRecurring: newTaskIsRecurring,
        list_version: sharedList.version || 1,
        description: newTaskDescription.trim() || undefined,
      };
      
      console.log('📤 Sending task data:', taskData);
      
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      console.log('📨 Response status:', response.status);
      
      if (response.ok) {
        const newTask = await response.json();
        setTasks(prev => [...prev, newTask]);
        
        // Reset form
        setNewTaskName('');
        setNewTaskDescription('');
        setNewTaskReminders([]);
        setNewTaskIsPriority(false);
        setNewTaskIsRecurring(false);
        setShowCreateTaskForm(false);
        
        // On mobile, redirect to tasks pane after creating task
        setActivePanel('tasks');
        
        console.log('✅ Task created:', newTask);
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to create task. Status:', response.status);
        console.error('❌ Error details:', errorData);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleEditTask = async () => {
    console.log('🎯 handleEditTask called');

    if (!currentEditTask || !editTaskName.trim()) {
      console.log('❌ No task to edit or empty task name');
      return;
    }

    const taskId = currentEditTask.task_id;
    console.log('✅ Editing task:', { 
      taskId,
      taskName: editTaskName,
      description: editTaskDescription,
      reminders: editTaskReminders,
      isPriority: editTaskIsPriority,
      isRecurring: editTaskIsRecurring
    });

    setIsEditingTask(true);
    
    try {
      const taskEditData: TaskUpdate = {
        task_name: editTaskName.trim(),
        reminders: editTaskReminders,
        isPriority: editTaskIsPriority,
        isRecurring: editTaskIsRecurring,
        description: editTaskDescription.trim() || undefined,
      };

      console.log('📤 Updating task data:', taskEditData);

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskEditData)
      });

      console.log('📨 Response status:', response.status);

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(prev => prev.map(task => 
          task.task_id === updatedTask.task_id ? updatedTask : task
        ));

        // Reset form
        setEditTaskName('');
        setEditTaskDescription('');
        setEditTaskReminders([]);
        setEditTaskIsPriority(false);
        setEditTaskIsRecurring(false);
        setShowEditTaskForm(false);
        setCurrentEditTask(null);
        
        // On mobile, redirect to tasks pane after editing task
        setActivePanel('tasks');
        
        console.log('✅ Task edited:', updatedTask);
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to edit task. Status:', response.status);
        console.error('❌ Error details:', errorData);
      }
    } catch (error) {
      console.error('Error editing task:', error);
    } finally {
      setIsEditingTask(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!currentEditTask) {
      console.log('❌ No task to delete');
      return;
    }

    const taskId = currentEditTask.task_id;
    console.log('🗑️ Deleting task:', taskId);

    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setTasks(prev => prev.filter(task => task.task_id !== taskId));
        
        // Reset form
        setEditTaskName('');
        setEditTaskDescription('');
        setEditTaskReminders([]);
        setEditTaskIsPriority(false);
        setEditTaskIsRecurring(false);
        setShowEditTaskForm(false);
        setCurrentEditTask(null);
        
        // On mobile, redirect to tasks pane after deleting task
        setActivePanel('tasks');
        
        console.log('✅ Task deleted successfully');
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to delete task. Status:', response.status);
        console.error('❌ Error details:', errorData);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Helper function to add reminder date (for creating)
  const addReminderDate = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1); // Default to 1 hour from now
    setNewTaskReminders(prev => [...prev, now.toISOString().slice(0, 16)]);
  };

  // Helper function to remove reminder date (for creating)
  const removeReminderDate = (index: number) => {
    setNewTaskReminders(prev => prev.filter((_, i) => i !== index));
  };

  // Helper function to update reminder date (for creating)
  const updateReminderDate = (index: number, newDate: string) => {
    setNewTaskReminders(prev => prev.map((date, i) => i === index ? newDate : date));
  };

  // Helper functions for editing reminders
  const addEditReminderDate = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    setEditTaskReminders(prev => [...prev, now.toISOString().slice(0, 16)]);
  };

  const removeEditReminderDate = (index: number) => {
    setEditTaskReminders(prev => prev.filter((_, i) => i !== index));
  };

  const updateEditReminderDate = (index: number, newDate: string) => {
    setEditTaskReminders(prev => prev.map((date, i) => i === index ? newDate : date));
  };

  // Function to start editing a task
  const startEditingTask = (task: Task) => {
    setCurrentEditTask(task);
    setEditTaskName(task.task_name);
    setEditTaskDescription(task.description || '');
    setEditTaskReminders([...task.reminders]);
    setEditTaskIsPriority(task.isPriority);
    setEditTaskIsRecurring(task.isRecurring);
    setShowEditTaskForm(true);
    setShowCreateTaskForm(false); // Hide create form
    setShowViewTaskForm(false); // Hide view form
    setShowRightPanel(true); // Show right panel
  };

  // Function to start viewing a task
  const startViewingTask = (task: Task) => {
    setCurrentViewTask(task);
    setShowViewTaskForm(true);
    setShowEditTaskForm(false); // Hide edit form
    setShowCreateTaskForm(false); // Hide create form
    setShowRightPanel(true); // Show right panel
  };

  const toggleTaskCompletion = async (taskId: string) => {
    try {
      console.log('🔄 Toggling task completion for:', taskId);
      
      // Find the current task to get its current state
      const currentTask = tasks.find(task => task.task_id === taskId);
      if (!currentTask) {
        console.error('❌ Task not found:', taskId);
        return;
      }
      
      // Optimistically update UI
      setTasks(prev => prev.map(task => 
        task.task_id === taskId ? { ...task, isComplete: !task.isComplete } : task
      ));

      // Call API to persist the change using PUT request
      const taskUpdateData: TaskUpdate = {
        isComplete: !currentTask.isComplete
      };

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskUpdateData)
      });

      if (response.ok) {
        const updatedTask = await response.json();
        
        // Update with server response to ensure consistency
        setTasks(prev => prev.map(task => 
          task.task_id === updatedTask.task_id ? updatedTask : task
        ));
        
        console.log('✅ Task completion toggled successfully:', updatedTask);
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to toggle task completion. Status:', response.status);
        console.error('❌ Error details:', errorData);
        
        // Revert optimistic update on error
        setTasks(prev => prev.map(task => 
          task.task_id === taskId ? { ...task, isComplete: !task.isComplete } : task
        ));
      }
    } catch (error) {
      console.error('❌ Failed to toggle task completion:', error);
      
      // Revert optimistic update on error
      setTasks(prev => prev.map(task => 
        task.task_id === taskId ? { ...task, isComplete: !task.isComplete } : task
      ));
    }
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-gray-50 group/design-root overflow-x-hidden" style={{ fontFamily: 'Manrope, "Noto Sans", sans-serif' }}>
      {/* Shared List Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
                src="/images/taskable_logo_wide_no_bknd.png"
                alt="Taskable Logo"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            {google.picture && (
              <Image
                src={google.picture}
                alt={`${user.first_name}'s profile`}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full"
              />
            )}
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-[#111418] text-lg font-semibold">{sharedList.list_name}</h1>
                <p className="text-[#5e7387] text-xs">Shared list • Viewing as {user.first_name}</p>
              </div>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-[#b8cee4] text-[#111418] text-sm font-medium rounded-xl hover:bg-[#a5c1db] transition-colors"
          >
            Go to My Dashboard
          </Link>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-20">
        <div className="flex justify-around">
          <button
            onClick={() => setActivePanel('tasks')}
            className={`flex flex-col items-center py-2 px-4 rounded-lg min-h-[44px] ${activePanel === 'tasks' ? 'bg-[#b8cee4] text-[#111418]' : 'text-[#5e7387]'}`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <span className="text-xs mt-1">Tasks</span>
          </button>
          <button
            onClick={() => setActivePanel('details')}
            className={`flex flex-col items-center py-2 px-4 rounded-lg min-h-[44px] ${activePanel === 'details' ? 'bg-[#b8cee4] text-[#111418]' : 'text-[#5e7387]'}`}
          >
            <PencilIcon />
            <span className="text-xs mt-1">Actions</span>
          </button>
        </div>
      </div>

      {/* Plus/Arrow Button - Top Right Corner */}
      <button
        onClick={toggleRightPanel}
        className="fixed top-20 right-4 z-30 p-3 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 min-h-[44px] min-w-[44px]"
        title={showRightPanel ? "Hide Task Actions" : "Show Task Actions"}
      >
        {showRightPanel ? <ArrowRightIcon /> : <PlusIcon />}
      </button>

      <div className="layout-container flex h-full grow flex-col lg:flex-row">
        <div className="flex flex-1 lg:gap-1 lg:px-6 lg:py-5">
          {/* Main Task List */}
          <div className={`layout-content-container flex flex-col flex-1 ${activePanel === 'tasks' ? 'block' : 'hidden'} lg:block pb-20 lg:pb-0`} style={{ 
            marginRight: showRightPanel && typeof window !== 'undefined' ? `${rightPanelWidth}px` : showRightPanel ? '400px' : '0px' 
          }}>
            
            <div className="flex justify-between gap-2 px-4 py-3">
              <div className="flex gap-2">
                <button 
                  className={`p-3 rounded-lg transition-colors min-h-[44px] min-w-[44px] ${
                    showPriorityOnly 
                      ? 'text-[#111418] bg-[#b8cee4] hover:bg-[#a5c1db]' 
                      : 'text-[#111418] hover:bg-[#eaedf0]'
                  }`}
                  title={showPriorityOnly ? "Show all tasks" : "Show priority tasks only"}
                  onClick={() => setShowPriorityOnly(!showPriorityOnly)}
                >
                  {showPriorityOnly ? <StarIcon /> : <StarOutlineIcon />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between px-4 pb-3 pt-5">
              <h2 className="text-[#111418] text-[22px] font-bold leading-tight tracking-[-0.015em]">
                Tasks ({tasks.length})
              </h2>
            </div>
            
            {(showPriorityOnly ? tasks.filter(task => task.isPriority) : tasks).map((task) => (
              <div
                key={task.task_id}
                className={`flex items-center gap-4 bg-gray-50 px-4 min-h-[72px] py-3 justify-between hover:bg-[#eaedf0] touch-manipulation ${
                  selectedTask?.task_id === task.task_id ? 'bg-[#eaedf0]' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="flex items-center justify-center p-2 min-h-[44px] min-w-[44px] -ml-2 touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      toggleTaskCompletion(task.task_id);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={task.isComplete}
                      onChange={() => {}} // Controlled by parent div click
                      className="w-6 h-6 rounded border-[#d5dbe2] text-[#b8cee4] focus:ring-[#b8cee4] pointer-events-none"
                      tabIndex={-1}
                    />
                  </div>
                  <div 
                    className="flex flex-col justify-center flex-1 cursor-pointer py-2 touch-manipulation"
                    onClick={() => {
                      setSelectedTask(task);
                      setActivePanel('details');
                      setShowRightPanel(true);
                    }}
                  >
                    <p className={`text-[#111418] text-base font-medium leading-normal line-clamp-1 ${
                      task.isComplete ? 'line-through opacity-60' : ''
                    }`}>
                      {task.task_name}
                    </p>
                    <div className="text-[#5e7387] text-sm font-normal leading-normal line-clamp-2">
                      {task.description ? (
                        <MarkdownRenderer content={task.description} />
                      ) : (
                        <span>{task.isPriority ? '⭐ Priority Task' : 'Regular Task'}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="shrink-0">
                  <div className="text-[#111418] flex items-center justify-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startViewingTask(task);
                        setActivePanel('details');
                      }}
                      className="hover:bg-[#eaedf0] p-3 rounded-lg transition-colors min-h-[44px] min-w-[44px] touch-manipulation"
                      title="View task details"
                    >
                      <EyeIcon />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingTask(task);
                        setActivePanel('details');
                      }}
                      className="hover:bg-[#eaedf0] p-3 rounded-lg transition-colors min-h-[44px] min-w-[44px] touch-manipulation"
                      title="Edit task"
                    >
                      <PencilIcon />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <h3 className="text-lg font-medium text-[#111418] mb-2">No tasks yet</h3>
                  <p className="text-[#5e7387] mb-4">This shared list doesn&apos;t have any tasks. Start by adding one!</p>
                  <button
                    onClick={() => {
                      setShowCreateTaskForm(true);
                      setShowRightPanel(true);
                      setActivePanel('details');
                    }}
                    className="px-4 py-2 bg-[#b8cee4] text-[#111418] text-sm font-medium rounded-xl hover:bg-[#a5c1db] transition-colors"
                  >
                    Add First Task
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Task Creation/Edit Form */}
          <div 
            className={`layout-content-container flex flex-col ${(activePanel === 'details' && showRightPanel) ? 'block' : showRightPanel ? 'block' : 'hidden'} lg:${showRightPanel ? 'block' : 'hidden'} absolute lg:fixed inset-x-0 top-0 bottom-0 lg:inset-auto bg-white z-10 lg:z-auto pb-20 lg:pb-0 lg:top-0 lg:bottom-0 lg:right-0`}
            style={{ width: typeof window !== 'undefined' ? `${rightPanelWidth}px` : '400px' }}
          >
            {/* Resize Handle */}
            <div 
              className={`hidden lg:block absolute left-0 top-0 bottom-0 w-1 cursor-col-resize transition-colors ${
                isResizing ? 'bg-blue-400' : 'bg-gray-300 hover:bg-gray-400'
              }`}
              onMouseDown={handleMouseDown}
            />
            <div className="flex items-center justify-between px-4 pb-3 pt-5">
              {/* Mobile back button */}
              <button
                onClick={() => setActivePanel('tasks')}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-200 min-h-[44px] min-w-[44px] mr-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-[#111418] text-[22px] font-bold leading-tight tracking-[-0.015em]">
                {showCreateTaskForm ? 'Create New Task' : 
                 showEditTaskForm ? 'Edit Task' : 
                 showViewTaskForm ? 'View Task' : 'Task Actions'}
              </h2>
            </div>
            
            {/* Task Actions Menu */}
            {!showCreateTaskForm && !showEditTaskForm && !showViewTaskForm && (
              <div className="flex flex-col gap-3 px-4 pb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <h3 className="text-[#111418] text-sm font-semibold mb-3">Quick Actions</h3>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setShowCreateTaskForm(true);
                        setShowEditTaskForm(false);
                        setShowRightPanel(true);
                      }}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white transition-colors text-left min-h-[44px] touch-manipulation"
                    >
                      <div className="text-[#111418] flex-shrink-0">
                        <PlusIcon />
                      </div>
                      <div>
                        <p className="text-[#111418] text-sm font-medium">Add New Task</p>
                        <p className="text-[#5e7387] text-xs">Create a new task with description</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            
            {/* Task Creation Form */}
            {showCreateTaskForm ? (
              <div className="flex flex-col gap-4 px-4 pb-4">
                {/* Task Name Field */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#111418] text-base font-medium">Task Name</label>
                  <input
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="Enter task name..."
                    className="w-full px-4 py-4 border border-[#d5dbe2] rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#b8cee4] focus:border-[#b8cee4] min-h-[44px] touch-manipulation"
                    autoFocus
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="sentences"
                  />
                </div>

                {/* Description Field */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#111418] text-base font-medium">Description</label>
                  <MarkdownEditor
                    value={newTaskDescription}
                    onChange={setNewTaskDescription}
                    placeholder="Add a description for this task (optional)..."
                    rows={3}
                  />
                </div>

                {/* Reminders Section */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[#111418] text-base font-medium">Reminders</label>
                    <button
                      type="button"
                      onClick={addReminderDate}
                      className="text-sm text-[#b8cee4] hover:text-[#a5c1db] font-medium"
                    >
                      + Add Reminder
                    </button>
                  </div>
                  
                  {newTaskReminders.map((reminder, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="datetime-local"
                        value={reminder}
                        onChange={(e) => updateReminderDate(index, e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="flex-1 px-4 py-4 border border-[#d5dbe2] rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#b8cee4] focus:border-[#b8cee4] min-h-[44px] touch-manipulation"
                      />
                      <button
                        type="button"
                        onClick={() => removeReminderDate(index)}
                        className="text-red-500 hover:text-red-700 text-base p-3 min-h-[44px] min-w-[44px] touch-manipulation rounded-lg hover:bg-red-50"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  
                  {newTaskReminders.length === 0 && (
                    <p className="text-[#5e7387] text-sm italic">No reminders set</p>
                  )}
                </div>

                {/* Priority Checkbox */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPriority"
                    checked={newTaskIsPriority}
                    onChange={(e) => setNewTaskIsPriority(e.target.checked)}
                    className="w-5 h-5 text-[#b8cee4] border-[#d5dbe2] rounded focus:ring-[#b8cee4] touch-manipulation"
                  />
                  <label htmlFor="isPriority" className="text-[#111418] text-base font-medium cursor-pointer">
                    High Priority
                  </label>
                </div>

                {/* Recurring Checkbox */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={newTaskIsRecurring}
                    onChange={(e) => setNewTaskIsRecurring(e.target.checked)}
                    className="w-5 h-5 text-[#b8cee4] border-[#d5dbe2] rounded focus:ring-[#b8cee4] touch-manipulation"
                  />
                  <label htmlFor="isRecurring" className="text-[#111418] text-base font-medium cursor-pointer">
                    Recurring Task
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleCreateTask}
                    disabled={!newTaskName.trim() || isCreatingTask}
                    className="flex-1 px-4 py-4 bg-[#b8cee4] text-[#111418] text-base font-medium rounded-xl hover:bg-[#a5c1db] disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] touch-manipulation"
                  >
                    {isCreatingTask ? 'Creating...' : 'Create Task'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateTaskForm(false);
                      setNewTaskName('');
                      setNewTaskDescription('');
                      setNewTaskReminders([]);
                      setNewTaskIsPriority(false);
                      setNewTaskIsRecurring(false);
                      setShowViewTaskForm(false);
                      setCurrentViewTask(null);
                      setShowRightPanel(false); // Hide right panel
                      // On mobile, redirect to tasks pane after canceling
                      setActivePanel('tasks');
                    }}
                    className="px-4 py-4 bg-[#eaedf0] text-[#111418] text-base font-medium rounded-xl hover:bg-[#d5dbe2] transition-colors min-h-[44px] touch-manipulation"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : showEditTaskForm && currentEditTask ? (
              <div className="flex flex-col gap-4 px-4 pb-4">
                {/* Task Name Field */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#111418] text-base font-medium">Task Name</label>
                  <input
                    type="text"
                    value={editTaskName}
                    onChange={(e) => setEditTaskName(e.target.value)}
                    placeholder="Enter task name..."
                    className="w-full px-4 py-4 border border-[#d5dbe2] rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#b8cee4] focus:border-[#b8cee4] min-h-[44px] touch-manipulation"
                    autoFocus
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="sentences"
                  />
                </div>

                {/* Description Field */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#111418] text-base font-medium">Description</label>
                  <MarkdownEditor
                    value={editTaskDescription}
                    onChange={setEditTaskDescription}
                    placeholder="Add a description for this task (optional)..."
                    rows={3}
                  />
                </div>

                {/* Reminders Section */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[#111418] text-base font-medium">Reminders</label>
                    <button
                      type="button"
                      onClick={addEditReminderDate}
                      className="text-sm text-[#b8cee4] hover:text-[#a5c1db] font-medium"
                    >
                      + Add Reminder
                    </button>
                  </div>
                  
                  {editTaskReminders.map((reminder, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="datetime-local"
                        value={reminder}
                        onChange={(e) => updateEditReminderDate(index, e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="flex-1 px-4 py-4 border border-[#d5dbe2] rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#b8cee4] focus:border-[#b8cee4] min-h-[44px] touch-manipulation"
                      />
                      <button
                        type="button"
                        onClick={() => removeEditReminderDate(index)}
                        className="text-red-500 hover:text-red-700 text-base p-3 min-h-[44px] min-w-[44px] touch-manipulation rounded-lg hover:bg-red-50"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  
                  {editTaskReminders.length === 0 && (
                    <p className="text-[#5e7387] text-sm italic">No reminders set</p>
                  )}
                </div>

                {/* Priority Checkbox */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="editIsPriority"
                    checked={editTaskIsPriority}
                    onChange={(e) => setEditTaskIsPriority(e.target.checked)}
                    className="w-5 h-5 text-[#b8cee4] border-[#d5dbe2] rounded focus:ring-[#b8cee4] touch-manipulation"
                  />
                  <label htmlFor="editIsPriority" className="text-[#111418] text-base font-medium cursor-pointer">
                    High Priority
                  </label>
                </div>

                {/* Recurring Checkbox */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="editIsRecurring"
                    checked={editTaskIsRecurring}
                    onChange={(e) => setEditTaskIsRecurring(e.target.checked)}
                    className="w-5 h-5 text-[#b8cee4] border-[#d5dbe2] rounded focus:ring-[#b8cee4] touch-manipulation"
                  />
                  <label htmlFor="editIsRecurring" className="text-[#111418] text-base font-medium cursor-pointer">
                    Recurring Task
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleEditTask}
                    disabled={!editTaskName.trim() || isEditingTask}
                    className="flex-1 px-4 py-4 bg-[#b8cee4] text-[#111418] text-base font-medium rounded-xl hover:bg-[#a5c1db] disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] touch-manipulation"
                  >
                    {isEditingTask ? 'Updating...' : 'Update Task'}
                  </button>
                  <button
                    onClick={handleDeleteTask}
                    className="px-4 py-4 bg-red-500 text-white text-base font-medium rounded-xl hover:bg-red-600 transition-colors min-h-[44px] touch-manipulation"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      setShowEditTaskForm(false);
                      setEditTaskName('');
                      setEditTaskDescription('');
                      setEditTaskReminders([]);
                      setEditTaskIsPriority(false);
                      setEditTaskIsRecurring(false);
                      setCurrentEditTask(null);
                      setShowViewTaskForm(false);
                      setCurrentViewTask(null);
                      setShowRightPanel(false); // Hide right panel
                      // On mobile, redirect to tasks pane after canceling
                      setActivePanel('tasks');
                    }}
                    className="px-4 py-4 bg-[#eaedf0] text-[#111418] text-base font-medium rounded-xl hover:bg-[#d5dbe2] transition-colors min-h-[44px] touch-manipulation"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : showViewTaskForm && currentViewTask ? (
              <div className="flex flex-col gap-4 px-4 pb-4">
                {/* Task Name Display */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#111418] text-base font-medium">Task Name</label>
                  <div className="w-full px-4 py-4 border border-[#d5dbe2] rounded-xl text-base bg-gray-50 min-h-[44px] flex items-center">
                    {currentViewTask.task_name}
                  </div>
                </div>

                {/* Description Display */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#111418] text-base font-medium">Description</label>
                  <div className="w-full px-4 py-4 border border-[#d5dbe2] rounded-xl text-base bg-gray-50 min-h-[100px]">
                    {currentViewTask.description ? (
                      <MarkdownRenderer content={currentViewTask.description} />
                    ) : (
                      <span className="text-[#5e7387] italic">No description</span>
                    )}
                  </div>
                </div>

                {/* Reminders Display */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#111418] text-base font-medium">Reminders</label>
                  <div className="w-full px-4 py-4 border border-[#d5dbe2] rounded-xl text-base bg-gray-50 min-h-[44px]">
                    {currentViewTask.reminders.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {currentViewTask.reminders.map((reminder, index) => (
                          <div key={index} className="text-sm">
                            📅 {new Date(reminder).toLocaleString()}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[#5e7387] italic">No reminders set</span>
                    )}
                  </div>
                </div>

                {/* Priority Display */}
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                    currentViewTask.isPriority 
                      ? 'bg-[#b8cee4] border-[#b8cee4]' 
                      : 'border-[#d5dbe2] bg-white'
                  }`}>
                    {currentViewTask.isPriority && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <label className="text-[#111418] text-base font-medium">
                    High Priority {currentViewTask.isPriority && '⭐'}
                  </label>
                </div>

                {/* Recurring Display */}
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                    currentViewTask.isRecurring 
                      ? 'bg-[#b8cee4] border-[#b8cee4]' 
                      : 'border-[#d5dbe2] bg-white'
                  }`}>
                    {currentViewTask.isRecurring && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <label className="text-[#111418] text-base font-medium">
                    Recurring Task {currentViewTask.isRecurring && '🔄'}
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      startEditingTask(currentViewTask);
                    }}
                    className="flex-1 px-4 py-4 bg-[#b8cee4] text-[#111418] text-base font-medium rounded-xl hover:bg-[#a5c1db] transition-colors min-h-[44px] touch-manipulation"
                  >
                    Edit Task
                  </button>
                  <button
                    onClick={() => {
                      setShowViewTaskForm(false);
                      setCurrentViewTask(null);
                      setShowRightPanel(false); // Hide right panel
                      // On mobile, redirect to tasks pane after closing
                      setActivePanel('tasks');
                    }}
                    className="px-4 py-4 bg-[#eaedf0] text-[#111418] text-base font-medium rounded-xl hover:bg-[#d5dbe2] transition-colors min-h-[44px] touch-manipulation"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-[#5e7387] text-sm">Click &quot;+ Add Task&quot; to create a new task</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Icon Components
const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
    <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"></path>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
    <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
  </svg>
);

const ArrowRightIcon = () => (
  <div className="text-[#111418]" data-icon="ArrowRight" data-size="24px" data-weight="regular">
    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
      <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"></path>
    </svg>
  </div>
);

const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
    <path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34L66.61,153.8,21.5,114.38a16,16,0,0,1,9.11-28.06l59.46-5.15,23.21-55.36a15.95,15.95,0,0,1,29.44,0L165.93,81.17l59.46,5.15A16,16,0,0,1,234.5,114.38Z"></path>
  </svg>
);

const StarOutlineIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
    <path d="M229.06,108.79l-48.7,42.41L193.49,211a8,8,0,0,1-12.28,9.09L128,184.69,74.79,220.09A8,8,0,0,1,62.51,211l13.13-59.78L27,108.79a8,8,0,0,1,4.56-14l61.26-5.31L115.9,31.22a8,8,0,0,1,14.2,0l23.08,58.2L214.44,94.73A8,8,0,0,1,229.06,108.79Zm-15.1-2L153.89,102.24a8,8,0,0,1-6.31-4.61L128,43.39,108.42,97.63a8,8,0,0,1-6.31,4.61L42,106.73l38.49,33.52a8,8,0,0,1,2.4,7.4L71.73,195.78,118,166.21a8,8,0,0,1,10.06,0l46.26,29.57L163.11,147.65a8,8,0,0,1,2.4-7.4Z"></path>
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
    <path d="M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.47,133.47,0,0,1,25,128,133.33,133.33,0,0,1,48.07,97.25C70.33,75.19,97.22,64,128,64s57.67,11.19,79.93,33.25A133.46,133.46,0,0,1,231.05,128C223.84,141.46,192.43,192,128,192Zm0-112a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z"></path>
  </svg>
);