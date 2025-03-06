class Kanban {
    constructor() {
      this.board = document.getElementById("kanbanBoard");
      this.columns = new Map();
      this.images = [
        "https://picsum.photos/40?random=1",
        "https://picsum.photos/40?random=2",
        "https://picsum.photos/40?random=3",
        "https://picsum.photos/40?random=4",
        "https://picsum.photos/40?random=5",
      ];
      this.isLoggedIn = false;
      this.isDarkMode = true;
      this.loadBoard();
      this.initEventListeners();
      this.setupNavbar();
      this.updateTaskCounts();
    }
  
    initEventListeners() {
      document.getElementById("addColumn").addEventListener("click", () => {
        if (!this.isLoggedIn) return alert("Please login first!");
        const title = prompt("Enter column title:")?.trim();
        if (title) this.createColumn(title);
      });
  
      this.board.addEventListener("dragstart", (e) => {
        const task = e.target.closest(".task");
        if (task) {
          task.classList.add("dragging");
          e.dataTransfer.setData("text/plain", task.id);
          e.dataTransfer.effectAllowed = "move";
        }
      });
  
      this.board.addEventListener("dragend", (e) => {
        const task = e.target.closest(".task");
        if (task) task.classList.remove("dragging");
      });
  
      this.board.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      });
  
      this.board.addEventListener("drop", (e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("text/plain");
        const task = document.getElementById(taskId);
        const targetList = e.target.closest(".task-list");
  
        if (task && targetList) {
          targetList.appendChild(task);
          this.saveBoard();
          this.updateTaskCounts();
        }
      });
  
      this.board.addEventListener("click", (e) => {
        const editBtn = e.target.closest(".edit-btn");
        const deleteBtn = e.target.closest(".delete-btn");
        const deleteColumnBtn = e.target.closest(".delete-column");
  
        if (editBtn) {
          const task = editBtn.closest(".task");
          const newContent = prompt(
            "Edit task content:",
            task.querySelector("span").textContent
          )?.trim();
          const newDue = prompt(
            "Edit due date (YYYY-MM-DD):",
            task.dataset.due || ""
          )?.trim();
          if (newContent) {
            task.querySelector("span").textContent = newContent;
            if (newDue) {
              task.dataset.due = newDue;
              this.updateDueDate(task, newDue);
            }
            this.saveBoard();
          }
        }
        if (deleteBtn) {
          const task = deleteBtn.closest(".task");
          if (confirm("Delete this task?")) {
            task.remove();
            this.saveBoard();
            this.updateTaskCounts();
          }
        }
        if (deleteColumnBtn) {
          const column = deleteColumnBtn.closest(".column");
          if (confirm("Delete this column and all its tasks?")) {
            const columnId = column.dataset.id;
            column.remove();
            this.columns.delete(columnId);
            this.saveBoard();
            this.updateTaskCounts();
          }
        }
      });
    }
  
    setupNavbar() {
      const loginBtn = document.getElementById("loginBtn");
      const logoutBtn = document.getElementById("logoutBtn");
      const toggleThemeBtn = document.getElementById("toggleTheme");
  
      loginBtn.addEventListener("click", () => {
        const username = prompt("Enter username:")?.trim();
        if (username) {
          this.isLoggedIn = true;
          loginBtn.style.display = "none";
          logoutBtn.style.display = "inline-block";
          alert(`Welcome, ${username}!`);
        }
      });
  
      logoutBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to logout?")) {
          this.isLoggedIn = false;
          loginBtn.style.display = "inline-block";
          logoutBtn.style.display = "none";
        }
      });
  
      toggleThemeBtn.addEventListener("click", () => {
        this.isDarkMode = !this.isDarkMode;
        document.body.classList.toggle("light-mode");
        this.board.classList.toggle("light-mode");
        this.board
          .querySelectorAll(".column")
          .forEach((col) => col.classList.toggle("light-mode"));
        document.querySelector(".navbar").classList.toggle("light-mode");
        toggleThemeBtn.textContent = this.isDarkMode ? "Light Mode" : "Dark Mode";
      });
    }
  
    createColumn(title) {
      const columnId = `col-${Date.now()}`;
      const column = document.createElement("div");
      column.className = "column";
      column.dataset.id = columnId;
  
      column.innerHTML = `
              <div class="column-header">
                  <div>
                      <span class="column-title">${title}</span>
                      <span class="task-count">(0 tasks)</span>
                  </div>
                  <button class="delete-column">🗑️</button>
              </div>
              <div class="task-list" data-column-id="${columnId}"></div>
              <button class="add-btn add-task-btn">+ Task</button>
          `;
  
      const addTaskBtn = column.querySelector(".add-task-btn");
      addTaskBtn.addEventListener("click", () => {
        if (!this.isLoggedIn) return alert("Please login first!");
        const content = prompt("Enter task content:")?.trim();
        const importance = prompt("Enter importance (low/medium/high):")
          ?.toLowerCase()
          .trim();
        const dueDate = prompt("Enter due date (YYYY-MM-DD, optional):")?.trim();
        if (content)
          this.createTask(
            column.querySelector(".task-list"),
            content,
            columnId,
            importance,
            dueDate
          );
      });
  
      this.board.appendChild(column);
      this.columns.set(columnId, { title, tasks: [] });
      this.saveBoard();
      return columnId;
    }
  
    createTask(taskList, content, columnId, importance = "low", dueDate = "") {
      const taskId = `task-${Date.now()}`;
      const randomImage =
        this.images[Math.floor(Math.random() * this.images.length)];
      const task = document.createElement("div");
      task.className = `task ${importance}`;
      task.id = taskId;
      task.draggable = true;
      if (dueDate) task.dataset.due = dueDate;
  
      task.innerHTML = `
              <img src="${randomImage}" alt="Task icon">
              <div class="task-content">
                  <span>${content}</span>
                  ${
                    dueDate
                      ? `<div class="task-due">${this.formatDueDate(
                          dueDate
                        )}</div>`
                      : ""
                  }
              </div>
              <div class="task-actions">
                  <button class="task-btn edit-btn">✏️</button>
                  <button class="task-btn delete-btn">🗑️</button>
              </div>
          `;
      taskList.appendChild(task);
      this.checkDueDate(task, dueDate);
  
      const columnData = this.columns.get(columnId);
      if (columnData) {
        columnData.tasks.push({
          id: taskId,
          content,
          importance,
          image: randomImage,
          dueDate,
        });
        this.saveBoard();
        this.updateTaskCounts();
      }
    }
  
    formatDueDate(dueDate) {
      const date = new Date(dueDate);
      return `Due: ${date.toLocaleDateString()}`;
    }
  
    checkDueDate(task, dueDate) {
      if (!dueDate) return;
      const due = new Date(dueDate);
      const now = new Date();
      if (due < now) {
        task.querySelector(".task-due").classList.add("overdue");
      }
    }
  
    updateDueDate(task, dueDate) {
      const dueElement = task.querySelector(".task-due");
      if (dueDate) {
        if (dueElement) {
          dueElement.textContent = this.formatDueDate(dueDate);
        } else {
          const contentDiv = task.querySelector(".task-content");
          contentDiv.insertAdjacentHTML(
            "beforeend",
            `<div class="task-due">${this.formatDueDate(dueDate)}</div>`
          );
        }
        this.checkDueDate(task, dueDate);
      } else if (dueElement) {
        dueElement.remove();
      }
    }
  
    updateTaskCounts() {
      this.board.querySelectorAll(".column").forEach((column) => {
        const count = column.querySelectorAll(".task").length;
        column.querySelector(".task-count").textContent = `(${count} tasks)`;
      });
    }
  
    saveBoard() {
      const boardData = {};
      this.columns.forEach((value, key) => {
        const columnEl = this.board.querySelector(`[data-id="${key}"]`);
        if (columnEl) {
          boardData[key] = {
            title: value.title,
            tasks: Array.from(columnEl.querySelectorAll(".task")).map((task) => ({
              id: task.id,
              content: task.querySelector("span").textContent,
              importance:
                task.className
                  .split(" ")
                  .find((cls) => ["low", "medium", "high"].includes(cls)) ||
                "low",
              image: task.querySelector("img").src,
              dueDate: task.dataset.due || "",
            })),
          };
        }
      });
      localStorage.setItem("kanbanBoard", JSON.stringify(boardData));
    }
  
    loadBoard() {
      const savedData = localStorage.getItem("kanbanBoard");
      if (savedData) {
        const boardData = JSON.parse(savedData);
        this.columns.clear();
        this.board.innerHTML = "";
        Object.entries(boardData).forEach(([columnId, data]) => {
          const newColumnId = this.createColumn(data.title);
          const column = this.board.querySelector(`[data-id="${newColumnId}"]`);
          const taskList = column.querySelector(".task-list");
          data.tasks.forEach((taskData) => {
            this.createTask(
              taskList,
              taskData.content,
              newColumnId,
              taskData.importance,
              taskData.dueDate
            );
          });
        });
      } else {
        this.createColumn("To Do");
      }
    }
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    new Kanban();
  });