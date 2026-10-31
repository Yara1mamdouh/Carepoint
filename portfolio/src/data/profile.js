/**
 * Centralized Profile Data
 * Contains personal information, contact links, and portrait configuration.
 * 
 * NOTE FOR YARA:
 * To display your personal photo, simply paste your hosted image URL (e.g. from Cloudinary)
 * into `portraitUrl` below. The layout and frame will seamlessly display your photo!
 */
export const profileData = {
  fullName: "Yara Mamdouh Khfagi",
  title: "Full Stack Developer | .NET & Node.js",
  greeting: "Hello, I'm",
  shortBio:
    "Computer Science and Artificial Intelligence student at Benha University with a strong focus on Full Stack Development and Backend Engineering. Experienced in building robust applications with .NET, Node.js, and modern web technologies.",
  
  // Exact professional summary specified in requirements
  aboutSummary:
    "I am a Computer Science and Artificial Intelligence student at Benha University with a strong interest in Full Stack Development and Backend Engineering. I have hands-on experience building web applications using .NET, Node.js, and modern frontend technologies. Through academic projects and technical training, I have developed practical skills in designing, developing, and working with database-driven applications. I am continuously improving my technical and problem-solving abilities and looking for opportunities to grow as a Full Stack or Backend Developer.",

  highlights: [
    {
      title: "Computer Science & AI Student",
      subtitle: "Benha University (Expected 2027)",
      icon: "academic"
    },
    {
      title: "Full Stack Development",
      subtitle: "End-to-end web architectures",
      icon: "layers"
    },
    {
      title: "Backend Development",
      subtitle: ".NET, ASP.NET Core & Node.js",
      icon: "server"
    },
    {
      title: "Continuous Learning",
      subtitle: "Algorithmic thinking & modern tech",
      icon: "trending"
    }
  ],

  location: "Shibin El Qanater, Qalyubia, Egypt",
  phone: "01015549475",
  email: "yarakhfagi@gmail.com",
  linkedin: "https://linkedin.com/in/yara-khfagi/",
  github: "https://github.com/Yara1mamdouh",

  // Hosted public HTTPS portrait URL (e.g. Cloudinary).
  // Leave empty ("") to show the designed placeholder frame.
  portraitUrl: "",

  languages: [
    {
      name: "Arabic",
      level: "Native"
    },
    {
      name: "English",
      level: "" // Level left unstated as per source of truth
    }
  ]
};
