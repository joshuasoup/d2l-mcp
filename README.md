# D2L Brightspace MCP Server

An MCP (Model Context Protocol) server that provides AI assistants with tools to interact with D2L Brightspace LMS.

**I do not condone the use of this server in any activities that would violate the user's university's Academic Code of Conduct.**

## Features

- **Automated authentication** - Use `D2L_USERNAME` and `D2L_PASSWORD` env vars for automated login, or browser-based SSO
- **Persistent session storage** - login once, use for hours
- **12 tools** for accessing assignments, grades, calendar, announcements, course content
- **File downloads** with automatic text extraction (docx, txt, etc.)
- **LLM-optimized responses** - clean, token-efficient output
- **Multiple transport modes** - HTTP/SSE (default) or stdio for remote access

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/joshuasoup/d2l-mcp.git
cd d2l-mcp
```

### 2. Install dependencies and build

```bash
npm install
npm run build
```

This will automatically install Chromium for browser automation and build the project.

## Setup

### 1. Configure environment variables

Copy the example environment file and add your credentials:

```bash
cp .env.example .env
```

Then edit `.env` and add your D2L credentials:

```
D2L_HOST=learn.ul.ie
D2L_USERNAME=your-username
D2L_PASSWORD=your-password
D2L_COURSE_ID=your-course-id
```

### 2. First-time authentication

You can authenticate in two ways:

**Option A: Using environment variables (automated)**

If you've added `D2L_USERNAME` and `D2L_PASSWORD` to your `.env` file, the server will automatically log in using those credentials.

**Option B: Using browser (interactive)**

```bash
npm run auth
# or
d2l-mcp-auth
```

This opens a browser window where you log in to Brightspace. Your session is saved to `~/.d2l-session/`.

If both `D2L_USERNAME` and `D2L_PASSWORD` are set in your `.env` file, the server will automatically log in using those credentials. Otherwise, it will use the saved browser session or prompt for interactive login.

### 3. Configure poke mcp

Go to https://poke.com/settings/connections/integrations/new and enter your server URL (if you're doing it locally, port forward localhost:3000)

### 4. Running the Server

By default, the server runs in HTTP mode on port 3000:

```bash
d2l-mcp
# or
npm start
```

The server will start on `http://localhost:3000/mcp`. Clients can connect via:

- **POST** `/mcp` - Send JSON-RPC messages
- **GET** `/mcp` - Establish SSE stream for server-to-client messages
- **DELETE** `/mcp` - Terminate session

HTTP mode supports multiple concurrent clients, each with their own session ID.

To use stdio transport (for Claude Desktop), set the environment variable:

```bash
MCP_TRANSPORT=stdio d2l-mcp
```

## Available Tools

### Assignments

| Tool                         | Description                                          |
| ---------------------------- | ---------------------------------------------------- |
| `get_assignments`            | List all assignments with due dates and instructions |
| `get_assignment`             | Get full details for a specific assignment           |
| `get_assignment_submissions` | Get your submissions, grades, and feedback           |

### Course Content

| Tool                 | Description                              |
| -------------------- | ---------------------------------------- |
| `get_course_content` | Get complete course syllabus/structure   |
| `get_course_topic`   | Get details for a specific topic/lecture |
| `get_course_modules` | Get main sections/modules of a course    |
| `get_course_module`  | Get contents within a specific module    |

### Grades & Calendar

| Tool                     | Description                                  |
| ------------------------ | -------------------------------------------- |
| `get_my_grades`          | Get all your grades with scores and feedback |
| `get_upcoming_due_dates` | Get calendar events and deadlines            |

### Other

| Tool                | Description                                    |
| ------------------- | ---------------------------------------------- |
| `get_announcements` | Get course announcements from instructors      |
| `get_my_courses`    | List all your enrolled courses                 |
| `download_file`     | Download and extract content from course files |

## Example Prompts

Once connected to Poke, you can ask things like:

- "What assignments are due this week?"
- "Show me my grades"
- "What announcements have been posted?"
- "Download the weekly report template"
- "What's the syllabus for this course?"

## Environment Variables

| Variable        | Description                                            | Default                   |
| --------------- | ------------------------------------------------------ | ------------------------- |
| `D2L_HOST`      | Your Brightspace hostname                              | `brightspace.carleton.ca` |
| `D2L_USERNAME`  | Your D2L username for automated login (optional)       | none                      |
| `D2L_PASSWORD`  | Your D2L password for automated login (optional)       | none                      |
| `D2L_COURSE_ID` | Default course ID (optional)                           | none                      |
| `MCP_TRANSPORT` | Transport mode: `stdio`, `http`, or `https`            | `http`                    |
| `MCP_PORT`      | HTTP server port (only used when `MCP_TRANSPORT=http`) | `3000`                    |

Setting `D2L_COURSE_ID` allows you to omit the course ID from tool calls.

### Transport Modes

- **http** or **https** (default): HTTP/SSE transport for web clients or remote access. Uses StreamableHTTPServerTransport from the MCP SDK.
- **stdio**: Standard input/output transport, used by Claude Desktop and other MCP clients. Set `MCP_TRANSPORT=stdio` to use this mode.

## Session Management

- **Token expiry**: Auth tokens expire after ~1 hour but auto-refresh using the saved browser session
- **Session expiry**: Browser sessions expire after ~24h of inactivity
- **Re-authenticate**: Run `d2l-mcp-auth` if your session expires
- **Auto-authenticate** Add d2l username and password to .env to auto authenticate

## Development

```bash
# Run tests
npm test

# Run integration tests (requires auth)
npm run test:integration

# Watch mode
npm run test:watch
```

## License

MIT

## Credits

This project is based on the original work by [General-Mudkip](https://github.com/General-Mudkip/d2l-mcp-server).
This version includes additional features and modifications.
