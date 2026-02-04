# StaffPlan User Guide

Welcome to StaffPlan, a web application for strategic staff and budget planning at research institutions. This guide explains how to use all features of StaffPlan, from viewing positions to managing research groups.

**Who is this guide for?** All StaffPlan users, including administrators, job managers, professors, and employees. Each section notes which roles have access to specific features.

## Table of Contents

1. [Getting Started](#getting-started) - How to log in and navigate the application
2. [Understanding User Roles](#understanding-user-roles) - What each role can do
3. [Positions Overview](#positions-overview) - Viewing and filtering staff positions
4. [Position Finder](#position-finder) - Finding the best position matches
5. [Research Group Management](#research-group-management) - Managing chairs and institutes
6. [User Management](#user-management) - Managing users and their roles
7. [Grade Value Management](#grade-value-management) - Configuring salary grades
8. [Importing Data](#importing-data) - Uploading data from CSV files
9. [Frequently Asked Questions](#frequently-asked-questions) - Common questions and answers

---

## Getting Started

### Logging In

1. Open StaffPlan in your web browser
2. Click the **Login** button on the landing page
3. You will be redirected to the university login page (Keycloak)
4. Enter your university credentials (TUM ID and password)
5. After successful authentication, you will be redirected to the main application

### Navigation

After logging in, you will see:
- **Navigation bar** at the top with your available menu items
- **User menu** in the top-right corner showing your name and role
- **Main content area** displaying the current page

The menu items you see depend on your assigned role:

| Role | Available Menu Items |
|------|---------------------|
| Admin | Positions, Position Finder, Research Groups, Users, Grade Values |
| Job Manager | Positions, Position Finder |
| Professor | Positions (filtered to your group) |
| Employee | Positions (filtered to your group) |

---

## Understanding User Roles

StaffPlan has four user roles with different access levels:

### Administrator (Admin)

Administrators have full access to all features:
- Manage all positions across the university
- Create and manage research groups
- Manage users and assign roles
- Define and modify salary grade values
- Import data from CSV files
- Access all reports and analytics

### Job Manager

Job Managers handle day-to-day position management:
- View and search all positions
- Use the Position Finder to match employees to positions
- Upload position data from CSV files
- View research group information
- Access grade value information

### Professor

Professors have access to their own research group:
- View positions assigned to their research group
- See the Gantt chart visualization of their positions
- Filter and search within their positions
- Track position availability over time

### Employee

Employees have read-only access:
- View positions in their assigned research group
- See the Gantt chart visualization
- Filter and search positions

---

## Positions Overview

The Positions page shows all staff positions in a visual timeline format called a Gantt chart. This gives you a quick overview of when positions start and end, how full they are, and which positions may need attention.

### Understanding the Gantt Chart

The Gantt chart displays positions as horizontal bars on a timeline. Each bar represents one position:

- **Each row** represents a single position
- **The bar length** shows the position's duration (start to end date)
- **The bar color** indicates the salary grade type
- **The fill percentage** is shown on each bar (e.g., "65%" means the position is 65% filled)

### Filtering Positions

Use the filter options above the chart to narrow down the display:

1. **Search**: Type to search by position ID, description, or grade
2. **Status Filter**: Show only active, archived, or all positions
3. **Grade Filter**: Filter by specific salary grades (e.g., E13, E14, W3)
4. **Date Filter**: Highlight positions unfilled on a specific date
5. **Percentage Filter**: Filter by minimum fill percentage

### Adjusting the Timeline

Use the **Zoom** dropdown to change the timeline view:
- **3 months**: Detailed short-term view
- **6 months**: Quarter view
- **12 months**: Annual view (default)
- **24 months**: Two-year planning view
- **36/60 months**: Long-term strategic view

### Understanding Position Details

Each position shows:
- **Object ID**: Unique identifier
- **Description**: Position title (e.g., "PhD Student Machine Learning")
- **Grade**: Salary grade (e.g., E13, E14, W3)
- **Percentage**: How much of the position is filled (0-100%)
- **Organization Unit**: The research group or department
- **Dates**: When the position starts and ends

---

## Position Finder

The Position Finder helps you find available positions that match an employee's requirements. This is useful when you need to place a new employee or extend an existing contract.

**When to use Position Finder:**
- Hiring a new PhD student or postdoc
- Extending an employee's contract
- Finding positions for employees whose current positions are ending
- Exploring available capacity in specific research areas

### How to Search

1. Navigate to **Position Finder** in the menu
2. Fill in the search criteria:
   - **Employee Grade** (required): The salary grade the employee needs (e.g., E13)
   - **Fill Percentage** (required): How much of a position is needed (e.g., 65%)
   - **Start Date** (required): When the employment should begin
   - **End Date** (required): When the employment should end
   - **Relevance Type** (optional): Filter by specific position types
3. Click **Search**

### Understanding Results

The search results show matching positions sorted by efficiency:

#### Match Quality Indicators

Each result shows a quality rating:
- **Excellent** (green): Perfect or near-perfect match
- **Good** (blue): Good match with minor compromises
- **Fair** (yellow): Acceptable but not ideal
- **Poor** (red): Significant issues, consider alternatives

#### Key Metrics

For each matching position, you'll see:
- **Monthly Cost**: What this position costs per month
- **Available %**: How much capacity is available
- **Overlap**: Whether the dates fully cover your needs
- **Budget Waste**: Unused budget (lower is better)

#### Warnings

Watch for warning indicators:
- **High waste**: More than 20% of the budget would be unused
- **Partial overlap**: Position dates don't fully cover your needs
- **Multiple assignments**: Position already has several employees

### Split Suggestions

If no single position matches your needs, StaffPlan suggests combinations:

- **Split suggestions** show how to combine multiple positions
- The total percentage shows if the combination meets your needs
- Excess percentage is highlighted if the combination exceeds requirements

---

## Research Group Management

*Available to: Administrators only*

Research groups represent the organizational units (chairs, institutes) at the university.

### Viewing Research Groups

The Research Groups page shows:
- **Name**: Full name of the research group
- **Abbreviation**: Short code (e.g., I-ML for Machine Learning)
- **Professor**: The assigned head of the group
- **Assignment Status**: Whether the professor is properly linked
- **Department**: The parent department
- **Position Count**: Number of positions assigned
- **Status**: Active or Archived

### Creating a Research Group

1. Click **Add** (Hinzufügen)
2. Fill in the required fields:
   - **Name**: Full name (must be unique)
   - **Abbreviation**: Short code (must be unique)
3. Fill in optional fields:
   - **Department**: Select from dropdown
   - **Campus**: Select location
   - **Professor Name**: First and last name
   - **Professor Email**: Their email address
   - **Professor University ID**: Their login ID (e.g., ga69hun)
   - **Website URL**: Group homepage
   - **Description**: Additional information
4. Click **Create** (Erstellen)

### Professor Assignment Status

The **Assignment** column shows how the professor is linked:

| Icon | Status | Meaning |
|------|--------|---------|
| ✓ (green) | Mapped | Professor is linked via University ID |
| ✉ (blue) | Email | Will be matched when professor logs in via email |
| ⚠ (orange) | Manual | Requires manual assignment by admin |
| - | None | No professor information available |

### Importing Research Groups

1. Click **CSV Import**
2. Select your CSV file
3. Review the import results:
   - **Created**: New groups added
   - **Updated**: Existing groups modified
   - **Skipped**: Duplicate or invalid entries
   - **Errors/Warnings**: Issues to review

CSV format:
```
firstName,lastName,groupName,abbreviation,department,email,login
Maria,Schneider,Machine Learning,I-ML,Computer Science,maria.schneider@tum.de,ml52sch
```

### Assigning Positions to Groups

To automatically match positions to research groups:

1. Click **Positionen zuordnen** (Assign Positions)
2. The system matches positions based on organization unit names
3. Review the results showing matched and unmatched positions

---

## User Management

*Available to: Administrators only*

### Viewing Users

The Users page shows all users with:
- **Name**: First and last name
- **University ID**: Login identifier
- **Email**: Contact email
- **Roles**: Assigned roles (admin, job_manager, professor, employee)
- **Research Group**: Assigned group (if any)

### Managing User Roles

1. Find the user in the list
2. Click the **Edit** icon
3. Check/uncheck the role checkboxes:
   - **Admin**: Full administrative access
   - **Job Manager**: Position management access
   - **Professor**: Research group access
   - **Employee**: Read-only access
4. Click **Save**

### Understanding Login Status

Users show a **"Nie angemeldet"** (Never logged in) tag if they were created via import but haven't logged in yet. This helps identify:
- Newly imported professors who need to activate their accounts
- Users who may need assistance logging in

---

## Grade Value Management

*Available to: Administrators only*

Grade values define the salary grades used in positions.

### Understanding Grades

| Type | Description | Examples |
|------|-------------|----------|
| E | Employee grades (TV-L/TVöD) | E8, E9, E10, E11, E12, E13, E14, E15 |
| A | Civil service grades | A9, A10, A11, A12, A13, A14, A15, A16 |
| W | Professor grades | W1, W2, W3 |
| C | Legacy professor grades | C2, C3, C4 |
| SPECIAL | Special positions | Custom grades |

### Managing Grades

**To add a new grade:**
1. Click **Add Grade**
2. Enter:
   - **Grade Code**: Unique identifier (e.g., E13)
   - **Type**: Select grade type
   - **Display Name**: User-friendly name
   - **Monthly Value**: Salary for calculations
   - **Min/Max Salary**: Salary range (optional)
3. Click **Save**

**To edit a grade:**
1. Click the edit icon next to the grade
2. Modify the values
3. Click **Save**

**To delete a grade:**
1. Click the delete icon
2. Confirm deletion
3. Note: Grades in use cannot be deleted

---

## Importing Data

### Position Import

*Available to: Job Managers and Administrators*

1. Navigate to **Positions**
2. Click **Import** or use the upload button
3. Select your CSV file
4. The system automatically:
   - Detects the delimiter (comma, semicolon, or tab)
   - Parses various date formats
   - Validates data integrity
5. Review the import count

### Research Group Import

*Available to: Administrators only*

1. Navigate to **Research Groups**
2. Click **CSV Import**
3. Select your CSV file with format:
   ```
   firstName,lastName,groupName,abbreviation,department,email,login
   ```
4. Review the import results

### Tips for Successful Imports

- **Encoding**: Save CSV files as UTF-8
- **Headers**: Include a header row with column names
- **Dates**: Use common formats (DD.MM.YYYY, MM/DD/YY, YYYY-MM-DD)
- **Empty values**: Leave fields blank if unknown (don't use "N/A")
- **Duplicates**: Existing records are updated, not duplicated

---

## Frequently Asked Questions

### General Questions

**Q: I can't see any positions. What's wrong?**

A: Check these common causes:
1. Your user might not have the correct role assigned
2. As a professor/employee, you can only see positions in your research group
3. There might not be any positions in the system yet
4. Try adjusting the filters (they might be hiding positions)

**Q: How do I change my password?**

A: Passwords are managed through the university's central authentication system (Keycloak). Contact your IT department if you need to reset your password.

**Q: Why can't I edit certain positions?**

A: Position editing depends on your role:
- Professors and employees have read-only access
- Job managers can import but not edit individual positions
- Only administrators have full editing capabilities

### Position Finder Questions

**Q: What does "budget waste" mean?**

A: Budget waste shows the difference between what a position costs and what you actually need. For example, if a position pays for 100% but you only need 65%, the remaining 35% is "waste" - funds that could potentially be used elsewhere.

**Q: Why are there no results for my search?**

A: Common reasons:
1. No positions match the specified grade
2. No positions are available in the date range
3. All matching positions are already fully assigned
4. The relevance type filter is too restrictive

**Q: What is a "split suggestion"?**

A: When no single position can fulfill your requirements, StaffPlan suggests combining multiple partial positions. For example, two 50% positions could cover a 100% need.

### Research Group Questions

**Q: What does "Needs Manual Mapping" mean?**

A: This indicates that the system couldn't automatically identify the professor for this research group. An administrator needs to manually assign the correct professor or update the professor's University ID.

**Q: How do professors get assigned to their groups?**

A: There are three ways:
1. **Automatic by ID**: If the professor's University ID matches, they're assigned automatically on login
2. **Automatic by email**: If the professor's email matches, they're assigned on login
3. **Manual**: An administrator assigns them directly

### Technical Questions

**Q: What browsers are supported?**

A: StaffPlan works best with:
- Google Chrome (recommended)
- Mozilla Firefox
- Microsoft Edge
- Safari

**Q: Why is the page loading slowly?**

A: Large datasets can take time to load. Try:
1. Using filters to reduce the data displayed
2. Selecting a shorter time range in the Gantt chart
3. Clearing your browser cache

**Q: I'm getting a "Session Expired" error. What do I do?**

A: Your login session has timed out. Simply refresh the page and log in again.

---

## Getting Help

If you encounter issues not covered in this guide:

| Issue Type | Who to Contact |
|------------|----------------|
| **Cannot log in** | Your IT department or helpdesk |
| **Need access to a feature** | Your supervisor or a StaffPlan administrator |
| **Found a bug or error** | Report through your institution's ticketing system |
| **Need a new role assigned** | Contact a StaffPlan administrator |
| **Data looks incorrect** | Contact your Job Manager or administrator |

### Quick Tips

- **Bookmark the application**: Save the StaffPlan URL for easy access
- **Use filters**: If pages load slowly, use filters to reduce the displayed data
- **Check your role**: If you cannot see expected features, verify your role is correct with an administrator
- **Clear browser cache**: If you experience display issues, try clearing your browser's cache and cookies

---

*Last updated: February 2026*
