export type Listing = {
  id: string;
  title: string;
  category: string;
  description: string;
  seller: string;
  price: string;
  size: string;
  purchases: string;
  blob: string;
  date: string;
  gradient: string;
};

export const listings: Listing[] = [
  {
    id: "terrain",
    title: "Global Satellite Terrain Dataset v4",
    category: "Datasets",
    description: "High-resolution topology data for GIS applications.",
    seller: "0x8b...f221",
    price: "45",
    size: "4.2 GB",
    purchases: "128+",
    blob: "blob_x7f2...a9c",
    date: "Oct 24, 2023",
    gradient: "from-slate-950 via-sky-950 to-amber-200",
  },
  {
    id: "crm",
    title: "Enterprise CRM Source Code",
    category: "Source Code",
    description: "A complete Sui-native CRM starter with Move contracts.",
    seller: "0x21...a9e4",
    price: "120.5",
    size: "850 MB",
    purchases: "54+",
    blob: "blob_92kL...u1p",
    date: "Oct 22, 2023",
    gradient: "from-blue-950 via-slate-800 to-cyan-500",
  },
  {
    id: "ml",
    title: "Machine Learning Training Set",
    category: "Datasets",
    description: "Cleaned CSV data for financial market prediction models.",
    seller: "0x4a...d3e1",
    price: "12.5",
    size: "1.8 GB",
    purchases: "38+",
    blob: "blob_0OVB...mz2",
    date: "Oct 24, 2023",
    gradient: "from-zinc-100 via-zinc-300 to-zinc-950",
  },
  {
    id: "ui",
    title: "Cyberpunk UI Kit Pro",
    category: "Documents",
    description: "High-fidelity Figma source files for modern dark dashboards.",
    seller: "0x99...e221",
    price: "8",
    size: "220 MB",
    purchases: "91+",
    blob: "blob_p55q...r88",
    date: "Oct 23, 2023",
    gradient: "from-fuchsia-200 via-indigo-400 to-zinc-950",
  },
  {
    id: "drone",
    title: "4K Drone Stock Footage Pack",
    category: "Video",
    description: "Royalty-free cinematic shots for launch films.",
    seller: "0x11...c221",
    price: "25",
    size: "9.5 GB",
    purchases: "75+",
    blob: "blob_88fG...x02",
    date: "Oct 22, 2023",
    gradient: "from-slate-200 via-blue-200 to-slate-950",
  },
  {
    id: "wallet",
    title: "Sui Wallet Extension v2.1",
    category: "Source Code",
    description: "React-based browser extension source for Sui wallets.",
    seller: "0xdd...ff10",
    price: "15",
    size: "410 MB",
    purchases: "63+",
    blob: "blob_ww12...tt1",
    date: "Oct 21, 2023",
    gradient: "from-cyan-900 via-violet-600 to-slate-950",
  },
];

export const libraryAssets = [
  {
    title: "Neural Engine Core Models",
    category: "AI Models",
    status: "Owned",
    action: "Fetch from Walrus",
    price: "",
    date: "Acquired: Oct 12, 2023",
    blob: "blob_x7f2...a9c",
    gradient: "from-zinc-100 via-zinc-300 to-zinc-950",
  },
  {
    title: "Cyberpunk 2077 Asset Pack",
    category: "3D Assets",
    status: "Your Listing",
    action: "View Listing",
    price: "125.5 SUI",
    date: "Listed: Nov 01, 2023",
    blob: "blob_92kL...u1p",
    gradient: "from-fuchsia-200 via-indigo-400 to-zinc-950",
  },
  {
    title: "Enterprise SQL Optimizer",
    category: "Software",
    status: "Owned",
    action: "Fetch from Walrus",
    price: "",
    date: "Acquired: Sep 28, 2023",
    blob: "blob_0OVB...mz2",
    gradient: "from-zinc-100 via-zinc-300 to-zinc-950",
  },
  {
    title: "High-Freq Crypto Bot V4",
    category: "Scripts",
    status: "Your Listing",
    action: "View Listing",
    price: "450.0 SUI",
    date: "Listed: Dec 15, 2023",
    blob: "blob_p55q...r88",
    gradient: "from-slate-800 via-zinc-700 to-red-950",
  },
  {
    title: "Abstract Gradient Collection",
    category: "Graphics",
    status: "Owned",
    action: "Fetch from Walrus",
    price: "",
    date: "Acquired: Jan 05, 2024",
    blob: "blob_ww12...tt1",
    gradient: "from-cyan-700 via-blue-800 to-violet-800",
  },
  {
    title: "Private Equity Data Pool",
    category: "Datasets",
    status: "Your Listing",
    action: "View Listing",
    price: "1,200 SUI",
    date: "Listed: Jan 12, 2024",
    blob: "blob_88fG...x02",
    gradient: "from-slate-200 via-teal-700 to-zinc-950",
  },
];
