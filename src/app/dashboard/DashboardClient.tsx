'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ListResponse } from '@/lib/lists';
import { TaskCreate, TaskUpdate } from '@/lib/tasks';

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
}


// const BASE_URL = process.env.BASE_URL

interface DashboardClientProps {
  userSessionData: SessionData;
}


export default function DashboardClient({ userSessionData }: DashboardClientProps) {
  console.log('🚀 CLIENT: DashboardClient rendering');
  const { user, google } = userSessionData;
  
  console.log('🚀 DashboardClient rendering with user:', user);

  const [tasks, setTasks] = useState<Task[]>([

  ]);

  // List state management
  const [lists, setLists] = useState<ListResponse[]>([]);
  const [showCreateListForm, setShowCreateListForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [currentList, setCurrentList] = useState<ListResponse | null>(null);
  
  // List edit/delete state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showEditListForm, setShowEditListForm] = useState<string | null>(null);
  const [editListName, setEditListName] = useState('');
  const [isEditingList, setIsEditingList] = useState(false);
  const [isDeletingList, setIsDeletingList] = useState(false);
  
  // Version state management
  const [currentViewingVersion, setCurrentViewingVersion] = useState<number>(0);

  // Task creation form state
  const [showCreateTaskForm, setShowCreateTaskForm] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskReminders, setNewTaskReminders] = useState<string[]>([]);
  const [newTaskIsPriority, setNewTaskIsPriority] = useState(false);
  const [newTaskIsRecurring, setNewTaskIsRecurring] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const [selectedTask, setSelectedTask] = useState<Task | null>(tasks[0]);
  
  // Mobile UI state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<'lists' | 'tasks' | 'details'>('tasks');
  
  // Task editing form state:
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [showEditTaskForm, setShowEditTaskForm] = useState(false);
  const [currentEditTask, setCurrentEditTask] = useState<Task | null>(null);
  const [editTaskName, setEditTaskName] = useState('');
  const [editTaskReminders, setEditTaskReminders] = useState<string[]>([]);
  const [editTaskIsPriority, setEditTaskIsPriority] = useState(false);
  const [editTaskIsRecurring, setEditTaskIsRecurring] = useState(false);

  // Fetch user's lists on component mount
  useEffect(() => {
    console.log('🎯 useEffect triggered with user:', user);
    console.log('🎯 user.user_id specifically:', user.user_id, typeof user.user_id);
    
    const fetchUserLists = async () => {
      const userId = user.user_id
      if (!userId) {
        console.log('❌ No user ID found, exiting early. User object:', user);
        return;
      }
      console.log('✅ Fetching lists for user:', userId);
      try {
        const response = await fetch(`/api/lists/user/${userId}`);
        if (response.ok) {
          const userLists = await response.json();
          setLists(userLists);
        } else {
          console.error('Failed to fetch user lists');
        }
      } catch (error) {
        console.error('Error fetching user lists:', error);
      }
    };

    fetchUserLists();
  }, [user]);

  // Separate useEffect to handle currentList changes and fetch tasks
  useEffect(() => {
    if (lists.length > 0 && !currentList) {
      setCurrentList(lists[0]);
    }
  }, [lists, currentList]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openDropdownId) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdownId]);

  // Consolidated effect: Handle current list changes and fetch tasks
  useEffect(() => {
    const fetchTasksForCurrentList = async () => {
      if (!currentList) {
        return;
      }

      const listId = currentList.list_id;
      const targetVersion = currentList.version;
      
      console.log(`‼️ list_id is "${listId}" (type: ${typeof listId})`);
      console.log('‼️ currentList full object:', currentList);
      console.log(`🎯 Setting viewing version to: ${targetVersion}`);
      
      if (!listId) {
        console.log('❌ No list ID found');
        return;
      }
      
      // Update viewing version to current version and fetch tasks
      setCurrentViewingVersion(targetVersion);
      
      // Use /current endpoint for the latest version
      try {
        console.log(`✅ Fetching current tasks for list: ${listId}`);
        const response = await fetch(`/api/tasks/list/${listId}/current`);
        console.log(`📨 Response status: ${response.status}`);
        
        if (response.ok) {
          const currentTasks = await response.json();
          console.log(`✅ Successfully loaded ${currentTasks.length} current tasks`);
          setTasks(currentTasks);
        } else {
          const errorData = await response.json();
          console.error(`❌ Failed to fetch current tasks. Status: ${response.status}`);
          console.error('❌ Error details:', errorData);
        }
      } catch (error) {
        console.error('Error fetching current tasks:', error);
      }
    };

    fetchTasksForCurrentList();
  }, [currentList]);

  // Separate effect for version navigation (only when user manually changes version)
  useEffect(() => {
    const fetchTasksForVersionEffect = async () => {
      if (!currentList || currentViewingVersion === currentList.version) {
        // Skip if viewing current version (handled by currentList effect)
        return;
      }

      console.log(`🔍 Fetching tasks for version ${currentViewingVersion} (historical view)`);
      await fetchTasksForVersion(currentList.list_id, currentViewingVersion);
    };

    // Only fetch if we have a valid current list and we're not viewing the current version
    if (currentList && currentViewingVersion !== currentList.version && currentViewingVersion > 0) {
      fetchTasksForVersionEffect();
    }
  }, [currentViewingVersion, currentList]);

  // Handle list creation
  const handleCreateList = async () => {
    console.log('🎯 handleCreateList called with:', { newListName, user });
    if (!newListName.trim()) {
      console.log('❌ No list name provided');
      return;
    }
    
    // Use google_id as fallback if user.user_id is not available
    const userId = user.user_id || user.google_id;
    if (!userId) {
      console.log('❌ No user ID available (neither user.id nor google_id)');
      return;
    }
    
    console.log('✅ Creating list with userId:', userId);
    setIsCreatingList(true);
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          list_name: newListName.trim(),
        }),
      });

      if (response.ok) {
        const newList = await response.json();
        setLists(prev => [...prev, newList]);
        setNewListName('');
        setShowCreateListForm(false);
      } else {
        console.error('Failed to create list');
      }
    } catch (error) {
      console.error('Error creating list:', error);
    } finally {
      setIsCreatingList(false);
    }
  };

  // Handle list edit
  const handleEditList = async (listId: string) => {
    if (!editListName.trim()) {
      console.log('❌ No list name provided');
      return;
    }
    
    setIsEditingList(true);
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          list_name: editListName.trim(),
        }),
      });

      if (response.ok) {
        const updatedList = await response.json();
        setLists(prev => prev.map(list => 
          list.list_id === listId ? updatedList : list
        ));
        
        // Update current list if it's the one being edited
        if (currentList?.list_id === listId) {
          setCurrentList(updatedList);
        }
        
        setShowEditListForm(null);
        setEditListName('');
        setOpenDropdownId(null);
        
        console.log('✅ List updated:', updatedList);
      } else {
        console.error('Failed to update list');
      }
    } catch (error) {
      console.error('Error updating list:', error);
    } finally {
      setIsEditingList(false);
    }
  };

  // Handle list delete
  const handleDeleteList = async (listId: string) => {
    const listToDelete = lists.find(list => list.list_id === listId);
    if (!listToDelete) return;
    
    if (!confirm(`Are you sure you want to delete "${listToDelete.list_name}"? This action cannot be undone.`)) {
      return;
    }
    
    setIsDeletingList(true);
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setLists(prev => prev.filter(list => list.list_id !== listId));
        
        // If deleting current list, switch to another list or null
        if (currentList?.list_id === listId) {
          const remainingLists = lists.filter(list => list.list_id !== listId);
          setCurrentList(remainingLists.length > 0 ? remainingLists[0] : null);
          setTasks([]); // Clear tasks when list is deleted
        }
        
        setOpenDropdownId(null);
        
        console.log('✅ List deleted successfully');
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to delete list. Status:', response.status);
        console.error('❌ Error details:', errorData);
      }
    } catch (error) {
      console.error('Error deleting list:', error);
    } finally {
      setIsDeletingList(false);
    }
  };

  // Start editing a list
  const startEditingList = (list: ListResponse) => {
    setShowEditListForm(list.list_id);
    setEditListName(list.list_name);
    setOpenDropdownId(null);
  };

  // Version navigation functions
  const navigateToNextVersion = async () => {
    if (!currentList) return;
    
    const nextVersion = currentViewingVersion + 1;
    if (nextVersion > currentList.version) return; // Don't go beyond current version
    
    setCurrentViewingVersion(nextVersion);
    await fetchTasksForVersion(currentList.list_id, nextVersion);
  };

  const navigateToPreviousVersion = async () => {
    if (!currentList) return;
    
    const prevVersion = currentViewingVersion - 1;
    if (prevVersion < 1) return; // Don't go below version 1
    
    setCurrentViewingVersion(prevVersion);
    await fetchTasksForVersion(currentList.list_id, prevVersion);
  };

  // Fetch tasks for a specific version
  const fetchTasksForVersion = async (listId: string, version: number) => {
    try {
      console.log(`🔍 Fetching tasks for list ${listId}, version ${version}`);
      const response = await fetch(`/api/tasks/list/${listId}/${version}`);
      
      if (response.ok) {
        const versionTasks = await response.json();
        console.log(`✅ Successfully loaded ${versionTasks.length} tasks for version ${version}`);
        setTasks(versionTasks);
      } else {
        const errorData = await response.json();
        console.error(`❌ Failed to fetch tasks for version ${version}. Status: ${response.status}`);
        console.error('❌ Error details:', errorData);
      }
    } catch (error) {
      console.error('Error fetching tasks for version:', error);
    }
  };

  // Handle task creation
  const handleCreateTask = async () => {
    console.log('🎯 handleCreateTask called');
    if (!newTaskName.trim() || !currentList) {
      console.log('❌ No task name or current list');
      return;
    }
    
    const userId = user.user_id || user.google_id;
    if (!userId) {
      console.log('❌ No user ID available');
      return;
    }
    
    console.log('✅ Creating task for:', { 
      newTaskName, 
      currentList: currentList.list_id,
      userId,
      currentListFull: currentList 
    });
    setIsCreatingTask(true);
    
    try {
      const taskData: TaskCreate = {
        user_id: userId,
        list_id: currentList.list_id,
        task_name: newTaskName.trim(),
        reminders: newTaskReminders,
        isPriority: newTaskIsPriority,
        isRecurring: newTaskIsRecurring,
        list_version: currentList.version || 1,
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
    setEditTaskReminders([...task.reminders]);
    setEditTaskIsPriority(task.isPriority);
    setEditTaskIsRecurring(task.isRecurring);
    setShowEditTaskForm(true);
    setShowCreateTaskForm(false); // Hide create form
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


  const handleClearList = async () => {
    if (!currentList) {
      console.log('❌ No current list to clear');
      return;
    }

    if (!confirm('Are you sure you want to clear all tasks from this list? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('🗑️ Clearing list:', currentList.list_id);
      
      const response = await fetch(`/api/tasks/clear-list/${currentList.list_id}`, {
        method: 'PATCH'
      });

      if (response.ok) {
        const updatedTasks = await response.json();
        console.log('✅ List cleared successfully. Remaining tasks:', updatedTasks);
        
        // Update tasks with the current tasks in the list (should be empty or contain remaining tasks)
        setTasks(updatedTasks);
        
        // Reset selected task if it's no longer in the updated tasks
        if (selectedTask && !updatedTasks.find((task: Task) => task.task_id === selectedTask.task_id)) {
          setSelectedTask(updatedTasks.length > 0 ? updatedTasks[0] : null);
        }
        
        // Close any open forms
        setShowCreateTaskForm(false);
        setShowEditTaskForm(false);
        setCurrentEditTask(null);
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to clear list. Status:', response.status);
        console.error('❌ Error details:', errorData);
        alert('Failed to clear list. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error clearing list:', error);
      alert('Failed to clear list. Please try again.');
    }
  };

  const handleRolloverList = async () => {
    if (!currentList) {
      console.log('❌ No current list to rollover');
      return;
    }

    if (!confirm('Are you sure you want to rollover this list? This will move incomplete tasks to a new version and mark completed tasks as done.')) {
      return;
    }

    try {
      console.log('🔄 Rolling over list:', currentList.list_id);
      
      const response = await fetch(`/api/tasks/rollover-list/${currentList.list_id}`, {
        method: 'POST'
      });

      if (response.ok) {
        const rolledOverTasks = await response.json();
        console.log('✅ List rolled over successfully:', rolledOverTasks);
        
        // Update tasks to show only the rolled over (incomplete) tasks
        setTasks(rolledOverTasks);
        
        // Update the current list to reflect the new version
        const updatedListResponse = await fetch(`/api/lists/${currentList.list_id}`);
        if (updatedListResponse.ok) {
          const updatedList = await updatedListResponse.json();
          setCurrentList(updatedList);
          
          // Update the lists array to reflect the new version
          setLists(prev => prev.map(list => 
            list.list_id === updatedList.list_id ? updatedList : list
          ));
        }
        
        // Reset selected task if it's no longer in the rolled over tasks
        if (selectedTask && !rolledOverTasks.find((task: Task) => task.task_id === selectedTask.task_id)) {
          setSelectedTask(rolledOverTasks.length > 0 ? rolledOverTasks[0] : null);
        }
        
        // Close any open forms
        setShowCreateTaskForm(false);
        setShowEditTaskForm(false);
        setCurrentEditTask(null);
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to rollover list. Status:', response.status);
        console.error('❌ Error details:', errorData);
        alert('Failed to rollover list. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error rolling over list:', error);
      alert('Failed to rollover list. Please try again.');
    }
  };

    return (
        <div className="relative flex size-full min-h-screen flex-col bg-gray-50 group/design-root overflow-x-hidden" style={{ fontFamily: 'Manrope, "Noto Sans", sans-serif' }}>
            {/* Mobile Navigation Bar */}
            <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {google.picture && (
                        <Image
                            src={google.picture}
                            alt={`${user.first_name}'s profile`}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full"
                        />
                    )}
                    <div>
                        <h1 className="text-[#111418] text-lg font-semibold">CarpeDoEm</h1>
                    </div>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                    </svg>
                </button>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-20">
                <div className="flex justify-around">
                    <button
                        onClick={() => setActivePanel('lists')}
                        className={`flex flex-col items-center py-2 px-4 rounded-lg min-h-[44px] ${activePanel === 'lists' ? 'bg-[#b8cee4] text-[#111418]' : 'text-[#5e7387]'}`}
                    >
                        <ListIcon />
                        <span className="text-xs mt-1">Lists</span>
                    </button>
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

            <div className="layout-container flex h-full grow flex-col lg:flex-row">
                <div className="flex flex-1 lg:gap-1 lg:px-6 lg:py-5">
                    {/* Left Sidebar - Navigation */}
                    <div className={`layout-content-container flex flex-col lg:w-80 ${activePanel === 'lists' ? 'block' : 'hidden'} lg:block absolute lg:relative inset-x-0 top-0 bottom-0 lg:inset-auto bg-white lg:bg-transparent z-10 lg:z-auto`}>
                        <div className="flex h-full min-h-[700px] flex-col justify-between bg-gray-50 p-4 pt-16 lg:pt-4">
                            {/* Mobile close button */}
                            <button
                                onClick={() => setActivePanel('tasks')}
                                className="lg:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-200 min-h-[44px] min-w-[44px]"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 mb-4">
                            {google.picture && (
                                <Image
                                src={google.picture}
                                alt={`${user.first_name}'s profile`}
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full"
                                />
                            )}
                            <div>
                                <h1 className="text-[#111418] text-base font-medium leading-normal">CarpeDoEm</h1>
                                <p className="text-[#5e7387] text-xs">Welcome, {user.first_name}!</p>
                            </div>
                            </div>
                            <div className="flex flex-col gap-2">
                            {/* New List Button / Form */}
                            {!showCreateListForm ? (
                                <button 
                                onClick={() => setShowCreateListForm(true)}
                                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl min-h-[44px] px-4 bg-[#b8cee4] text-[#111418] text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#a5c1db] transition-colors"
                                >
                                <span className="truncate">New List</span>
                                </button>
                            ) : (
                                <div className="flex flex-col gap-2">
                                <input
                                    type="text"
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                    placeholder="Enter list name..."
                                    className="w-full px-4 py-4 border border-[#d5dbe2] rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#b8cee4] focus:border-[#b8cee4] min-h-[44px] touch-manipulation"
                                    autoFocus
                                    autoComplete="off"
                                    autoCorrect="off"
                                    autoCapitalize="words"
                                    onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleCreateList();
                                    } else if (e.key === 'Escape') {
                                        setShowCreateListForm(false);
                                        setNewListName('');
                                    }
                                    }}
                                />
                                <div className="flex gap-2">
                                    <button
                                    onClick={handleCreateList}
                                    disabled={!newListName.trim() || isCreatingList}
                                    className="flex-1 px-3 py-3 bg-[#b8cee4] text-[#111418] text-sm font-medium rounded-xl hover:bg-[#a5c1db] disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                                    >
                                    {isCreatingList ? 'Creating...' : 'Create'}
                                    </button>
                                    <button
                                    onClick={() => {
                                        setShowCreateListForm(false);
                                        setNewListName('');
                                    }}
                                    className="px-3 py-3 bg-[#eaedf0] text-[#111418] text-sm font-medium rounded-xl hover:bg-[#d5dbe2] transition-colors min-h-[44px]"
                                    >
                                    Cancel
                                    </button>
                                </div>
                                </div>
                            )}
                            
                            {/* User's Lists Section */}
                            {lists.length > 0 && (
                                <div className="flex flex-col gap-1">
                                    <p className="text-[#5e7387] text-xs font-medium px-3 mb-1">My Lists</p>
                                    {lists.map((list) => (
                                    <div key={list.list_id}>
                                        {showEditListForm === list.list_id ? (
                                            <div className="flex flex-col gap-2 px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={editListName}
                                                    onChange={(e) => setEditListName(e.target.value)}
                                                    className="w-full px-3 py-3 border border-[#d5dbe2] rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#b8cee4] focus:border-[#b8cee4] min-h-[44px] touch-manipulation"
                                                    autoFocus
                                                    autoComplete="off"
                                                    autoCorrect="off"
                                                    autoCapitalize="words"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleEditList(list.list_id);
                                                        } else if (e.key === 'Escape') {
                                                            setShowEditListForm(null);
                                                            setEditListName('');
                                                        }
                                                    }}
                                                />
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => handleEditList(list.list_id)}
                                                        disabled={!editListName.trim() || isEditingList}
                                                        className="flex-1 px-3 py-3 bg-[#b8cee4] text-[#111418] text-sm font-medium rounded-lg hover:bg-[#a5c1db] disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] touch-manipulation"
                                                    >
                                                        {isEditingList ? 'Saving...' : 'Save'}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setShowEditListForm(null);
                                                            setEditListName('');
                                                        }}
                                                        className="px-3 py-3 bg-[#eaedf0] text-[#111418] text-sm font-medium rounded-lg hover:bg-[#d5dbe2] transition-colors min-h-[44px] touch-manipulation"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#eaedf0] group min-h-[44px]">
                                                <div 
                                                    className="flex items-center gap-3 flex-1 cursor-pointer"
                                                    onClick={() => {
                                                        console.log('Selected list:', list.list_name);
                                                        setCurrentList(list);
                                                        setCurrentViewingVersion(list.version); // Reset to current version when selecting list
                                                        setOpenDropdownId(null);
                                                        // On mobile, automatically switch to tasks tab when list is selected
                                                        setActivePanel('tasks');
                                                    }}
                                                >
                                                    <div className="text-[#111418]">
                                                        <ListIcon />
                                                    </div>
                                                    <p className="text-[#111418] text-sm font-medium leading-normal">{list.list_name}</p>
                                                </div>
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenDropdownId(openDropdownId === list.list_id ? null : list.list_id);
                                                        }}
                                                        className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-2 rounded hover:bg-[#d5dbe2] transition-all duration-200 min-h-[44px] min-w-[44px]"
                                                    >
                                                        <ThreeDotsIcon />
                                                    </button>
                                                    {openDropdownId === list.list_id && (
                                                        <div className="absolute right-0 top-8 bg-white border border-[#d5dbe2] rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                                                            <button
                                                                onClick={() => startEditingList(list)}
                                                                className="w-full text-left px-3 py-2 text-sm text-[#111418] hover:bg-[#eaedf0] transition-colors"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteList(list.list_id)}
                                                                disabled={isDeletingList}
                                                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                                            >
                                                                {isDeletingList ? 'Deleting...' : 'Delete'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    ))}
                                </div>
                            )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                            {/* Future features like Trash can go here */}
                            </div>
                        </div>
                        </div>
                    </div>

                    {/* Center - Task List */}
                    <div className={`layout-content-container flex flex-col lg:max-w-[960px] flex-1 ${activePanel === 'tasks' ? 'block' : 'hidden'} lg:block pb-20 lg:pb-0`}>
                        <div className="flex justify-between gap-2 px-4 py-3">
                            {/* Mobile back button */}
                            <button
                                onClick={() => setActivePanel('lists')}
                                className="lg:hidden p-2 rounded-lg hover:bg-gray-200 min-h-[44px] min-w-[44px]"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        <div className="flex gap-2">
                            <button 
                                className={`p-3 rounded-lg transition-colors min-h-[44px] min-w-[44px] ${
                                  currentList 
                                    ? 'text-[#111418] hover:bg-[#eaedf0]' 
                                    : 'text-[#9ca3af] cursor-not-allowed'
                                }`}
                                title="Rollover - Move incomplete tasks to new version"
                                onClick={handleRolloverList}
                                disabled={!currentList}
                            >
                            <RecycleIcon />
                            </button>
                            <button 
                                className={`p-3 rounded-lg transition-colors min-h-[44px] min-w-[44px] ${
                                  currentList 
                                    ? 'text-[#111418] hover:bg-[#eaedf0]' 
                                    : 'text-[#9ca3af] cursor-not-allowed'
                                }`}
                                title="Clear List - Remove all tasks"
                                onClick={handleClearList}
                                disabled={!currentList}
                            >
                            <SignOutIcon />
                            </button>
                        </div>
                        </div>
                        <div className="flex items-center justify-between px-4 pb-3 pt-5">
                            <h2 className="text-[#111418] text-[22px] font-bold leading-tight tracking-[-0.015em]">
                                {currentList?.list_name}
                            </h2>
                            {currentList && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={navigateToNextVersion}
                                        disabled={currentViewingVersion >= currentList.version}
                                        className={`p-1 rounded transition-colors ${
                                            currentViewingVersion >= currentList.version
                                                ? 'text-gray-300 cursor-not-allowed'
                                                : 'text-[#111418] hover:bg-[#eaedf0]'
                                        }`}
                                        title="View newer version"
                                    >
                                        <TriangleLeftIcon />
                                    </button>
                                    <span className="text-[#5e7387] text-sm font-medium px-2">
                                        v{currentViewingVersion}
                                    </span>
                                    <button
                                        onClick={navigateToPreviousVersion}
                                        disabled={currentViewingVersion <= 0}
                                        className={`p-1 rounded transition-colors ${
                                            currentViewingVersion <= 0
                                                ? 'text-gray-300 cursor-not-allowed'
                                                : 'text-[#111418] hover:bg-[#eaedf0]'
                                        }`}
                                        title="View older version"
                                    >
                                        <TriangleRightIcon />
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {tasks.map((task) => (
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
                                }}
                            >
                                <p className={`text-[#111418] text-base font-medium leading-normal line-clamp-1 ${
                                task.isComplete ? 'line-through opacity-60' : ''
                                }`}>
                                {task.task_name}
                                </p>
                                <p className="text-[#5e7387] text-sm font-normal leading-normal line-clamp-2">
                                {task.isPriority ? '⭐ Priority Task' : 'Regular Task'}
                                </p>
                            </div>
                            </div>
                            <div className="shrink-0">
                            <div className="text-[#111418] flex size-7 items-center justify-center">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        startEditingTask(task);
                                        setActivePanel('details');
                                    }}
                                    className="hover:bg-[#eaedf0] p-3 rounded-lg transition-colors min-h-[44px] min-w-[44px] touch-manipulation"
                                    >
                                    <PencilIcon />
                                </button>
                            </div>
                            </div>
                        </div>
                        ))}
                    </div>

                    {/* Right Sidebar - Task Creation/Edit Form */}
                    <div className={`layout-content-container flex flex-col lg:w-80 ${activePanel === 'details' ? 'block' : 'hidden'} lg:block absolute lg:relative inset-x-0 top-0 bottom-0 lg:inset-auto bg-white lg:bg-transparent z-10 lg:z-auto pb-20 lg:pb-0`}>
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
                                 showEditTaskForm ? 'Edit Task' : 'Task Actions'}
                            </h2>
                            {!showCreateTaskForm && !showEditTaskForm && currentList && (
                                <button
                                    onClick={() => {
                                      setShowCreateTaskForm(true);
                                      setShowEditTaskForm(false);
                                    }}
                                    className="text-sm bg-[#b8cee4] hover:bg-[#a5c1db] text-[#111418] px-4 py-3 rounded-lg font-medium transition-colors min-h-[44px] touch-manipulation"
                                >
                                    + Add Task
                                </button>
                            )}
                        </div>
                        
                        {/* Task Creation Form */}
                        {showCreateTaskForm && currentList ? (
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
                                            setNewTaskReminders([]);
                                            setNewTaskIsPriority(false);
                                            setNewTaskIsRecurring(false);
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
                                            setEditTaskReminders([]);
                                            setEditTaskIsPriority(false);
                                            setEditTaskIsRecurring(false);
                                            setCurrentEditTask(null);
                                            // On mobile, redirect to tasks pane after canceling
                                            setActivePanel('tasks');
                                        }}
                                        className="px-4 py-4 bg-[#eaedf0] text-[#111418] text-base font-medium rounded-xl hover:bg-[#d5dbe2] transition-colors min-h-[44px] touch-manipulation"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : !currentList ? (
                            <div className="px-4 py-8 text-center">
                                <p className="text-[#5e7387] text-sm">Select a list to create tasks</p>
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
const ListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
    <path d="M80,64a8,8,0,0,1,8-8H216a8,8,0,0,1,0,16H88A8,8,0,0,1,80,64Zm136,56H88a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Zm0,64H88a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16ZM44,52A12,12,0,1,0,56,64,12,12,0,0,0,44,52Zm0,64a12,12,0,1,0,12,12A12,12,0,0,0,44,116Zm0,64a12,12,0,1,0,12,12A12,12,0,0,0,44,180Z"></path>
  </svg>
);

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
    <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"></path>
  </svg>
);

const RecycleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
    <path d="M96,208a8,8,0,0,1-8,8H40a24,24,0,0,1-20.77-36l34.29-59.25L39.47,124.5A8,8,0,1,1,35.33,109l32.77-8.77a8,8,0,0,1,9.8,5.66l8.79,32.77A8,8,0,0,1,81,148.5a8.37,8.37,0,0,1-2.08.27,8,8,0,0,1-7.72-5.93l-3.8-14.15L33.11,188A8,8,0,0,0,40,200H88A8,8,0,0,1,96,208Zm140.73-28-23.14-40a8,8,0,0,0-13.84,8l23.14,40A8,8,0,0,1,216,200H147.31l10.34-10.34a8,8,0,0,0-11.31-11.32l-24,24a8,8,0,0,0,0,11.32l24,24a8,8,0,0,0,11.31-11.32L147.31,216H216a24,24,0,0,0,20.77-36ZM128,32a7.85,7.85,0,0,1,6.92,4l34.29,59.25-14.08-3.78A8,8,0,0,0,151,106.92l32.78,8.79a8.23,8.23,0,0,0,2.07.27,8,8,0,0,0,7.72-5.93l8.79-32.79a8,8,0,1,0-15.45-4.14l-3.8,14.17L148.77,28a24,24,0,0,0-41.54,0L84.07,68a8,8,0,0,0,13.85,8l23.16-40A7.85,7.85,0,0,1,128,32Z"></path>
  </svg>
);

const SignOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
    <path d="M112,216a8,8,0,0,1-8,8H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32h56a8,8,0,0,1,0,16H48V208h56A8,8,0,0,1,112,216Zm109.66-93.66-40-40a8,8,0,0,0-11.32,11.32L196.69,120H104a8,8,0,0,0,0,16h92.69l-26.35,26.34a8,8,0,0,0,11.32,11.32l40-40A8,8,0,0,0,221.66,122.34Z"></path>
  </svg>
);

const ThreeDotsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" fill="currentColor" viewBox="0 0 256 256">
    <path d="M144,128a16,16,0,1,1-16-16A16,16,0,0,1,144,128ZM60,112a16,16,0,1,0,16,16A16,16,0,0,0,60,112Zm136,0a16,16,0,1,0,16,16A16,16,0,0,0,196,112Z"></path>
  </svg>
);

const TriangleLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12px" height="12px" fill="currentColor" viewBox="0 0 256 256">
    <path d="M163.06,40.61a8,8,0,0,1,1.34,8.95L136.71,128l27.69,78.44a8,8,0,0,1-15.18,5.34l-32-92a8,8,0,0,1,0-5.56l32-92A8,8,0,0,1,163.06,40.61Z"></path>
  </svg>
);

const TriangleRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12px" height="12px" fill="currentColor" viewBox="0 0 256 256">
    <path d="M106.94,215.39a8,8,0,0,1-1.34-8.95L133.29,128,105.6,49.56a8,8,0,0,1,15.18-5.34l32,92a8,8,0,0,1,0,5.56l-32,92A8,8,0,0,1,106.94,215.39Z"></path>
  </svg>
);