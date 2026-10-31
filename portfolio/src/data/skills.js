/**
 * Centralized Skills Data
 * Organized into six core domains matching Yara's technical background.
 * No fabricated percentages or artificial proficiency meters.
 */
export const skillCategories = [
  {
    id: "backend",
    category: "Backend Development",
    icon: "server",
    description: "Enterprise and server-side web engineering",
    skills: [
      { name: "ASP.NET Core", tag: "Framework" },
      { name: ".NET", tag: "Platform" },
      { name: "Node.js", tag: "Runtime" }
    ]
  },
  {
    id: "frontend",
    category: "Frontend Development",
    icon: "layout",
    description: "Modern, responsive, dynamic user interfaces",
    skills: [
      { name: "React", tag: "Library" },
      { name: "Angular", tag: "Framework" },
      { name: "JavaScript", tag: "Language" },
      { name: "HTML5", tag: "Markup" },
      { name: "CSS3", tag: "Styling" },
      { name: "Bootstrap", tag: "UI Framework" }
    ]
  },
  {
    id: "languages",
    category: "Programming Languages",
    icon: "code",
    description: "Core syntax, paradigms, and system languages",
    skills: [
      { name: "C#", tag: "Object-Oriented" },
      { name: "C++", tag: "Systems" },
      { name: "Java", tag: "Enterprise" },
      { name: "Python", tag: "Scripting / Data" },
      { name: "JavaScript", tag: "Web Standard" },
      { name: "SQL", tag: "Relational Queries" }
    ]
  },
  {
    id: "database",
    category: "Databases & ORM",
    icon: "database",
    description: "Data modeling, relational storage, and ORM mapping",
    skills: [
      { name: "SQL Server", tag: "RDBMS" },
      { name: "SQLite", tag: "Embedded DB" },
      { name: "Entity Framework Core", tag: "ORM" }
    ]
  },
  {
    id: "concepts",
    category: "Computer Science Concepts",
    icon: "cpu",
    description: "Architectural patterns and foundational science",
    skills: [
      { name: "Object-Oriented Programming (OOP)", tag: "Paradigm" },
      { name: "LINQ", tag: "Query Syntax" },
      { name: "REST APIs", tag: "Architecture" },
      { name: "CRUD Operations", tag: "Data Flow" },
      { name: "Data Structures & Algorithms", tag: "Foundation" }
    ]
  },
  {
    id: "tools",
    category: "Developer Tools & IDEs",
    icon: "wrench",
    description: "Version control and development environments",
    skills: [
      { name: "Git", tag: "Version Control" },
      { name: "GitHub", tag: "Collaboration" },
      { name: "Visual Studio Code", tag: "Editor" },
      { name: "Visual Studio", tag: "IDE" }
    ]
  }
];
