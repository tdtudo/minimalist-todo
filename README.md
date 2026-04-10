# ToDo_list - User Manual

## Introduction

ToDo_list is a minimalist desktop todo application with a transparent frosted glass effect. It stays on your desktop without interfering with your workflow.

## Installation

### Portable Version (Recommended)
1. Double-click `ToDo_list 1.0.0.exe`
2. Run directly without installation
3. Can be placed anywhere (desktop, USB drive, etc.)

### Installer Version
1. Double-click `ToDo_list Setup 1.0.0.exe`
2. Choose installation path
3. Click "Next" to complete installation
4. Desktop shortcut will be created automatically

## Features

### Window Controls

The application has three colored buttons in the top-left corner:

- **Red button** - Close application
- **Yellow button** - Minimize window
- **Green button** - Pin window to desktop top layer
  - Button turns purple when pinned
  - Click again to unpin

### Adding Tasks

1. Click the **+** button in the top-right corner
2. Enter task content in the input box
3. Click "Add" button or press **Enter** to confirm
4. Click outside the input box or click the **+** button again to close

### Managing Tasks

- **Complete task** - Click the checkbox on the left
  - Task automatically moves to the bottom
  - Text shows strikethrough and lighter color
- **Delete task** - Hover over task and click the "Delete" button on the right
- **View tasks** - Completed tasks appear at the bottom of the list

### Window Features

- **Transparent background** - Semi-transparent frosted glass effect
- **Not in Alt+Tab** - Doesn't interfere with app switching
- **Not in taskbar** - Acts like a desktop widget
- **Draggable** - Drag by the window title bar to move
- **Always on top** - Stays above other windows when pinned

### Language Switching

- Click the **中/EN** button in the top-right corner
- Supports Chinese and English
- Language preference is saved automatically

## Data Storage

- All task data is automatically saved locally
- Data file location: `%APPDATA%\my-todo-app\todos.json`
- Data persists after closing the application

## Shortcuts

- **Enter** - Press Enter in the input box to quickly add a task
- **Click outside** - Click outside the input box to close it automatically

## Visual Effects

- **Light theme** - Light semi-transparent background
- **Smooth animations** - Fluid animations for task addition, completion, and deletion
- **Frosted glass effect** - Background blur effect
- **Minimalist design** - No unnecessary elements

## FAQ

### Q: How do I keep the window always on top?
A: Click the green button in the top-left corner. The button turns purple when pinned.

### Q: Why doesn't the window appear in Alt+Tab?
A: This is a design feature to make the todo list act like a desktop widget without interfering with app switching.

### Q: Will my task data be lost?
A: No, all data is automatically saved to a local file.

### Q: How do I change the window position?
A: Drag the window title bar (top area) to move it.

### Q: Can I run multiple instances?
A: Yes, but each instance shares the same data file.

## Technical Information

- **Framework**: Electron
- **Frontend**: HTML, CSS, JavaScript
- **Data Storage**: JSON file
- **Platform Support**: Windows

## Version Information

Current version: 1.0.0

## Feedback & Support

For questions or suggestions, please contact the developer.

---

## 简介（中文）

ToDo_list 是一个极简风格的桌面待办清单应用，采用透明毛玻璃效果，始终显示在桌面上，不会干扰你的工作流程。

详细中文说明请参考上方英文部分。

## License

MIT License
