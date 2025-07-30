import { API_BASE_URL } from '../config/config.js';

export const coachScheduleService = {
  // Get all coach schedules
  getAllCoachSchedules: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/coach-schedules`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch coach schedules');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching coach schedules:', error);
      throw error;
    }
  },

  // Get coach schedules by coach ID
  getCoachSchedulesByCoachId: async (coachId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/coach-schedules/coach/${coachId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch coach schedules');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching coach schedules:', error);
      throw error;
    }
  },

  // Get available coaches for specific day and time
  getAvailableCoaches: async (dayOfWeek, startTime, endTime) => {
    try {
      const params = new URLSearchParams({
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime
      });

      const response = await fetch(`${API_BASE_URL}/coach-schedules/available?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch available coaches');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching available coaches:', error);
      throw error;
    }
  },

  // Create coach schedule
  createCoachSchedule: async (scheduleData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/coach-schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(scheduleData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create coach schedule');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating coach schedule:', error);
      throw error;
    }
  },

  // Update coach schedule
  updateCoachSchedule: async (id, scheduleData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/coach-schedules/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(scheduleData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update coach schedule');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating coach schedule:', error);
      throw error;
    }
  },

  // Delete coach schedule
  deleteCoachSchedule: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/coach-schedules/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete coach schedule');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting coach schedule:', error);
      throw error;
    }
  }
}; 