# UA Designs PMS — User Guide for Your Client

This document explains every screen, button, and feature so you can walk your client through the system.

---

## 1. Logging in and account

### Login (`/login`)
- **Email** and **Password**: Enter credentials and click **Log in**.  
- **Forgot password?**: Opens the “Forgot password” flow to request a reset.  
- **Register**: Link to create a new account (if registration is enabled).

### Register (`/register`)
- New users enter **name**, **email**, **password** and any other required fields, then submit to create an account.

### Forgot password (`/forgot-password`)
- User enters **email**; the system sends (or triggers) a password reset.  
- Link **Back to login** returns to the login page.

---

## 2. Main layout (after login)

### Sidebar (left)
- **Menu icon** (top): On desktop, collapses/expands the sidebar. On mobile, opens the full menu in a drawer.
- **Logo**: UA Designs branding.
- **Menu items** (each opens that section):
  - **Dashboard** — Home / overview
  - **Projects** — All projects
  - **Analytics** — Portfolio analytics
  - **Schedule** — Project schedule & tasks
  - **Cost Management** — Budgets, costs, expenses
  - **Resources** — Materials, labor, equipment, team
  - **Risk Management** — Risks and mitigations
  - **Stakeholders** — Stakeholder register and engagement
  - **Reports** — Generate and export reports
  - **Users** — Only for Engineer and above (user management)
  - **Audit Log** — Only for certain roles (system activity log)
  - **Settings** — App preferences

### Header (top bar)
- **Menu icon**: Same as in sidebar (collapse menu or open mobile menu).
- **Bell (notifications)**: Click to open a dropdown with recent notifications; badge shows unread count.
- **User avatar/area**: Click to open a dropdown with:
  - **Profile** — Go to your profile
  - **Settings** — Go to Settings
  - **Logout** — Sign out

---

## 3. Dashboard

**Purpose:** High-level overview of projects, cost, schedule, and risk.

- **Stat cards (top row):**
  - **Total Projects** — Number of projects
  - **Active Projects** — Count of active projects
  - **Completed Tasks** — Tasks completed across projects
  - **Total Budget** — Sum of all project budgets (₱)

- **Cost Variance (chart):**  
  Shows “Current Variance” and a chart of planned vs actual cost by project.  
  **Refresh** (if shown): Reload dashboard data.

- **Schedule Performance (chart):**  
  Shows “Schedule Variance” and a bar chart of project progress.

- **Risk Matrix:**  
  Grid of risks by probability and impact (e.g. Very Low → Very High).  
  Helps see where most risks sit.

- **Quick Actions (card):**  
  Shortcuts that **navigate** to the right place to do the action:
  - **New Project** → Projects page (and can open “Create project”)
  - **Add Task** → Schedule
  - **Add Team Member** → Resources
  - **Add Risk** → Risk Management
  - **Add Cost Item** → Cost Management
  - **Generate Report** → Reports

- **Recent Activities:**  
  List of latest actions in the system (e.g. project created, task completed).

---

## 4. Projects

**Purpose:** List and manage all projects.

- **New Project** (top right):  
  Only for **Project Manager and above**. Opens a form to create a project (name, client, description, type, priority, dates, budget, client email/phone optional, location, optional project manager).

- **Stats row:**  
  Total Projects, Active, On Hold, Completed.

- **Filters:**
  - **Search** — By project name or client
  - **Status** — Planning, Active, On Hold, Completed, Cancelled
  - **Type** — e.g. Residential, Commercial, etc.
  - **Reset** — Clear all filters

