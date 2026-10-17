export type CoverageRegion = { name: string; districts: string[]; note?: string };
// Geographic navigation catalog only. No claim of operational coverage or verified disaster observations.
export const pakistanRegions: CoverageRegion[] = [
  { name: "Sindh", districts: ["Karachi", "Hyderabad", "Thatta", "Badin", "Sukkur", "Larkana", "Dadu", "Jamshoro", "Khairpur", "Jacobabad"] },
  { name: "Punjab", districts: ["Lahore", "Rawalpindi", "Multan", "Faisalabad", "Sialkot", "Bahawalpur", "Dera Ghazi Khan", "Rajanpur"] },
  { name: "Khyber Pakhtunkhwa", districts: ["Peshawar", "Swat", "Charsadda", "Nowshera", "Dera Ismail Khan", "Chitral", "Mansehra"] },
  { name: "Balochistan", districts: ["Quetta", "Gwadar", "Lasbela", "Jaffarabad", "Naseerabad", "Kech", "Khuzdar"] },
  { name: "Islamabad Capital Territory", districts: ["Islamabad"] },
  { name: "Gilgit-Baltistan", districts: ["Gilgit", "Skardu", "Hunza", "Ghizer", "Diamer"] },
  { name: "Azad Jammu & Kashmir", districts: ["Muzaffarabad", "Mirpur", "Poonch", "Neelum", "Kotli"] },
];
export const KARACHI_PILOT = "Malir (Cantt side)";
