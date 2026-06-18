import React, { useState, useEffect } from "react";
import "./App.css";

const API = "https://task-engine-seven.vercel.app/api/tasks";

function App() {
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [filter, setFilter] = useState("All");
  const [quote, setQuote] = useState("");
  const [quoteAuthor, setQuoteAuthor] = useState("");
  const [error, setError] = useState("");

  const fetchTasks = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      if (data.success) {
        setTasks(data.data);
        setQuote(data.meta.motivationalQuote);
        setQuoteAuthor(data.meta.quoteAuthor);
      }
    } catch (err) {
      setError("Failed to fetch tasks");
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const addTask = async () => {
    if (!text.trim()) return;
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, priority }),
      });
      const data = await res.json();
      if (data.success) {
        setText("");
        setTasks([...tasks, data.data]); // update locally, no refetch
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to add task");
    }
  };

  const toggleTask = async (id) => {
    // Update locally first (instant, no flicker)
    setTasks(tasks.map(task =>
      task._id === id ? { ...task, completed: !task.completed } : task
    ));
    // Sync with backend silently
    await fetch(`${API}/${id}/toggle`, { method: "PATCH" });
  };

  const clearCompleted = async () => {
    setTasks(tasks.filter(task => !task.completed)); // update locally, no refetch
    await fetch(`${API}/completed`, { method: "DELETE" });
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "Completed") return task.completed;
    if (filter === "High") return task.priority === "High";
    return true;
  });

  return (
    <div className="container">
      <h1>Task Priority Dashboard</h1>

      {quote && (
        <div className="quote">
          "{quote}" — <strong>{quoteAuthor}</strong>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      <div className="input-row">
        <input
          type="text"
          placeholder="Enter task description..."
          value={text}
          maxLength={50}
          onChange={(e) => { setText(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <button className="btn-add" onClick={addTask}>Add Task</button>
      </div>

      <div className="filters">
        {["All", "High", "Completed"].map((f) => (
          <button
            key={f}
            className={filter === f ? "active" : ""}
            onClick={() => setFilter(f)}
          >
            {f === "High" ? "High Priority" : f}
          </button>
        ))}
        <button className="btn-clear" onClick={clearCompleted}>Clear Completed</button>
      </div>

      <div className="task-list">
        {filteredTasks.length === 0 ? (
          <p className="empty">No tasks found.</p>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task._id}
              className={`task-item ${task.completed ? "completed" : ""} priority-${task.priority.toLowerCase()}`}
              onClick={() => toggleTask(task._id)}
            >
              <span className="task-text">{task.text}</span>
              <span className="badge">{task.priority}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;