import { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { gql } from '@apollo/client';
import './CalendarView.css';

const GET_TICKETS = gql`
  query GetTickets($filter: TicketFilterInput) {
    tickets(filter: $filter) {
      id
      title
      description
      status
      priority
      createdAt
      creator {
        id
        name
      }
      assignee {
        id
        name
      }
    }
  }
`;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function CalendarView() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month' or 'week'

  const { loading, error, data } = useQuery(GET_TICKETS);

  // Get calendar data for current month
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevMonthDays = startingDayOfWeek;
    
    // Days from next month
    const totalCells = Math.ceil((daysInMonth + startingDayOfWeek) / 7) * 7;
    const nextMonthDays = totalCells - (daysInMonth + startingDayOfWeek);
    
    const days = [];
    
    // Previous month days
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Next month days
    for (let i = 1; i <= nextMonthDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  }, [currentDate]);

  // Get week data for current week
  const weekData = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push({
        date,
        isCurrentMonth: date.getMonth() === currentDate.getMonth()
      });
    }
    
    return days;
  }, [currentDate]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    if (!data?.tickets) return {};
    
    const grouped = {};
    data.tickets.forEach(ticket => {
      // Parse the createdAt timestamp - it could be a string or number
      const date = new Date(ticket.createdAt);
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(ticket);
    });
    
    return grouped;
  }, [data]);

  const getEventsForDate = (date) => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return eventsByDate[dateKey] || [];
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleEventClick = (ticketId) => {
    navigate(`/ticket/${ticketId}`);
  };

  const getPriorityClass = (priority) => {
    return `priority-${priority.toLowerCase()}`;
  };

  const getStatusClass = (status) => {
    return `status-${status.toLowerCase().replace('_', '-')}`;
  };

  if (loading) {
    return (
      <div className="calendar-container">
        <div className="loading">Loading calendar...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calendar-container">
        <div className="error">Error loading events: {error.message}</div>
      </div>
    );
  }

  const displayData = view === 'month' ? calendarData : weekData;

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-title">
          <h1>📅 Calendar</h1>
          <p className="calendar-subtitle">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </p>
        </div>
        
        <div className="calendar-controls">
          <div className="view-toggle">
            <button
              className={`view-btn ${view === 'month' ? 'active' : ''}`}
              onClick={() => setView('month')}
            >
              Month
            </button>
            <button
              className={`view-btn ${view === 'week' ? 'active' : ''}`}
              onClick={() => setView('week')}
            >
              Week
            </button>
          </div>
          
          <div className="navigation-controls">
            <button
              className="nav-btn"
              onClick={view === 'month' ? goToPreviousMonth : goToPreviousWeek}
            >
              ← Previous
            </button>
            <button className="nav-btn today-btn" onClick={goToToday}>
              Today
            </button>
            <button
              className="nav-btn"
              onClick={view === 'month' ? goToNextMonth : goToNextWeek}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      <div className={`calendar-grid ${view === 'week' ? 'week-view' : ''}`}>
        {/* Day headers */}
        {DAYS.map(day => (
          <div key={day} className="calendar-day-header">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {displayData.map((dayData, index) => {
          const events = getEventsForDate(dayData.date);
          const isTodayDate = isToday(dayData.date);

          return (
            <div
              key={index}
              className={`calendar-day ${!dayData.isCurrentMonth ? 'other-month' : ''} ${
                isTodayDate ? 'today' : ''
              }`}
            >
              <div className="day-number">
                {dayData.date.getDate()}
              </div>
              
              <div className="day-events">
                {events.slice(0, view === 'week' ? 10 : 3).map(event => (
                  <div
                    key={event.id}
                    className={`event-badge ${getPriorityClass(event.priority)} ${getStatusClass(event.status)}`}
                    onClick={() => handleEventClick(event.id)}
                    title={`${event.title}\n${event.description || ''}\nStatus: ${event.status}\nPriority: ${event.priority}`}
                  >
                    <span className="event-title">{event.title}</span>
                    {view === 'week' && (
                      <span className="event-meta">
                        {event.priority} • {event.status}
                      </span>
                    )}
                  </div>
                ))}
                
                {events.length > (view === 'week' ? 10 : 3) && (
                  <div className="more-events">
                    +{events.length - (view === 'week' ? 10 : 3)} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-badge priority-urgent"></span>
          <span>Urgent</span>
        </div>
        <div className="legend-item">
          <span className="legend-badge priority-high"></span>
          <span>High</span>
        </div>
        <div className="legend-item">
          <span className="legend-badge priority-medium"></span>
          <span>Medium</span>
        </div>
        <div className="legend-item">
          <span className="legend-badge priority-low"></span>
          <span>Low</span>
        </div>
      </div>
    </div>
  );
}

export default CalendarView;
