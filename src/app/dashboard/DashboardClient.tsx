'use client';

import { useState, useEffect } from 'react';
import { ListResponse } from '@/lib/lists';
import { TaskCreate, TaskUpdate, deleteTask } from '@/lib/tasks';

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

interface List {
    list_id?: string;
    user_id?: string;
    list_name?: string;
    created_at?: Date;
    last_updated_at?: Date;
    version?: string;
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

type NavigationItem = 'inbox' | 'today' | 'upcoming' | 'anytime' | 'completed' | 'trash';

// const BASE_URL = process.env.BASE_URL

interface DashboardClientProps {
  userSessionData: SessionData;
}


export default function DashboardClient({ userSessionData }: DashboardClientProps) {
  console.log('🚀 CLIENT: DashboardClient rendering');
  const { user, google, isNewUser } = userSessionData;
  
  console.log('🚀 DashboardClient rendering with user:', user);

  const [tasks, setTasks] = useState<Task[]>([

  ]);

  // List state management
  const [lists, setLists] = useState<ListResponse[]>([]);
  const [showCreateListForm, setShowCreateListForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [currentList, setCurrentList] = useState<ListResponse | null>(null);

  // Task creation form state
  const [showCreateTaskForm, setShowCreateTaskForm] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskReminders, setNewTaskReminders] = useState<string[]>([]);
  const [newTaskIsPriority, setNewTaskIsPriority] = useState(false);
  const [newTaskIsRecurring, setNewTaskIsRecurring] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const [selectedTask, setSelectedTask] = useState<Task | null>(tasks[0]);
  const [taskName, setTaskName] = useState('');
  
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
  }, [user.user_id, user.google_id]);

  // Separate useEffect to handle currentList changes and fetch tasks
  useEffect(() => {
    if (lists.length > 0 && !currentList) {
      setCurrentList(lists[0]);
    }
  }, [lists, currentList]);

  useEffect(() => {
    const fetchCurrentTasks = async () => {
      if (!currentList) {
        return;
      }

      const listId = currentList.list_id;
      console.log(`‼️ list_id is "${listId}" (type: ${typeof listId})`);
      console.log('‼️ currentList full object:', currentList);
      
      if (!listId) {
        console.log('❌ No list ID found');
        return;
      }
      console.log('✅ Fetching tasks for list:', listId);
      try {
        const url = `/api/tasks/list/${listId}/current`;
        console.log(`📍 Fetching URL: ${url}`);
        const response = await fetch(url);
        console.log(`📨 Response status: ${response.status}`);
        
        if (response.ok) {
          const currentTasks = await response.json();
          console.log(`✅ Successfully loaded ${currentTasks.length} tasks`);
          setTasks(currentTasks);
        } else {
          const errorData = await response.json();
          console.error(`❌ Failed to fetch tasks. Status: ${response.status}`);
          console.error('❌ Error details:', errorData);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchCurrentTasks();
  }, [currentList]);

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

  const updateTaskName = (newName: string) => {
    if (selectedTask) {
      setTasks(tasks.map(task => 
        task.task_id === selectedTask.task_id ? { ...task, task_name: newName } : task
      ));
      setSelectedTask({ ...selectedTask, task_name: newName });
    }
  };

    return (
        <div className="relative flex size-full min-h-screen flex-col bg-gray-50 group/design-root overflow-x-hidden" style={{ fontFamily: 'Manrope, "Noto Sans", sans-serif' }}>
            <div className="layout-container flex h-full grow flex-col">
                <div className="gap-1 px-6 flex flex-1 justify-center py-5">
                    {/* Left Sidebar - Navigation */}
                    <div className="layout-content-container flex flex-col w-80">
                        <div className="flex h-full min-h-[700px] flex-col justify-between bg-gray-50 p-4">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 mb-4">
                            {google.picture && (
                                <img
                                src={google.picture}
                                alt={`${user.first_name}'s profile`}
                                className="w-8 h-8 rounded-full"
                                />
                            )}
                            <div>
                                <h1 className="text-[#111418] text-base font-medium leading-normal">CarpeDoEm</h1>
                                <p className="text-[#5e7387] text-xs">Welcome, {user.first_name}!</p>
                            </div>
                            </div>
                            <div className="flex flex-col gap-2">
                            {/* User's Lists Section */}
                            {lists.length > 0 && (
                                <div className="flex flex-col gap-1">
                                    <p className="text-[#5e7387] text-xs font-medium px-3 mb-1">My Lists</p>
                                    {lists.map((list) => (
                                    <div
                                        key={list.list_id}
                                        className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer hover:bg-[#eaedf0]"
                                        onClick={() => {
                                        // TODO: Set active list and load list tasks
                                        console.log('Selected list:', list.list_name);
                                        setCurrentList(list);
                                        }}
                                    >
                                        <div className="text-[#111418]">
                                        <ListIcon />
                                        </div>
                                        <p className="text-[#111418] text-sm font-medium leading-normal">{list.list_name}</p>
                                    </div>
                                    ))}
                                </div>
                            )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            {/* New List Button / Form */}
                            {!showCreateListForm ? (
                                <button 
                                onClick={() => setShowCreateListForm(true)}
                                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#b8cee4] text-[#111418] text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#a5c1db] transition-colors"
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
                                    className="w-full px-3 py-2 border border-[#d5dbe2] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#b8cee4] focus:border-[#b8cee4]"
                                    autoFocus
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
                                    className="flex-1 px-3 py-2 bg-[#b8cee4] text-[#111418] text-sm font-medium rounded-xl hover:bg-[#a5c1db] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                    {isCreatingList ? 'Creating...' : 'Create'}
                                    </button>
                                    <button
                                    onClick={() => {
                                        setShowCreateListForm(false);
                                        setNewListName('');
                                    }}
                                    className="px-3 py-2 bg-[#eaedf0] text-[#111418] text-sm font-medium rounded-xl hover:bg-[#d5dbe2] transition-colors"
                                    >
                                    Cancel
                                    </button>
                                </div>
                                </div>
                            )}
                            <div className="flex flex-col gap-1">
                            {/* <div className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[#eaedf0] rounded-xl">
                                <div className="text-[#111418]">
                                <TrashIcon />
                                </div>
                                <p className="text-[#111418] text-sm font-medium leading-normal">Trash</p>
                            </div> */}
                            </div>
                        </div>
                        </div>
                    </div>

                    {/* Center - Task List */}
                    <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
                        <div className="flex justify-between gap-2 px-4 py-3">
                        <div className="flex gap-2">
                            <button className="p-2 text-[#111418] hover:bg-[#eaedf0] rounded"
                                    title="Rollover"
                            >
                            <RecycleIcon />
                            </button>
                            <button className="p-2 text-[#111418] hover:bg-[#eaedf0] rounded"
                                    title = "Clear and Create New"
                            >
                            <SignOutIcon />
                            </button>
                        </div>
                        </div>
                        <h2 className="text-[#111418] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
                        {currentList?.list_name}
                        </h2>
                        
                        {tasks.map((task) => (
                        <div
                            key={task.task_id}
                            className={`flex items-center gap-4 bg-gray-50 px-4 min-h-[72px] py-2 justify-between cursor-pointer hover:bg-[#eaedf0] ${
                            selectedTask?.task_id === task.task_id ? 'bg-[#eaedf0]' : ''
                            }`}
                            onClick={() => {
                            setSelectedTask(task);
                            }}
                        >
                            <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={task.isComplete}
                                onChange={(e) => {
                                e.stopPropagation();
                                toggleTaskCompletion(task.task_id);
                                // updat
                                }}
                                className="w-5 h-5 rounded border-[#d5dbe2] text-[#b8cee4] focus:ring-[#b8cee4]"
                            />
                            <div className="flex flex-col justify-center">
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
                                    onClick={() => startEditingTask(task)}
                                    className="hover:bg-[#eaedf0] p-1 rounded transition-colors"
                                    >
                                    <PencilIcon />
                                </button>
                            </div>
                            </div>
                        </div>
                        ))}
                    </div>

                    {/* Right Sidebar - Task Creation/Edit Form */}
                    <div className="layout-content-container flex flex-col w-80">
                        <div className="flex items-center justify-between px-4 pb-3 pt-5">
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
                                    className="text-sm bg-[#b8cee4] hover:bg-[#a5c1db] text-[#111418] px-3 py-1 rounded-lg font-medium transition-colors"
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
                                        className="w-full px-3 py-2 border border-[#d5dbe2] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#b8cee4] focus:border-[#b8cee4]"
                                        autoFocus
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
                                                className="flex-1 px-3 py-2 border border-[#d5dbe2] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#b8cee4] focus:border-[#b8cee4]"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeReminderDate(index)}
                                                className="text-red-500 hover:text-red-700 text-sm px-2"
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
                                        className="w-4 h-4 text-[#b8cee4] border-[#d5dbe2] rounded focus:ring-[#b8cee4]"
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
                                        className="w-4 h-4 text-[#b8cee4] border-[#d5dbe2] rounded focus:ring-[#b8cee4]"
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
                                        className="flex-1 px-4 py-2 bg-[#b8cee4] text-[#111418] text-sm font-medium rounded-xl hover:bg-[#a5c1db] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                                        }}
                                        className="px-4 py-2 bg-[#eaedf0] text-[#111418] text-sm font-medium rounded-xl hover:bg-[#d5dbe2] transition-colors"
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
                                        className="w-full px-3 py-2 border border-[#d5dbe2] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#b8cee4] focus:border-[#b8cee4]"
                                        autoFocus
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
                                                className="flex-1 px-3 py-2 border border-[#d5dbe2] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#b8cee4] focus:border-[#b8cee4]"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeEditReminderDate(index)}
                                                className="text-red-500 hover:text-red-700 text-sm px-2"
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
                                        className="w-4 h-4 text-[#b8cee4] border-[#d5dbe2] rounded focus:ring-[#b8cee4]"
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
                                        className="w-4 h-4 text-[#b8cee4] border-[#d5dbe2] rounded focus:ring-[#b8cee4]"
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
                                        className="flex-1 px-4 py-2 bg-[#b8cee4] text-[#111418] text-sm font-medium rounded-xl hover:bg-[#a5c1db] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isEditingTask ? 'Updating...' : 'Update Task'}
                                    </button>
                                    <button
                                        onClick={handleDeleteTask}
                                        className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors"
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
                                        }}
                                        className="px-4 py-2 bg-[#eaedf0] text-[#111418] text-sm font-medium rounded-xl hover:bg-[#d5dbe2] transition-colors"
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

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
    <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"></path>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
    <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path>
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

const ResetIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24px"
    height="24px"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    // strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M12 4V1L8 5l4 4V6a6 6 0 1 1-5.2 9.7" />
    
  </svg>
);

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
    <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"></path>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
    <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
  </svg>
);

const SignOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
    <path d="M112,216a8,8,0,0,1-8,8H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32h56a8,8,0,0,1,0,16H48V208h56A8,8,0,0,1,112,216Zm109.66-93.66-40-40a8,8,0,0,0-11.32,11.32L196.69,120H104a8,8,0,0,0,0,16h92.69l-26.35,26.34a8,8,0,0,0,11.32,11.32l40-40A8,8,0,0,0,221.66,122.34Z"></path>
  </svg>
);