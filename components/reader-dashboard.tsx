"use client";

import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  Sparkles, 
  Upload, 
  X, 
  Search, 
  Trash2, 
  Book, 
  ArrowRight, 
  Loader2, 
  Check, 
  Plus, 
  Maximize2, 
  Minimize2, 
  BookOpenCheck,
  Languages,
  ScrollText,
  Bookmark,
  ChevronRight,
  Eye,
  Type as FontIcon,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";

interface Paragraph {
  id: string;
  sequence: number;
  arabicText: string;
  translationText: string;
  type: string;
  pageNumber: number;
  lineNumber: number;
  babId?: string;
  subBabId?: string;
}

interface SubBab {
  id: string;
  number: number;
  title: string;
  babId: string;
}

interface Bab {
  id: string;
  number: number;
  title: string;
  subBabs: SubBab[];
}

interface Jilid {
  id: string;
  number: number;
  title: string;
  babs: Bab[];
}

interface Kitab {
  id: string;
  title: string;
  author: string;
  genre: string;
  era: string;
  description: string;
  _count?: {
    paragraphs: number;
  };
  jilids?: Jilid[];
  paragraphs?: Paragraph[];
}

export default function ReaderDashboard() {
  const [kitabs, setKitabs] = useState<Kitab[]>([]);
  const [selectedKitab, setSelectedKitab] = useState<Kitab | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingKitabs, setIsLoadingKitabs] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Reader Customization settings
  const [fontSize, setFontSize] = useState<"xs" | "sm" | "md" | "lg" | "xl">("md");
  const [themeMode, setThemeMode] = useState<"light" | "sepia" | "dark">("sepia");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"modern" | "a4">("modern");
  const [showTranslationInA4, setShowTranslationInA4] = useState<boolean>(true);

  // Selection states for navigation
  const [activeBabId, setActiveBabId] = useState<string | null>(null);
  const [activeSubBabId, setActiveSubBabId] = useState<string | null>(null);

  // Import Modal fields
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importTitle, setImportTitle] = useState("");
  const [importAuthor, setImportAuthor] = useState("");
  const [importGenre, setImportGenre] = useState("");
  const [importEra, setImportEra] = useState("");
  const [importContent, setImportContent] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // Progressive Parser State Setup
  const [dragActive, setDragActive] = useState(false);
  const [progressiveLogs, setProgressiveLogs] = useState<string[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [totalChunksCount, setTotalChunksCount] = useState(0);
  const [progressiveStatus, setProgressiveStatus] = useState<"idle" | "parsing" | "completed" | "error">("idle");
  const [paragraphsAddedCount, setParagraphsAddedCount] = useState(0);
  const [activeSegmentTitle, setActiveSegmentTitle] = useState({ bab: "Pendahuluan", subBab: "Umum" });
  const [fileNameUploaded, setFileNameUploaded] = useState("");

  useEffect(() => {
    fetchKitabs();
  }, []);

  const fetchKitabs = async () => {
    setIsLoadingKitabs(true);
    try {
      const res = await fetch("/api/kitabs");
      if (res.ok) {
        const data = await res.json();
        setKitabs(data);
        // Automatically select the first kitab if available and none selected
        if (data.length > 0 && !selectedKitab) {
          handleKitabSelection(data[0].id);
        }
      }
    } catch (err) {
      console.error("Gagal mengambil daftar kitab:", err);
    } finally {
      setIsLoadingKitabs(false);
    }
  };

  const handleKitabSelection = async (id: string) => {
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/kitabs/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedKitab(data);
        // Reset selections
        setActiveBabId(null);
        setActiveSubBabId(null);
      }
    } catch (err) {
      console.error("Gagal memuat detail kitab:", err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleDeleteKitab = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Apakah Anda yakin ingin menghapus kitab ini beserta seluruh struktur & paragrafnya?")) {
      return;
    }

    try {
      const res = await fetch(`/api/kitabs/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        if (selectedKitab?.id === id) {
          setSelectedKitab(null);
        }
        await fetchKitabs();
      }
    } catch (err) {
      console.error("Gagal menghapus kitab:", err);
    }
  };

  // Helper to add live analytical parsing logs
  const addLog = (msg: string) => {
    const timeStr = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setProgressiveLogs(prev => [...prev, `[${timeStr}] ${msg}`]);
  };

  // Drag and drop setup handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processUploadedFile = (file: File) => {
    if (file && (file.type === "text/plain" || file.name.endsWith(".txt"))) {
      setFileNameUploaded(file.name);
      
      // Auto-extract Title from filename
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      if (!importTitle) {
        setImportTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          setImportContent(text);
          addLog(`Berhasil memuat file "${file.name}" (${text.length.toLocaleString()} karakter).`);
        }
      };
      reader.readAsText(file);
    } else {
      alert("Hanya mendukung file teks .txt saja.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  // Import Book - Progressive AI Chunk-by-Chunk Parsing
  const handleImportKitab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importTitle || !importContent.trim()) return;

    setIsImporting(true);
    setProgressiveStatus("parsing");
    setParagraphsAddedCount(0);
    setProgressiveLogs([]);
    
    // Split content into chunks of roughly ~8000 characters without truncating lines
    const text = importContent;
    const chunkSize = 8000;
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      let end = start + chunkSize;
      if (end < text.length) {
        // Find trailing newline to split at logical line breaks
        const lastNewline = text.lastIndexOf("\n", end);
        if (lastNewline > start + chunkSize / 2) {
          end = lastNewline;
        }
      } else {
        end = text.length;
      }
      chunks.push(text.substring(start, end).trim());
      start = end;
    }

    setTotalChunksCount(chunks.length);
    setCurrentChunkIndex(0);
    
    addLog(`Memulai analisis naskah: "${importTitle}"`);
    addLog(`Teks dislice menjadi ${chunks.length} potongan porsi sedang.`);

    try {
      // Step 1: Create Kitab Container first to get the unified Kitab ID
      addLog(`Menyiapkan wadah Kitab baru di database...`);
      const containerRes: Response = await fetch("/api/kitabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: importTitle,
          author: importAuthor || "Anonim",
          genre: importGenre || "Kajian",
          era: importEra || "Klasik",
          description: `Diimport otomatis secara progresif berbasis naskah mentah (${chunks.length} potongan text).`
        })
      });

      const containerData = await containerRes.json();
      if (!containerRes.ok || !containerData.id) {
        throw new Error(containerData.error || "Gagal membuat wadah Kitab.");
      }

      const kitabId = containerData.id;
      addLog(`Wadah Kitab berhasil dibuat (ID: ${kitabId}). Memulai penguraian linguistik...`);

      let activeBabId: string | null = null;
      let activeSubBabId: string | null = null;
      let runningParaCount = 0;

      // Step 2: Loop sequentially in non-blocking fashion
      for (let i = 0; i < chunks.length; i++) {
        setCurrentChunkIndex(i);
        addLog(`[Potongan ${i + 1}/${chunks.length}] Mengirim naskah ke Gemini AI...`);

        const chunkRes: Response = await fetch("/api/kitabs/parse-chunk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kitabId,
            chunkText: chunks[i],
            chunkIndex: i,
            totalChunks: chunks.length,
            initialBabId: activeBabId,
            initialSubBabId: activeSubBabId
          })
        });

        const chunkData = await chunkRes.json();
        if (!chunkRes.ok || chunkData.error) {
          throw new Error(chunkData.error || `Gagal memproses potongan ke-${i+1}`);
        }

        // Keep track of parent structures dynamically returned by server
        activeBabId = chunkData.activeBabId;
        activeSubBabId = chunkData.activeSubBabId;
        runningParaCount += chunkData.paragraphsAdded;
        
        setParagraphsAddedCount(runningParaCount);
        setActiveSegmentTitle({
          bab: chunkData.activeBabTitle || "Pendahuluan",
          subBab: chunkData.activeSubBabTitle || "Umum"
        });

        addLog(`[Potongan ${i + 1}/${chunks.length}] Sukses! Bab aktif: "${chunkData.activeBabTitle}". Menambahkan +${chunkData.paragraphsAdded} paragraf.`);
      }

      // Step 3: Progressive parsed successfully completed
      setProgressiveStatus("completed");
      addLog(`--- ALL CHUNKS PROCESSED SUCCESSFULLY ---`);
      addLog(`Total paragraf komprehensif teranalisa & disimpan: ${runningParaCount}.`);
      
      // Select the newly imported kitab
      await fetchKitabs();
      await handleKitabSelection(kitabId);

      confetti({
        particleCount: 180,
        spread: 90,
        origin: { y: 0.5 }
      });

    } catch (err: any) {
      console.error("Progressive loading parsing error:", err);
      setProgressiveStatus("error");
      addLog(`🚨 ERROR: ${err.message || "Gagal mengurai potongan naskah."}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreateMockSample = async () => {
    setIsLoadingKitabs(true);
    try {
      const res = await fetch("/api/kitabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Kitab Al-Waraqat (SAMPEL)",
          author: "Imam Al-Juwaini",
          genre: "Ushul Fiqh",
          era: "Abad ke-5 Hijriyah",
          description: "Sampel risalah klasik tentang kaidah hukum Ushul Fiqh untuk pengujian MAktabah AI."
        })
      });
      const kitabData = await res.json();
      if (res.ok && kitabData.id) {
        // We will seed 3 manual sample chunks for the newly created kitab
        const sampleText = `BAB MUKADDIMAH
هَذِهِ وَرَقَاتٌ تَشْتَمِلُ عَلَى مَعْرِفَةِ فُصُولٍ مِنْ أُصُولِ الْفِقْهِ
Ini adalah beberapa lembar kertas yang memuat bab-bab penjelas tentang Ushul Fiqh.
SUB_BAB PENGERTIAN USHUL FIQH
وَذَلِكَ لَفْظٌ مُؤَلَّفٌ مِنْ جُزْأَيْنِ مُفْرَدَيْنِ
Ushul Fiqh terdiri dari susunan penggabungan dua kata tunggal.
فَالْأَصْلُ مَا يُبْنَى عَلَيْهِ غَيْرُهُ
Arti dari Al-Asl (pokok atau dasar) adalah fondasi di mana hal selainnya dibangun di atasnya.
وَالْفَرْعُ مَا يُبْنَى عَلَى غَيْرِهِ
Sedangkan Al-Far'u (cabang) adalah segala bentuk perkara yang dibangun di atas fondasi selainnya.`;

        await fetch("/api/kitabs/parse-chunk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kitabId: kitabData.id,
            chunkText: sampleText,
            chunkIndex: 0,
            totalChunks: 1
          })
        });

        await fetchKitabs();
        await handleKitabSelection(kitabData.id);
        confetti({ particleCount: 80, spread: 60 });
      }
    } catch (e) {
      console.error("Seeding failed", e);
    } finally {
      setIsLoadingKitabs(false);
    }
  };

  // Filter paragraphs based on currently selected Chapter / Sub-chapter and search queries
  const getFilteredParagraphs = () => {
    if (!selectedKitab || !selectedKitab.paragraphs) return [];
    
    return selectedKitab.paragraphs.filter((p) => {
      // 1. Chapter selection filter
      if (activeBabId && p.babId !== activeBabId) return false;
      
      // 2. Sub-chapter selection filter
      if (activeSubBabId && p.subBabId !== activeSubBabId) return false;

      // 3. Category/Type filter
      if (filterType !== "ALL" && p.type !== filterType) return false;

      // 4. Word lookup query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesArabic = p.arabicText.includes(query);
        const matchesTranslation = p.translationText.toLowerCase().includes(query);
        return matchesArabic || matchesTranslation;
      }

      return true;
    });
  };

  // Extract all chapters structured nicely
  const getStructuredChapters = () => {
    if (!selectedKitab || !selectedKitab.jilids) return [];
    // Accumulate all chapters from all volumes
    const list: { id: string; title: string; number: number; subBabs: SubBab[] }[] = [];
    selectedKitab.jilids.forEach((j) => {
      if (j.babs) {
        j.babs.forEach((b) => {
          list.push(b);
        });
      }
    });
    return list;
  };

  const getThemeClasses = () => {
    switch (themeMode) {
      case "dark":
        return {
          bg: "bg-[#181615] border-stone-800 text-stone-200",
          cardClass: "bg-[#22201e]/80 border-stone-800/60 shadow-xl",
          textArabic: "text-[#ecdcc2] font-semibold",
          textTranslate: "text-stone-300",
          cardBorder: "border-stone-800",
          sidebar: "bg-[#1d1b1a] border-stone-800 text-stone-200",
          headBg: "bg-[#242120] border-stone-800"
        };
      case "sepia":
        return {
          bg: "bg-[#FAF6F0] border-[#E8DFC9] text-[#2C2519]",
          cardClass: "bg-[#FDFAF6] border-[#ECE3CE] shadow-sm hover:shadow-md",
          textArabic: "text-[#5C3A21] font-bold",
          textTranslate: "text-[#4A3E2E] leading-relaxed",
          cardBorder: "border-[#ECE3CE]",
          sidebar: "bg-[#F4EFE3] border-[#E8DFC9] text-[#2C2112]",
          headBg: "bg-[#ECE5D4] border-[#DECFA4]"
        };
      case "light":
      default:
        return {
          bg: "bg-white border-stone-200 text-stone-900",
          cardClass: "bg-stone-50/70 border-stone-200 shadow-sm hover:shadow",
          textArabic: "text-neutral-900 font-bold",
          textTranslate: "text-stone-700 leading-relaxed",
          cardBorder: "border-stone-200",
          sidebar: "bg-stone-50 border-stone-200 text-stone-800",
          headBg: "bg-stone-100 border-stone-200"
        };
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case "xs":
        return { arabic: "text-base md:text-lg", translation: "text-[11px]" };
      case "sm":
        return { arabic: "text-lg md:text-xl", translation: "text-[12px]" };
      case "lg":
        return { arabic: "text-2xl md:text-3xl", translation: "text-sm md:text-md" };
      case "xl":
        return { arabic: "text-3xl md:text-4xl", translation: "text-md md:text-lg" };
      case "md":
      default:
        return { arabic: "text-xl md:text-2xl", translation: "text-xs md:text-sm" };
    }
  };

  const theme = getThemeClasses();
  const fontClass = getFontSizeClass();
  const filteredParagraphs = getFilteredParagraphs();
  const structuredChapters = getStructuredChapters();

  const getA4ThemeStyles = () => {
    return {
      pageBg: "bg-white text-black border-stone-300 shadow-md",
      headerText: "text-black border-black/80",
      matanBox: "bg-transparent border-black text-black",
      syarahText: "text-black",
      hasyahText: "text-black border-black",
      lineColor: "border-black/80",
      pageNo: "text-black font-medium"
    };
  };

  const getA4FontSizeStyles = () => {
    switch (fontSize) {
      case "xs":
        return {
          matanText: "text-xs md:text-sm font-bold leading-normal text-black",
          matanLineHeight: "1.7",
          syarahText: "text-[11px] md:text-xs text-black",
          syarahLineHeight: "1.7",
          hasyahText: "text-[9px] md:text-[10px] text-black font-medium",
          translationText: "text-[10px] md:text-[11px] text-black leading-normal",
        };
      case "sm":
        return {
          matanText: "text-sm md:text-base font-bold leading-relaxed text-black",
          matanLineHeight: "1.9",
          syarahText: "text-[13px] md:text-sm text-black",
          syarahLineHeight: "1.9",
          hasyahText: "text-[10px] md:text-[11px] text-black font-medium",
          translationText: "text-[11px] md:text-xs text-black leading-normal",
        };
      case "lg":
        return {
          matanText: "text-xl md:text-2xl font-bold leading-loose text-black",
          matanLineHeight: "2.4",
          syarahText: "text-[19px] md:text-[21px] text-black",
          syarahLineHeight: "2.3",
          hasyahText: "text-xs md:text-sm text-black font-medium",
          translationText: "text-xs md:text-[13px] text-black leading-relaxed",
        };
      case "xl":
        return {
          matanText: "text-2xl md:text-3xl font-bold leading-loose text-black",
          matanLineHeight: "2.6",
          syarahText: "text-[21px] md:text-[23px] text-black",
          syarahLineHeight: "2.5",
          hasyahText: "text-sm md:text-base text-black font-medium",
          translationText: "text-sm md:text-base text-black leading-relaxed",
        };
      case "md":
      default:
        return {
          matanText: "text-base md:text-lg font-bold leading-loose text-black",
          matanLineHeight: "2.1",
          syarahText: "text-[15px] md:text-[17px] text-black",
          syarahLineHeight: "2.0",
          hasyahText: "text-[11px] md:text-xs text-black font-medium",
          translationText: "text-xs md:text-sm text-black leading-relaxed",
        };
    }
  };

  const a4Theme = getA4ThemeStyles();
  const a4Font = getA4FontSizeStyles();

  // Grouping filtered paragraphs into pages for A4 layout based strictly on Bab (Chapter) changes
  const getA4Pages = () => {
    if (!filteredParagraphs || filteredParagraphs.length === 0) return [];
    
    // Resolve chapter titles to label pages beautifully
    const babTitlesMap: { [key: string]: string } = {};
    if (selectedKitab && selectedKitab.jilids) {
      selectedKitab.jilids.forEach((j) => {
        if (j.babs) {
          j.babs.forEach((b) => {
            babTitlesMap[b.id] = b.title;
          });
        }
      });
    }

    const pagesList: { pageNum: number; babTitle: string; paragraphs: Paragraph[] }[] = [];
    
    let currentPageParagraphs: Paragraph[] = [];
    let currentBabId: string | null = null;
    let pageCount = 1;

    filteredParagraphs.forEach((p, index) => {
      const pBabId = p.babId || "default_intro";
      if (index === 0) {
        currentBabId = pBabId;
        currentPageParagraphs.push(p);
      } else if (pBabId !== currentBabId) {
        // We have a new BAB! Start a new page
        const bTitle = currentBabId && babTitlesMap[currentBabId] ? babTitlesMap[currentBabId] : "Pendahuluan";
        pagesList.push({
          pageNum: pageCount++,
          babTitle: bTitle,
          paragraphs: [...currentPageParagraphs].sort((a, b) => a.sequence - b.sequence),
        });
        currentBabId = pBabId;
        currentPageParagraphs = [p];
      } else {
        currentPageParagraphs.push(p);
      }
    });

    // Don't forget the last group
    if (currentPageParagraphs.length > 0) {
      const bTitle = currentBabId && babTitlesMap[currentBabId] ? babTitlesMap[currentBabId] : "Pendahuluan";
      pagesList.push({
        pageNum: pageCount,
        babTitle: bTitle,
        paragraphs: [...currentPageParagraphs].sort((a, b) => a.sequence - b.sequence),
      });
    }

    return pagesList;
  };

  const a4Pages = getA4Pages();

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden font-sans bg-stone-100/60 p-0 lg:p-2 gap-2">
      
      {/* LEFT SIDEBAR: BOOK MANAGEMENT & CHAPTERS */}
      <div className={`w-full lg:w-80 flex flex-col rounded-3xl overflow-hidden shrink-0 shadow-lg border transition ${theme.sidebar}`}>
        
        {/* Sidebar Brand & Metadata */}
        <div className="p-4.5 border-b border-stone-200/60 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-extrabold flex items-center gap-2 text-amber-950">
              <ScrollText className="w-5.5 h-5.5 text-amber-900 animate-pulse" />
              MAktabah AI
            </h2>
            <button 
              onClick={() => {
                setImportTitle("");
                setImportContent("");
                setImportAuthor("");
                setImportGenre("");
                setImportEra("");
                setFileNameUploaded("");
                setIsImportOpen(true);
              }}
              className="p-2 bg-amber-900 hover:bg-amber-950 text-white rounded-xl transition flex items-center gap-1 cursor-pointer shadow"
              title="Unggah Kitab Baru"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Unggah</span>
            </button>
          </div>

          <p className="text-[10px] text-stone-500 leading-relaxed">
            Kaji pustaka Arab klasik dengan pemetaan otomatis Gemini AI. Segmentasi instan, pemisahan syarah, & penterjemahan progresif.
          </p>
        </div>

        {/* List of Kitabs */}
        <div className="p-3 border-b border-stone-200/50">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-2 px-1">
            Daftar Kitab yang Dimuat
          </span>
          {isLoadingKitabs ? (
            <div className="flex items-center justify-center py-6 gap-2 text-stone-600">
              <Loader2 className="w-4 h-4 animate-spin text-amber-900" />
              <span className="text-xs">Memuat katalog kitab...</span>
            </div>
          ) : kitabs.length === 0 ? (
            <div className="text-center py-5 space-y-2.5 px-2 bg-stone-100 rounded-2xl border border-dashed border-stone-300">
              <p className="text-[10.5px] text-stone-500 italic">Belum ada kitab di database.</p>
              <button 
                onClick={handleCreateMockSample}
                className="text-[10px] font-bold tracking-tight bg-amber-800/10 text-amber-900 hover:bg-amber-800/20 px-3 py-1.5 rounded-lg transition"
              >
                Muat Kitab Contoh (.txt)
              </button>
            </div>
          ) : (
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {kitabs.map((kitab) => (
                <div 
                  key={kitab.id}
                  onClick={() => handleKitabSelection(kitab.id)}
                  className={`p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between gap-2 border ${
                    selectedKitab?.id === kitab.id 
                      ? "bg-amber-950/10 border-amber-800/40 text-amber-950" 
                      : "bg-white/80 hover:bg-white border-stone-200 text-stone-700"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Book className={`w-4 h-4 shrink-0 ${selectedKitab?.id === kitab.id ? "text-amber-800" : "text-stone-400"}`} />
                    <div className="truncate">
                      <h4 className="text-[11.5px] font-serif font-bold truncate pr-1">{kitab.title}</h4>
                      <p className="text-[9.5px] text-stone-500 truncate mt-0.5">{kitab.author} • {kitab.genre}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] bg-stone-200/90 text-stone-600 font-mono px-1.5 py-0.5 rounded font-bold">
                      {kitab._count?.paragraphs || 0} p
                    </span>
                    <button 
                      onClick={(e) => handleDeleteKitab(kitab.id, e)}
                      className="p-1 hover:bg-red-50 text-stone-400 hover:text-red-700 rounded transition"
                      title="Hapus Kitab"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Table of Contents for the selected Kitab */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 bg-stone-150/40 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
              Daftar Isi (Bab & Segmen)
            </span>
            {(activeBabId || activeSubBabId) && (
              <button 
                onClick={() => {
                  setActiveBabId(null);
                  setActiveSubBabId(null);
                }}
                className="text-[9px] text-amber-900 hover:underline font-bold"
              >
                Reset Filter
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {!selectedKitab ? (
              <p className="text-stone-500 text-[10.5px] text-center italic py-10">Pilih atau unggah kitab terlebih dahulu.</p>
            ) : structuredChapters.length === 0 ? (
              <p className="text-stone-500 text-[10.5px] text-center italic py-10">Belum ada segmen Bab dalam kitab ini.</p>
            ) : (
              structuredChapters.map((b) => (
                <div key={b.id} className="space-y-1">
                  {/* Chapter title header */}
                  <div 
                    onClick={() => {
                      setActiveBabId(b.id);
                      setActiveSubBabId(null);
                    }}
                    className={`p-2 rounded-xl text-left cursor-pointer transition flex items-center justify-between text-xs font-serif ${
                      activeBabId === b.id && !activeSubBabId
                        ? "bg-amber-950 text-white font-bold" 
                        : activeBabId === b.id 
                          ? "bg-amber-100 text-amber-950 font-bold border border-amber-800/20"
                          : "hover:bg-amber-400/10 text-stone-800 hover:text-amber-950"
                    }`}
                  >
                    <span className="truncate">Bab {b.number}: {b.title}</span>
                    <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />
                  </div>

                  {/* SubBab lists under active/selected chapter */}
                  {b.subBabs && b.subBabs.length > 0 && (
                    <div className="pl-3.5 space-y-1 py-0.5 border-l border-stone-350">
                      {b.subBabs.map((sub) => (
                        <div 
                          key={sub.id}
                          onClick={() => {
                            setActiveBabId(b.id);
                            setActiveSubBabId(sub.id);
                          }}
                          className={`p-1.5 rounded-lg text-left cursor-pointer transition text-[10.5px] flex items-center justify-between ${
                            activeSubBabId === sub.id
                              ? "bg-amber-900 text-white font-semibold"
                              : "hover:bg-stone-200 text-stone-600 hover:text-stone-900"
                          }`}
                        >
                          <span className="truncate">{sub.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* RIGHT WORKSPACE: READING AND TEXT VIEW */}
      <div className={`flex-1 flex flex-col rounded-3xl overflow-hidden border shadow-lg transition ${theme.bg}`}>
        
        {/* Top bar controls */}
        <div className={`p-4 border-b shrink-0 flex flex-col md:flex-row gap-3 items-center justify-between ${theme.headBg}`}>
          
          {/* Metadata information */}
          {selectedKitab ? (
            <div className="w-full md:w-auto text-left">
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-base md:text-lg font-bold tracking-tight text-amber-950">
                  {selectedKitab.title}
                </h1>
                <span className="text-[9.5px] bg-amber-800/15 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                  {selectedKitab.genre}
                </span>
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5">
                Oleh <strong className="text-stone-700">{selectedKitab.author}</strong> • Era {selectedKitab.era}
              </p>
            </div>
          ) : (
            <div className="text-left w-full md:w-auto">
              <h1 className="font-serif text-md font-bold text-stone-800">MAktabah AI Workspace</h1>
              <p className="text-[10px] text-stone-500">Mulai unggah berkas teks arab & terjemahan untuk melihat visualisasinya.</p>
            </div>
          )}

          {/* Practical filters/controls buttons */}
          <div className="w-full md:w-auto flex flex-wrap items-center gap-2.5">

            {/* View Mode: Modern Dual Column Row vs A4 Classical Manuscript Page */}
            <div className="flex bg-stone-200/60 p-1 rounded-xl text-[10.5px] border border-stone-300/40 font-semibold text-stone-700">
              <button
                onClick={() => setViewMode("modern")}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                  viewMode === "modern" ? "bg-white text-amber-950 shadow-sm font-bold" : "hover:text-stone-900 text-stone-500"
                }`}
                title="Tampilan baris-per-baris sejajar terjemahan"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-900/80" />
                Kolom Sejajar
              </button>
              <button
                onClick={() => setViewMode("a4")}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                  viewMode === "a4" ? "bg-white text-amber-950 shadow-sm font-bold" : "hover:text-stone-900 text-stone-500"
                }`}
                title="Tampilan kontinu halaman A4 naskah kuning"
              >
                <ScrollText className="w-3.5 h-3.5 text-amber-900/80" />
                Kitab Klasik (A4)
              </button>
            </div>

            {/* Sub-toggle translation options for A4 view */}
            {viewMode === "a4" && (
              <div className="flex bg-amber-950/5 p-1 rounded-xl text-[10.5px] border border-stone-300/40 font-semibold text-stone-700">
                <button
                  onClick={() => setShowTranslationInA4(true)}
                  className={`px-2 py-0.5 rounded-md transition ${showTranslationInA4 ? "bg-white text-amber-950 shadow-sm font-bold" : "text-stone-500"}`}
                >
                  + Terjemahan
                </button>
                <button
                  onClick={() => setShowTranslationInA4(false)}
                  className={`px-2 py-0.5 rounded-md transition ${!showTranslationInA4 ? "bg-white text-amber-950 shadow-sm font-bold" : "text-stone-500"}`}
                >
                  Teks Arab
                </button>
              </div>
            )}
            
            {/* Context paragraph-type filter */}
            <div className="flex bg-stone-200/60 p-1 rounded-xl text-[10.5px] text-stone-700 border border-stone-300/40">
              {["ALL", "MATAN", "SYARAH", "QURAN"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-2.5 py-1 rounded-lg transition font-semibold cursor-pointer ${
                    filterType === f ? "bg-white text-amber-950 shadow-sm" : "hover:text-stone-900"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Font size picker dropdown */}
            <div className="flex bg-stone-200/60 p-1 rounded-xl text-[10.5px] border border-stone-300/40">
              <button 
                onClick={() => setFontSize("xs")}
                className={`w-8 py-1 rounded-lg transition font-mono ${fontSize === "xs" ? "bg-white text-stone-900 shadow-sm font-bold" : "text-stone-600"}`}
                title="XS"
              >
                A--
              </button>
              <button 
                onClick={() => setFontSize("sm")}
                className={`w-7 py-1 rounded-lg transition font-mono ${fontSize === "sm" ? "bg-white text-stone-900 shadow-sm font-bold" : "text-stone-600"}`}
                title="S"
              >
                A-
              </button>
              <button 
                onClick={() => setFontSize("md")}
                className={`w-7 py-1 rounded-lg transition font-mono ${fontSize === "md" ? "bg-white text-stone-900 shadow-sm font-bold" : "text-stone-600"}`}
                title="M"
              >
                A
              </button>
              <button 
                onClick={() => setFontSize("lg")}
                className={`w-7 py-1 rounded-lg transition font-mono ${fontSize === "lg" ? "bg-white text-stone-900 shadow-sm font-bold" : "text-stone-600"}`}
                title="L"
              >
                A+
              </button>
              <button 
                onClick={() => setFontSize("xl")}
                className={`w-7 py-1 rounded-lg transition font-mono ${fontSize === "xl" ? "bg-white text-stone-900 shadow-sm font-bold" : "text-stone-600"}`}
                title="XL"
              >
                A++
              </button>
            </div>

            {/* Reading Mode Theme controls */}
            <div className="flex bg-stone-200/60 p-1 rounded-xl text-[10.5px] border border-stone-300/40">
              <button
                onClick={() => setThemeMode("light")}
                className={`px-2.5 py-1 rounded-lg transition ${themeMode === "light" ? "bg-white text-stone-900 shadow-sm font-bold" : "text-stone-600"}`}
              >
                Terang
              </button>
              <button
                onClick={() => setThemeMode("sepia")}
                className={`px-2.5 py-1 rounded-lg transition ${themeMode === "sepia" ? "bg-amber-950 text-amber-100 shadow-sm font-bold" : "text-stone-600"}`}
              >
                Kertas
              </button>
              <button
                onClick={() => setThemeMode("dark")}
                className={`px-2.5 py-1 rounded-lg transition ${themeMode === "dark" ? "bg-[#333130] text-[#ecdcc2] shadow-sm font-bold" : "text-stone-600"}`}
              >
                Malam
              </button>
            </div>

          </div>
        </div>

        {/* Search bar inside reader */}
        {selectedKitab && (
          <div className="px-4.5 py-2.5 border-b border-stone-200 flex items-center justify-between bg-stone-200/10">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Cari lafazh arab atau arti terjemahan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-white border border-stone-300/80 rounded-xl pl-9.5 pr-3 py-2 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/15"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 hover:text-stone-700 text-stone-400 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-[10px] text-stone-500 font-mono">
              Muncul <strong className="text-stone-800">{filteredParagraphs.length}</strong> hasil pencarian
            </div>
          </div>
        )}

        {/* PARAGRAPH BLOCKS: THE CORE READER SCREEN */}
        <div className={`flex-1 overflow-y-auto transition-all duration-300 ${
          viewMode === "a4" 
            ? "bg-stone-300/25 p-4 md:p-8 space-y-6 flex flex-col items-center" 
            : "p-4 md:p-6 space-y-4"
        }`}>
          {isLoadingDetail ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-stone-600">
              <Loader2 className="w-7 h-7 animate-spin text-amber-900" />
              <p className="font-serif text-sm italic">Menghubungkan visualisasi data kitab...</p>
            </div>
          ) : !selectedKitab ? (
            <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto space-y-4.5 bg-white/40 border border border-stone-200/60 p-6 rounded-3xl">
              <ScrollText className="w-12 h-12 text-amber-900/40" />
              <div className="space-y-1">
                <h3 className="font-serif text-base font-bold text-stone-805">Selamat Datang di MAktabah AI</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  MAktabah AI adalah tempat perlindungan naskah klasik Anda. Unggah teks mentah Anda sekarang, dan rasakan keajaiban analisis bertenaga Gemini yang menyusun halaman Anda ke dalam bab dan matan rapi.
                </p>
              </div>
              <button
                onClick={() => {
                  setImportTitle("");
                  setImportContent("");
                  setImportAuthor("");
                  setImportGenre("");
                  setImportEra("");
                  setFileNameUploaded("");
                  setIsImportOpen(true);
                }}
                className="bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Unggah Kitab Pertama Anda
              </button>
            </div>
          ) : filteredParagraphs.length === 0 ? (
            <div className="text-center py-20 bg-stone-100/50 rounded-2xl border border-dashed border-stone-250">
              <p className="text-xs text-stone-500 italic font-mono">Tidak ada paragraf yang cocok dengan filter aktif.</p>
            </div>
          ) : viewMode === "a4" ? (
            /* NEW BEAUTIFUL A4 VIEW MODE (CONTINUOUS VERTICAL SCROLL AS PDF) */
            <div className="w-full space-y-8 py-2">
              {a4Pages.map((page) => {
                const matans = page.paragraphs.filter((p) => {
                  const t = (p.type || "").toUpperCase();
                  return t === "MATAN" || t === "QURAN" || t === "HADITH";
                });
                const syarahs = page.paragraphs.filter((p) => {
                  const t = (p.type || "").toUpperCase();
                  return t === "SYARAH" || t === "COMMENTARY" || t === "BODY";
                });
                const hasyahs = page.paragraphs.filter((p) => {
                  const t = (p.type || "").toUpperCase();
                  return t === "TALIQ" || t === "FOOTNOTE" || (!["MATAN", "QURAN", "HADITH", "SYARAH", "COMMENTARY", "BODY"].includes(t));
                });

                return (
                  <div
                    key={page.pageNum}
                    id={`page-${page.pageNum}`}
                    className={`w-full max-w-[210mm] min-h-[297mm] mx-auto p-10 md:p-16 border rounded-sm flex flex-col justify-between relative shadow-xl hover:shadow-2xl transition-all duration-300 ${a4Theme.pageBg}`}
                    style={{ pageBreakAfter: "always" }}
                  >
                    {/* Page Header (Academic Header Zone) */}
                    <div className={`flex justify-between items-center text-[10px] md:text-[11px] pb-2 border-b mb-6 tracking-wide font-sans md:px-2 ${a4Theme.headerText}`}>
                      <span className="font-bold text-black">{selectedKitab.title}</span>
                      <span className="hidden md:inline font-amiri text-black/70 text-sm">التَّحْقِيقُ العِلْمِيُّ</span>
                      <span className="italic text-black font-semibold">{selectedKitab.author}</span>
                    </div>

                    {/* Chapter Title / Bab Title */}
                    {page.babTitle && (
                      <div className="text-center py-2 mb-4">
                        <h4 className="font-amiri text-base md:text-lg font-bold tracking-wide text-black">
                          {page.babTitle}
                        </h4>
                        <div className="flex items-center justify-center gap-2 mt-1 opacity-40">
                          <div className={`w-12 border-t ${a4Theme.lineColor}`} />
                          <span className="text-[10px] text-black">✦</span>
                          <div className={`w-12 border-t ${a4Theme.lineColor}`} />
                        </div>
                      </div>
                    )}

                    {/* Content Section */}
                    <div className="flex-1 flex flex-col justify-start space-y-5">
                      {/* 1. ZONA MATAN (Top centered bracketed/framed critical block) */}
                      {matans.length > 0 && (
                        <div className={`py-4 px-6 md:px-8 border-y-2 border-double border-black my-1 text-center relative ${a4Theme.matanBox}`}>
                          <div className="space-y-3">
                            {matans.map((p) => (
                              <div key={p.id} className="space-y-2">
                                <p 
                                  className={`font-amiri text-justify-arabic leading-relaxed text-center font-bold tracking-wide select-all ${a4Font.matanText}`} 
                                  dir="rtl"
                                  style={{ lineHeight: a4Font.matanLineHeight }}
                                >
                                  {p.arabicText}
                                </p>
                                {showTranslationInA4 && p.translationText && (
                                  <p className={`text-black font-sans italic max-w-2xl mx-auto border-t border-black/20 pt-1.5 text-center ${a4Font.translationText}`}>
                                    {p.translationText}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Traditional Divider if both Matan and Syarah exist on the page */}
                      {matans.length > 0 && syarahs.length > 0 && (
                        <div className="flex items-center justify-center gap-3 py-0.5 opacity-40">
                          <div className={`w-20 border-t ${a4Theme.lineColor}`} />
                          <span className="text-[11px] text-black font-amiri">۞</span>
                          <div className={`w-20 border-t ${a4Theme.lineColor}`} />
                        </div>
                      )}

                      {/* 2. ZONA SYARAH (Middle Prose Flow - Academic Style) */}
                      {syarahs.length > 0 && (
                        <div className="space-y-4 flex-1 py-1">
                          {syarahs.map((p) => (
                            <div key={p.id} className="space-y-2">
                              {/* Clean flow: No badges, lines, or background labels */}
                              <p 
                                className={`font-naskh text-justify-arabic text-right font-medium text-black ${a4Font.syarahText}`}
                                dir="rtl"
                                style={{ lineHeight: a4Font.syarahLineHeight }}
                              >
                                {p.arabicText}
                              </p>
                              {showTranslationInA4 && p.translationText && (
                                <p className={`font-sans leading-relaxed text-black text-left md:text-justify pl-4 border-l-2 border-black/40 italic mb-3 ${a4Font.translationText}`}>
                                  {p.translationText}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 3. ZONA HASYAH / TALIQ (Standard Academic Footnotes at Bottom) */}
                    {hasyahs.length > 0 && (
                      <div className="mt-6 pt-3 border-t border-black text-left space-y-2.5">
                        {/* Elegant classical print-ready footnote separator rule on the right */}
                        <div className="flex justify-end pr-1 mb-1">
                          <div className="w-1/4 border-t border-black" />
                        </div>
                        
                        <div className="space-y-2 font-sans">
                          {hasyahs.map((p, hIdx) => (
                            <div key={p.id} className="text-black leading-relaxed pl-1 max-w-full">
                              <div className="flex flex-col space-y-1">
                                {p.arabicText && (
                                  <div className="flex justify-end items-start gap-1">
                                    <p className={`font-amiri text-right font-bold text-black flex-1 leading-relaxed ${a4Font.hasyahText}`} dir="rtl">
                                      {p.arabicText}
                                    </p>
                                    <span className="font-serif font-bold text-[9.5px] text-black mt-0.5">[{hIdx + 1}]</span>
                                  </div>
                                )}
                                {showTranslationInA4 && p.translationText && (
                                  <p className={`italic text-black/90 font-sans leading-relaxed pl-6 text-left ${a4Font.translationText}`}>
                                    {!p.arabicText && <span className="font-bold mr-1">[{hIdx + 1}]</span>}
                                    {p.translationText}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Page Number (Scholarly Footer) */}
                    <div className={`flex justify-center items-center text-[10px] md:text-[11px] mt-4 pt-2 border-t border-black/20 font-serif ${a4Theme.pageNo}`}>
                      <span>Halaman {page.pageNum}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ORIGINAL MODERN PARAGRAPH CARDS */
            filteredParagraphs.map((para) => (
              <div
                key={para.id}
                className={`p-4 md:p-5 border rounded-2xl transition flex flex-col md:flex-row gap-4.5 hover:border-amber-900/30 ${theme.cardClass} ${theme.cardBorder}`}
              >
                
                {/* TRANSLATION SECTION (LEFT SIDE / TOP ON MOBILE) */}
                <div className="flex-1 text-left space-y-2 order-2 md:order-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-amber-900/10 text-amber-900 font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                      {para.type || "MATAN"}
                    </span>
                    <span className="text-[9px] text-stone-400 font-mono">
                      Hal. {para.pageNumber} • Baris {para.lineNumber} • Seq. {para.sequence}
                    </span>
                  </div>

                  <p className={`font-serif tracking-normal leading-relaxed ${fontClass.translation} ${theme.textTranslate}`}>
                    {para.translationText || <span className="text-stone-400 italic">Terjemahan kosong atau sedang diuraikan...</span>}
                  </p>
                </div>

                {/* ARABIC SCRIPT SECTION (RIGHT SIDE / SEPARATED BY RECENT STYLES) */}
                <div className="flex-1 text-right space-y-2 order-1 md:order-2 border-b md:border-b-0 md:border-l border-dashed border-stone-200/80 pb-3 md:pb-0 md:pl-4.5">
                  <div className="flex items-center justify-end gap-1.5 md:hidden">
                    <span className="text-[9.5px] italic text-stone-500 font-serif">Naskah Asli:</span>
                  </div>
                  
                  {/* Classical font fallback */}
                  <p 
                    className={`font-serif leading-loose tracking-wide md:leading-loose text-right dir-rtl select-all ${fontClass.arabic} ${theme.textArabic}`}
                    dir="rtl"
                  >
                    {para.arabicText}
                  </p>
                </div>

              </div>
            ))
          )}
        </div>

      </div>

      {/* IMPORT PROGRESSIVE AI MODAL */}
      <AnimatePresence>
        {isImportOpen && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (progressiveStatus !== "parsing") {
                  setIsImportOpen(false);
                  setProgressiveStatus("idle");
                }
              }}
              className="fixed inset-0 bg-black/60"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-2xl relative z-120 overflow-hidden shadow-2xl border border-stone-200"
            >
              {/* Header */}
              <div className="bg-gradient-to-tr from-amber-800 to-amber-950 p-5.5 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-200" />
                    MAKtabah AI Progressive Parser
                  </h3>
                  <p className="text-[10px] text-amber-200/80 mt-0.5">
                    Segmentasi otomatis naskah besar secara berkala berbasis kecerdasan buatan Gemini
                  </p>
                </div>
                {progressiveStatus !== "parsing" && (
                  <button 
                    onClick={() => {
                      setIsImportOpen(false);
                      setProgressiveStatus("idle");
                    }} 
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {progressiveStatus === "idle" ? (
                // FORM & DROPZONE VIEW
                <form onSubmit={handleImportKitab} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">Judul Kitab:</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Al-Asma' wa As-Sifat"
                        value={importTitle}
                        onChange={(e) => setImportTitle(e.target.value)}
                        className="w-full text-xs p-2.5 bg-neutral-50 border border-stone-300 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">Nama Pengarang (Muwallif):</label>
                      <input
                        type="text"
                        placeholder="e.g. Imam Al-Bayhaqi"
                        value={importAuthor}
                        onChange={(e) => setImportAuthor(e.target.value)}
                        className="w-full text-xs p-2.5 bg-neutral-50 border border-stone-300 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">Genre Kitab:</label>
                      <input
                        type="text"
                        placeholder="e.g. Aqidah, Fiqh, Tafsir"
                        value={importGenre}
                        onChange={(e) => setImportGenre(e.target.value)}
                        className="w-full text-xs p-2.5 bg-neutral-50 border border-stone-300 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">Era Masa Hidup:</label>
                      <input
                        type="text"
                        placeholder="e.g. Abad ke-4 Hijriyah"
                        value={importEra}
                        onChange={(e) => setImportEra(e.target.value)}
                        className="w-full text-xs p-2.5 bg-neutral-50 border border-stone-300 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>

                  {/* DRAG & DROP FILE ZONE */}
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition flex flex-col items-center justify-center cursor-pointer ${
                      dragActive ? "border-amber-600 bg-amber-50/25" : "border-stone-300 bg-neutral-50 hover:bg-neutral-100/40"
                    }`}
                  >
                    <input 
                      type="file"
                      id="txt-file-input"
                      accept=".txt"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <label htmlFor="txt-file-input" className="cursor-pointer flex flex-col items-center">
                      <div className="p-3 bg-amber-100 text-amber-900 rounded-full mb-2.5">
                        <Upload className="w-6 h-6" />
                      </div>
                      {fileNameUploaded ? (
                        <div>
                          <p className="text-xs font-semibold text-stone-800">File terpilih: {fileNameUploaded}</p>
                          <p className="text-[10px] text-stone-500 mt-1">Ukurannya: {importContent.length.toLocaleString()} karakter. Siap dihitung progresif!</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-semibold text-stone-800">Lepaskan file naskah .txt Anda di sini, atau klik untuk merambah</p>
                          <p className="text-[10px] text-stone-500 mt-1">Mendukung file teks ukuran sangat besar (berangsur diproses tanpa lag)</p>
                        </div>
                      )}
                    </label>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-stone-600 uppercase">Atau Tempel / Edit Isi Manual:</label>
                      {importContent && (
                        <button 
                          type="button" 
                          onClick={() => {
                            setImportContent("");
                            setFileNameUploaded("");
                          }}
                          className="text-[10px] text-red-700 hover:underline"
                        >
                          Clear Text
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={6}
                      required={!fileNameUploaded}
                      placeholder="Tempel teks kitab Anda di sini jika tidak mengunggah file..."
                      value={importContent}
                      onChange={(e) => setImportContent(e.target.value)}
                      className="w-full text-xs p-3 bg-neutral-50 border border-stone-300 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-dashed border-stone-300">
                    <button
                      type="button"
                      onClick={() => {
                        setIsImportOpen(false);
                      }}
                      className="px-4.5 py-2 border border-stone-300 rounded-xl text-xs text-stone-700 hover:bg-neutral-50 transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={!importTitle || !importContent.trim()}
                      className="bg-amber-900 hover:bg-amber-950 text-white font-semibold px-5 py-2 rounded-xl text-xs transition flex gap-1.5 items-center cursor-pointer shadow disabled:opacity-55"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                      Mulai Penguraian AI
                    </button>
                  </div>
                </form>
              ) : (
                // COMPILING / PARSING / PROGRESS VIEW PANEL
                <div className="p-6 space-y-4 bg-stone-50/50">
                  <div className="bg-white p-4.5 rounded-2xl border border-stone-200/80 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Sedang Memproses</span>
                        <h4 className="font-serif text-sm font-semibold text-stone-900">{importTitle}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-amber-900">
                          {currentChunkIndex + 1} / {totalChunksCount} Potongan
                        </span>
                        <p className="text-[10px] text-stone-500">Porsi Naskah Terproses</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r from-amber-700 to-amber-900 transition-all duration-300 ${
                          progressiveStatus === "completed" ? "bg-green-600" : ""
                        }`}
                        style={{ width: `${Math.round(((currentChunkIndex + 1) / totalChunksCount) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                      <span>Progres Kompilasi: {Math.round(((currentChunkIndex + 1) / totalChunksCount) * 100)}%</span>
                      {progressiveStatus === "parsing" ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin text-amber-900" />
                          Memproses penggalan berikutnya...
                        </span>
                      ) : progressiveStatus === "completed" ? (
                        <span className="text-green-700 font-bold">✓ Selesai Sempurna!</span>
                      ) : (
                        <span className="text-red-700 font-bold">⚠ Terjadi Sela Hambatan</span>
                      )}
                    </div>
                  </div>

                  {/* Micro stats */}
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="bg-white p-2.5 rounded-xl border border-stone-200/70 shadow-sm">
                      <p className="text-[10px] text-stone-500">Paragraf Tersusun</p>
                      <h5 className="text-sm font-bold text-amber-950 font-mono mt-0.5">{paragraphsAddedCount}</h5>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-stone-200/70 shadow-sm">
                      <p className="text-[10px] text-stone-500">Bab Aktif</p>
                      <h5 className="text-xs font-serif font-semibold text-amber-950 truncate mt-1" title={activeSegmentTitle.bab}>
                        {activeSegmentTitle.bab}
                      </h5>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-stone-200/70 shadow-sm col-span-1">
                      <p className="text-[10px] text-stone-500">Sub-Bab Aktif</p>
                      <h5 className="text-xs font-serif font-semibold text-amber-950 truncate mt-1" title={activeSegmentTitle.subBab}>
                        {activeSegmentTitle.subBab}
                      </h5>
                    </div>
                  </div>

                  {/* Operational Terminal Log Console */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wide">Journal Hasil Penguraian (Sistem Real-Time):</span>
                    <div className="bg-[#151718] text-[#a9b1b6] font-mono text-[10.5px] p-4 rounded-xl border border-neutral-800 h-44 overflow-y-auto space-y-1">
                      {[...progressiveLogs].reverse().map((log, lIdx) => (
                        <div key={lIdx} className="leading-relaxed border-b border-white/[0.03] pb-1">
                          <span className={`${
                            log.includes("🚨") ? "text-rose-400" :
                            log.includes("Sukses!") || log.includes("SUCCESS") ? "text-green-400 font-semibold" :
                            log.includes("Wadah Kitab") ? "text-amber-300" : "text-stone-400"
                          }`}>
                            {log}
                          </span>
                        </div>
                      ))}
                      {progressiveLogs.length === 0 && (
                        <p className="text-xs text-stone-500 italic">Menunggu prosesor AI menyusun antrian...</p>
                      )}
                    </div>
                  </div>

                  {/* Buttons controls */}
                  <div className="flex justify-end pt-1 border-t border-dashed border-stone-300">
                    {progressiveStatus === "parsing" ? (
                      <div className="flex items-center gap-1.5 text-xs text-stone-500">
                        <Loader2 className="w-4 h-4 animate-spin text-amber-950" />
                        Harap tidak menutup layar ini selama penguraian berjalan...
                      </div>
                    ) : progressiveStatus === "completed" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsImportOpen(false);
                          setProgressiveStatus("idle");
                        }}
                        className="bg-green-700 hover:bg-green-850 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition shadow flex items-center gap-1.5 cursor-pointer animate-pulse"
                      >
                        <Check className="w-4 h-4" />
                        Tampilkan & Kaji Kitab Sekarang
                      </button>
                    ) : (
                      // Error trigger
                      <button
                        type="button"
                        onClick={() => {
                          setProgressiveStatus("idle");
                        }}
                        className="bg-amber-900 hover:bg-amber-950 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition shadow cursor-pointer"
                      >
                        Mulai Kembali (Form)
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
