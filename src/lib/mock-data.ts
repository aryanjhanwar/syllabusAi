import type { GraphData } from "@/types/graph";

export function generateMockGraph(fileNames: string[]): GraphData {
  const src = fileNames[0] || "syllabus.pdf";
  return {
    nodes: [
      { id: "vars", label: "Variables & Data Types", category: "foundation", description: "Fundamental building blocks for storing data in programs.", prerequisites: [], importance: "high", sourceFile: src },
      { id: "control", label: "Control Flow", category: "foundation", description: "If/else statements, loops, and program flow control.", prerequisites: ["vars"], importance: "high", sourceFile: src },
      { id: "functions", label: "Functions", category: "foundation", description: "Reusable blocks of code that perform specific tasks.", prerequisites: ["vars", "control"], importance: "high", sourceFile: src },
      { id: "arrays", label: "Arrays & Collections", category: "foundation", description: "Data structures for storing ordered collections of elements.", prerequisites: ["vars"], importance: "high", sourceFile: src },
      { id: "oop", label: "Object-Oriented Programming", category: "intermediate", description: "Programming paradigm based on objects and classes.", prerequisites: ["functions", "vars"], importance: "high", sourceFile: src },
      { id: "inheritance", label: "Inheritance & Polymorphism", category: "intermediate", description: "Mechanism for code reuse through class hierarchies.", prerequisites: ["oop"], importance: "medium", sourceFile: src },
      { id: "ds", label: "Data Structures", category: "intermediate", description: "Advanced structures: trees, graphs, hash tables.", prerequisites: ["arrays", "oop"], importance: "high", sourceFile: src },
      { id: "algo", label: "Algorithms", category: "intermediate", description: "Sorting, searching, and optimization techniques.", prerequisites: ["ds", "functions"], importance: "high", sourceFile: src },
      { id: "complexity", label: "Time & Space Complexity", category: "intermediate", description: "Big-O analysis for algorithm efficiency.", prerequisites: ["algo"], importance: "medium", sourceFile: src },
      { id: "recursion", label: "Recursion", category: "intermediate", description: "Functions that call themselves to solve sub-problems.", prerequisites: ["functions", "control"], importance: "medium", sourceFile: src },
      { id: "dp", label: "Dynamic Programming", category: "advanced", description: "Optimization technique using memoization and tabulation.", prerequisites: ["recursion", "complexity"], importance: "high", sourceFile: src },
      { id: "graphs", label: "Graph Algorithms", category: "advanced", description: "BFS, DFS, shortest paths, minimum spanning trees.", prerequisites: ["ds", "algo"], importance: "medium", sourceFile: src },
      { id: "design", label: "Design Patterns", category: "advanced", description: "Reusable solutions to common software design problems.", prerequisites: ["oop", "inheritance"], importance: "medium", sourceFile: src },
      { id: "system", label: "System Design", category: "advanced", description: "Architecture of large-scale distributed systems.", prerequisites: ["design", "algo", "ds"], importance: "high", sourceFile: src },
    ],
    edges: [
      { id: "e1", source: "vars", target: "control", relationship: "enables" },
      { id: "e2", source: "vars", target: "arrays", relationship: "enables" },
      { id: "e3", source: "control", target: "functions", relationship: "builds on" },
      { id: "e4", source: "vars", target: "functions", relationship: "uses" },
      { id: "e5", source: "functions", target: "oop", relationship: "leads to" },
      { id: "e6", source: "oop", target: "inheritance", relationship: "extends" },
      { id: "e7", source: "arrays", target: "ds", relationship: "evolves into" },
      { id: "e8", source: "oop", target: "ds", relationship: "applies" },
      { id: "e9", source: "ds", target: "algo", relationship: "supports" },
      { id: "e10", source: "functions", target: "algo", relationship: "uses" },
      { id: "e11", source: "algo", target: "complexity", relationship: "analyzed by" },
      { id: "e12", source: "functions", target: "recursion", relationship: "special case" },
      { id: "e13", source: "control", target: "recursion", relationship: "uses" },
      { id: "e14", source: "recursion", target: "dp", relationship: "optimizes" },
      { id: "e15", source: "complexity", target: "dp", relationship: "motivates" },
      { id: "e16", source: "ds", target: "graphs", relationship: "applies to" },
      { id: "e17", source: "algo", target: "graphs", relationship: "extends" },
      { id: "e18", source: "oop", target: "design", relationship: "inspires" },
      { id: "e19", source: "inheritance", target: "design", relationship: "uses" },
      { id: "e20", source: "design", target: "system", relationship: "informs" },
      { id: "e21", source: "algo", target: "system", relationship: "requires" },
      { id: "e22", source: "ds", target: "system", relationship: "requires" },
    ],
  };
}
