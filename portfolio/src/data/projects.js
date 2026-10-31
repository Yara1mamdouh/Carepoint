/**
 * Centralized Projects Data
 * 
 * Rules:
 * 1. Exactly 9 projects, with the first 3 prioritized at the top of the section.
 * 2. Only two categories:
 *    - "Category A": GitHub + Image (real repository and real screenshot available)
 *    - "Category B": Image Only (screenshots available, but NO GitHub repository)
 * 3. Book Rental System and Java Desktop Application are strictly Category B (Image Only).
 * 4. Image URLs should be public HTTPS URLs (e.g. Cloudinary). When empty (""),
 *    a designed SVG placeholder is displayed.
 * 5. GitHub and Demo URLs: empty ("") when unavailable. Never invent URLs.
 */

export const projectsData = [
  // --- First: Strongest Projects (Priority Ordering) ---
  {
    id: "code-academy",
    title: "Code Academy",
    subtitle: "Educational Platform for Programming Curriculums",
    description:
      "Built an educational platform for organizing programming and computer science curriculum content. Implemented interactive learning components, responsive layouts, and structured course and unit navigation.",
    technologies: ["Angular", "Bootstrap", "TypeScript", "HTML5", "CSS3"],
    category: "Category A", // Configurable GitHub + Image
    isPriority: true,
    // Add public HTTPS image URLs (e.g. from Cloudinary)
    imageUrl: "",
    screenshots: [],
    // Add real GitHub URL when available; leave empty to hide button
    githubUrl: "",
    demoUrl: ""
  },
  {
    id: "blood-bank-management",
    title: "Blood Bank Management System",
    subtitle: "Healthcare Data & Inventory Management",
    description:
      "Developed a blood bank management application using .NET technologies. Implemented backend functionality for managing blood-bank data, CRUD operations, and database integration.",
    technologies: [".NET", "ASP.NET Core", "C#", "SQL Server", "EF Core"],
    category: "Category A",
    isPriority: true,
    imageUrl: "",
    screenshots: [],
    githubUrl: "",
    demoUrl: ""
  },
  {
    id: "restaurant-recipe",
    title: "Restaurant Recipe",
    subtitle: "Recipe Catalog & Culinary REST API",
    description:
      "Built a restaurant and recipe application using Node.js. Implemented backend application logic and REST API functionality for handling restaurant and recipe data.",
    technologies: ["Node.js", "JavaScript", "REST APIs", "CRUD", "Express"],
    category: "Category A",
    isPriority: true,
    imageUrl: "",
    screenshots: [],
    githubUrl: "",
    demoUrl: ""
  },

  // --- Remaining Projects ---
  {
    id: "carepoint-pro",
    title: "CarePoint Pro",
    subtitle: "Integrated Clinic Management System",
    description:
      "Developed an integrated clinic web application using Angular and Node.js, providing a structured platform for managing clinic operations and connecting frontend interfaces with backend services.",
    technologies: ["Angular", "Node.js", "TypeScript", "REST APIs", "CSS3"],
    category: "Category A",
    isPriority: false,
    imageUrl: "",
    screenshots: [],
    githubUrl: "",
    demoUrl: ""
  },
  {
    id: "cravers",
    title: "Cravers",
    subtitle: "Full-Stack Web Application",
    description:
      "Developed a full-stack web application with a responsive user interface and structured application logic. Implemented core user-facing functionality and integrated frontend components with backend services.",
    technologies: ["JavaScript", "HTML5", "CSS3", "REST APIs", "Full Stack"],
    category: "Category A",
    isPriority: false,
    imageUrl: "",
    screenshots: [],
    githubUrl: "",
    demoUrl: ""
  },
  {
    id: "book-rental-system",
    title: "Book Rental System",
    subtitle: "Desktop Rental & Catalog Management Application",
    description:
      "Developed a desktop book rental system with a graphical interface, SQLite database integration, sample data generation using Faker, and PDF report generation using ReportLab.",
    technologies: ["Python", "Tkinter", "SQLite", "Faker", "ReportLab"],
    category: "Category B", // Strictly Category B: Image Only (no GitHub repo)
    isPriority: false,
    imageUrl: "",
    screenshots: [],
    githubUrl: "", // No repository
    demoUrl: ""
  },
  {
    id: "java-desktop-app",
    title: "Java Desktop Application",
    subtitle: "Sports Store Desktop Application",
    description:
      "Developed a desktop sports store application using Java, implementing core application functionality and object-oriented programming concepts.",
    technologies: ["Java", "OOP", "Swing / Desktop UI"],
    category: "Category B", // Strictly Category B: Image Only (no GitHub repo)
    isPriority: false,
    imageUrl: "",
    screenshots: [],
    githubUrl: "", // No repository
    demoUrl: ""
  },
  {
    id: "quran-recitation",
    title: "Quran Recitation Website",
    subtitle: "Responsive Audio & Recitation Platform",
    description:
      "Built a responsive website for Quran recitation using HTML, CSS, Bootstrap, and JavaScript.",
    technologies: ["HTML5", "CSS3", "Bootstrap", "JavaScript"],
    category: "Category A",
    isPriority: false,
    imageUrl: "",
    screenshots: [],
    githubUrl: "",
    demoUrl: ""
  },
  {
    id: "restaurant-website",
    title: "Restaurant Website",
    subtitle: "Dynamic Hospitality & Menu Web Platform",
    description:
      "Developed a restaurant website using PHP with structured web pages and frontend styling.",
    technologies: ["PHP", "HTML5", "CSS3", "Frontend Styling"],
    category: "Category A",
    isPriority: false,
    imageUrl: "",
    screenshots: [],
    githubUrl: "",
    demoUrl: ""
  }
];
