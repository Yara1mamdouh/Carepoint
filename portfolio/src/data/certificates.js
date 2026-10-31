/**
 * Centralized Certifications & Training Data
 * 
 * Rules:
 * 1. MTEC Academy must be marked "In Progress".
 * 2. No invented dates, IDs, or fake certificate images.
 * 3. `imageUrl` and `linkedinPostUrl` are configurable; empty strings indicate
 *    that the asset is pending user upload.
 */
export const certificatesData = [
  {
    id: "depi-fullstack-dotnet",
    title: "Full Stack .NET Developer",
    issuer: "Digital Egypt Pioneers Initiative (DEPI)",
    issuerShort: "DEPI",
    details: "Round 4",
    status: "Completed",
    isInProgress: false,
    description:
      "Comprehensive government-sponsored initiative focusing on enterprise .NET ecosystem, ASP.NET Core web APIs, Entity Framework Core, SQL Server, and full-stack integration.",
    skillsGained: ["ASP.NET Core", ".NET", "C#", "EF Core", "SQL Server"],
    imageUrl: "", // Add public HTTPS URL (e.g. Cloudinary) when available
    linkedinPostUrl: "" // Add real LinkedIn post URL if available
  },
  {
    id: "nti-mean-stack",
    title: "MEAN Stack",
    issuer: "National Telecommunication Institute (NTI)",
    issuerShort: "NTI",
    details: "Summer Training",
    status: "Completed",
    isInProgress: false,
    description:
      "Intensive technical summer training covering the full JavaScript ecosystem: MongoDB, Express.js, Angular, and Node.js for modern cloud-native web architectures.",
    skillsGained: ["Angular", "Node.js", "Express", "REST APIs", "JavaScript"],
    imageUrl: "",
    linkedinPostUrl: ""
  },
  {
    id: "gupco-technical-training",
    title: "Technical Training",
    issuer: "Gulf of Suez Petroleum Company (GUPCO)",
    issuerShort: "GUPCO",
    details: "Corporate Technical Training",
    status: "Completed",
    isInProgress: false,
    description:
      "Hands-on professional technical training program exposing engineering workflows, IT systems, and industrial software operations at GUPCO.",
    skillsGained: ["Technical Operations", "Systems Engineering", "Team Collaboration"],
    imageUrl: "",
    linkedinPostUrl: ""
  },
  {
    id: "mtec-fullstack-nodejs",
    title: "Full Stack Node.js",
    issuer: "MTEC Academy",
    issuerShort: "MTEC",
    details: "Professional Development Program",
    status: "In Progress", // Strictly "In Progress"
    isInProgress: true,
    description:
      "Advanced backend and full-stack curriculum diving deep into asynchronous Node.js microservices, backend security, caching, database modeling, and scalable APIs.",
    skillsGained: ["Node.js", "REST APIs", "Backend Engineering", "Asynchronous Architecture"],
    imageUrl: "",
    linkedinPostUrl: ""
  }
];