- **Table columns:**  
  Name (with project # and client), Status, Priority, Type, Progress, Budget, Dates, Project Manager, **Actions** (⋮).

- **Actions (⋮) per row:**
  - **View Dashboard** — Opens that project’s dashboard/detail view
  - **Edit Project** — Edit basic project info (PM+)
  - **Update Status** — Change status/phase (PM+)
  - **Assign Manager** — Assign or change project manager (PM+)
  - **Delete** — Delete project (PM+)

- **Modals:**
  - **Create New Project** — All fields above; **Create Project** saves, **Cancel** closes.
  - **Edit Project** — Same fields; **Save Changes** / **Cancel**.
  - **Update Project Status** — Status and Phase dropdowns; submit to save.
  - **Assign Manager** — Choose a user as PM; submit to save.
  - **Project Dashboard** — Can open in a drawer/side panel with more detail.

---

## 5. Analytics

**Purpose:** Portfolio and project-level performance and KPIs.

- **Analytics Overview (main page):**
  - **Project Analytics** (button): Goes to per-project analytics for the first project (or you can navigate to a specific project’s analytics).
  - **Refresh**: Reload analytics data.
  - **KPI cards** and **charts**: Task distribution, expenses by category, monthly spending, recent activity (exact widgets depend on your build).

- **Project Analytics** (per project, e.g. `/projects/:id/analytics`):
  - **Back to Analytics Overview**: Returns to the main analytics page.
  - **Project switcher**: Dropdown to change which project’s analytics are shown.
  - **Refresh**: Reload that project’s analytics.
  - **Charts/cards**: Budget gauge, task distribution, expenses by category, monthly spending, recent activity for that project.

---

## 6. Schedule (PMBOK)

**Purpose:** Plan and control project schedule (tasks, dependencies, critical path, Gantt).

- **Project selector (top):**  
  Dropdown: “Select a project to manage”. Everything below is for the **selected project**.  
  (Creating a new project is done from **Projects** or Dashboard **New Project**.)

- **Refresh**: Reload schedule data for the selected project.

- **Tabs:**
  - **Tasks** — List of tasks. **Add Task** (PM+) adds a task. **Refresh** reloads.
  - **Dependencies** — Task dependencies. **Add Dependency** (PM+) adds a dependency.
  - **Critical Path** — Shows critical path tasks and total duration.
  - **Gantt Chart** — Bar chart of tasks over time.

- **Quick Stats (sidebar):**  
  Total Tasks, Completed, In Progress, Critical Path Tasks.

---

## 7. Cost Management (PMBOK)

**Purpose:** Manage budgets, costs, and expenses for the selected project.

- **Project selector:** Same idea as Schedule — pick the project first.
- **Refresh**: Reload cost data.

- **Tabs:**
  - **Costs** — List of cost entries. **Add Cost** (Engineer+) adds a cost line.
  - **Budgets** — Budget records. **Create Budget** (PM+) creates a budget.
  - **Expenses** — Expense list with status (Pending, Approved, Paid, Rejected). Filters (search, category, status, date range), **Filter** / **Clear**, **Add Expense** (Engineer+), **Bulk Approve** (PM+), **Clear Selection**. Clicking a row can open expense detail; approvals and receipts are managed here.

- **Quick Stats (sidebar):**  
  Total Budget, Costs Logged, Expenses Logged, Variance.

---

## 8. Resources (PMBOK)

**Purpose:** Materials, labor, equipment, team, and allocations for the selected project.

- **Project selector** and **Refresh** — Same pattern as Schedule/Cost.

- **Tabs:**
  - **Materials** — List of materials; add/edit/delete as per role.
  - **Labor** — Labor resources.
  - **Equipment** — Equipment resources.
  - **Team** — Team members; add/remove/edit.
  - **Allocations** — Who is assigned to what.

- **Quick Stats:**  
  Team Members, Equipment, Materials, Utilization %.

---

## 9. Risk Management (PMBOK)

**Purpose:** Identify and manage risks and mitigations for the selected project.

- **Project selector** and **Refresh** — Same pattern.

- **Tabs:**
  - **Risks** — Risk register; add/edit/delete risks, set severity/status, escalate (role-dependent).
  - **Mitigations** — Mitigation plans linked to risks.
  - **Risk Matrix** — Matrix view of risks by probability/impact.
  - **Overview** — Summary/overview of risk data.

- **Quick Stats:**  
  Total Risks, Critical/High, Active Risks, Mitigated.

---

## 10. Stakeholders (PMBOK)

**Purpose:** Register stakeholders, log communications, and track engagement.

- **Project selector** and **Refresh** — Same pattern.

- **Tabs:**
  - **Register** — List of stakeholders. Add/Edit stakeholder (name, organization, role, email, phone, influence, interest, type).
  - **Communications** — Log and view communications (e.g. date, type, notes).
  - **Engagement** — Record engagement and feedback (e.g. level, notes, rating).
  - **Influence Matrix** — Power vs interest (or influence vs interest) scatter chart and grid.

- **Quick Stats:**  
  Total Stakeholders, Key Stakeholders, Engagement Rate.

- **Modals:**  
  Add/Edit Stakeholder, Log Communication, Record Engagement/Feedback, etc., as shown on the page.

---

## 11. Reports

**Purpose:** Generate and export project reports (and project summary).

- **Select a project**: Dropdown at top. All report actions apply to the **selected project**.

- **Buttons (when a project is selected):**
  - **Project Summary** — Downloads a project summary export (e.g. Excel).
  - **Generate All** — Generates all report types below for that project.
  - **Export All** — Exports all generated report data (e.g. to Excel). Disabled until at least one report is generated successfully.

- **Report cards (list):**  
  Each card is one report type, e.g.:
  - Cost Overview  
  - Earned Value Management (EVM)  
  - Cost Forecast  
  - Risk Report  
  - Schedule Overview  
  - Resource Summary  
  - Stakeholder Summary  
  - Expense Summary  

  For each: **Generate** (or similar) loads data; when generated, the card shows the data (or a preview). **Export** (if present) exports that report.  
  **Generate All** runs generate for all of them; **Export All** exports every generated report.

---

## 12. Users (Engineer and above only)

**Purpose:** Manage system users and their roles.

- **Refresh**: Reload user list.
- **Add User**: Opens form — First Name, Last Name, Email, Password, Role (Admin, Project Manager, Architect, Engineer, Staff), optional Phone, Department. **Save** creates the user.

- **Table:**  
  Users with role, status, etc. **Actions (⋮)** per row typically include:
  - **Edit** — Edit name, email, role, phone, department (no password change here).
  - **Permissions** — Manage fine-grained permissions (if the app supports it).
  - **Activate / Deactivate** — Turn account on/off.
  - **Delete** — Remove user (use with care).

- **Modals:**  
  Add User, Edit User, Permissions (if any).

---

## 13. Audit Log (role-restricted)

**Purpose:** Read-only log of who did what and when (e.g. creates, updates, logins).

- **Refresh**: Reload log with current filters.

- **Filters:**
  - **Action** — e.g. Create, Update, Delete, Login, etc.
  - **Entity** — e.g. Project, Task, User, etc.
  - **User** — Filter by user.
  - **Date range** — Start and end date.
  - **Apply/Clear** — Apply filters or reset.

- **Table:**  
  Columns such as time, user, action, entity, details.  
  **Clicking a row** can open a **drawer** with full detail (e.g. request/response or changed fields).

---

## 14. Settings

**Purpose:** App preferences (and API status).

- **General Settings:**
  - **Language** — e.g. English, Spanish, French.
  - **Timezone** — e.g. UTC, EST, PST, etc.
  - **Date format** — e.g. MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD.
  - **Save General Settings** — Saves these to the browser (and/or backend if implemented).

- **Security:**  
  Message that password change is done on the **Profile** page (link or instruction to go there).

- **API / Server status:**  
  Shows whether the backend is **online** or **offline** (and optionally **Check** to re-test).

---

## 15. Profile

**Purpose:** Your own account info and password.

- **Profile form:**  
  Edit name, email, phone, department (or similar). **Save** updates your profile.

- **Change password:**  
  **Current password**, **New password**, **Confirm new password**. **Change password** submits; success message and form clear on success.

---

## 16. Project selector (repeated on several pages)

On **Schedule**, **Cost**, **Resources**, **Risk**, **Stakeholders**, and **Reports**, the **project selector** at the top is the same idea:

- **Dropdown:** “Select a project to manage” (or similar).  
- Choosing a project loads all data on that page for **that project**.  
- New projects are **not** created from this dropdown; use **Projects → New Project** or **Dashboard → New Project**.

---

## 17. Who can see what (summary)

- **Dashboard, Projects (view), Analytics, Schedule, Cost, Resources, Risk, Stakeholders, Reports, Settings, Profile:**  
  Available to all logged-in users; some **buttons** (e.g. New Project, Add Task, Add Cost, Delete) are restricted by role (e.g. PM+, Engineer+).

- **Users:**  
  Only **Engineer and above** (or as configured).

- **Audit Log:**  
  Only roles that have **Audit Log** in the sidebar (e.g. not Staff).

- **New Project / Edit / Delete project, Assign Manager, Update Status:**  
  Typically **Project Manager and above**.

- **Add Cost, Add Expense, Create Budget, Bulk Approve expenses:**  
  Typically **Engineer and above** or **PM and above** as configured.

You can adjust the exact roles in your app (e.g. in `ProtectedRoute` and `can('...')` checks) and then update this section to match.

---

## Quick reference — where to do what

| Goal | Where to go | Action |
|------|-------------|--------|
| See overview | Dashboard | Open Dashboard |
| Create a project | Projects or Dashboard | New Project (or Quick Action “New Project”) |
| Edit a project | Projects | ⋮ → Edit Project |
| Change project status | Projects | ⋮ → Update Status |
| Assign PM | Projects | ⋮ → Assign Manager |
| Add tasks | Schedule | Select project → Tasks → Add Task |
| Log costs/expenses | Cost Management | Select project → Costs/Expenses → Add Cost / Add Expense |
| Add risks | Risk Management | Select project → Risks → Add |
| Manage stakeholders | Stakeholders | Select project → Register / Communications / Engagement |
| Generate reports | Reports | Select project → Generate All or per-report Generate → Export All |
| Manage users | Users | Add User, Edit, Permissions (if role allows) |
| Change password | Profile | Change password section |
| App language/date | Settings | General Settings → Save |

---

*You can copy or adapt this guide for your client. If your app has extra buttons or tabs, add them under the matching section using the same style (what it’s for, who can use it, what happens when they click).*
